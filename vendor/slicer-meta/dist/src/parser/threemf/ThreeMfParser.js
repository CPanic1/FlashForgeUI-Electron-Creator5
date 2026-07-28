"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreeMfParser = void 0;
const fs = __importStar(require("fs"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const fast_xml_parser_1 = require("fast-xml-parser");
const GCodeParser_1 = require("../gcode/GCodeParser");
const warning_translations_1 = require("./warning-translations");
/**
 * Parser for 3MF files, tested with Orca-FlashForge and FlashStudio output.
 * Extracts metadata from slice_info.config, plate image, and embedded G-code.
 */
class ThreeMfParser {
    constructor() {
        this.printerModelId = "Unknown";
        this.supportUsed = false;
        this.fileNames = [];
        this.filaments = [];
        this.plateImage = null; // Store as Base64 data URL
        this.warnings = [];
        this.firstLayerTime = null; // Seconds
        // Metadata extracted from the embedded G-code file
        this.slicerInfo = null;
        this.fileInfo = null;
        // XML Parser configuration
        this.xmlParser = new fast_xml_parser_1.XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            allowBooleanAttributes: true,
            parseAttributeValue: true,
            trimValues: true,
        });
        // Defaults are set via initializers
    }
    /**
     * Parses a 3MF file from the given path.
     * @param filePath Path to the 3MF file.
     * @returns The parser instance.
     * @throws Error if the file cannot be read, is not a valid ZIP, or required entries are missing/invalid.
     */
    parse(filePath) {
        var _a, _b, _c, _d, _e;
        let zip;
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            zip = new adm_zip_1.default(filePath);
        }
        catch (error) {
            console.error(`Error opening or reading 3MF file ${filePath}:`, error);
            throw new Error(`Failed to open or read 3MF file '${filePath}': ${error.message}`);
        }
        const zipEntries = zip.getEntries();
        // 1. Parse slice_info.config
        const configEntry = zipEntries.find((entry) => entry.entryName === 'Metadata/slice_info.config');
        if (configEntry) {
            try {
                const configContent = configEntry.getData().toString('utf8');
                if (fast_xml_parser_1.XMLValidator.validate(configContent) === true) {
                    const parsedXml = this.xmlParser.parse(configContent);
                    this.parseConfigXml(parsedXml);
                }
                else {
                    console.warn("slice_info.config XML validation failed.");
                    throw new Error("Invalid XML structure in slice_info.config.");
                }
            }
            catch (error) {
                console.error("Error parsing slice_info.config:", error);
                throw new Error(`Failed to parse slice_info.config: ${error.message}`);
            }
        }
        else {
            console.warn("Metadata/slice_info.config not found in 3MF archive.");
        }
        // 2. Extract Plate Image
        const imageEntry = zipEntries.find((entry) => entry.entryName.match(/^Metadata\/plate_\d+\.png$/));
        if (imageEntry) {
            try {
                const imageBuffer = imageEntry.getData();
                this.plateImage = `data:image/png;base64,${imageBuffer.toString('base64')}`;
            }
            catch (error) {
                console.error("Error extracting plate image:", error);
            }
        }
        else {
            console.warn("Plate image (e.g., Metadata/plate_1.png) not found in 3MF archive.");
        }
        // 3. Parse embedded g-code
        const gcodeEntry = zipEntries.find((entry) => entry.entryName.match(/^Metadata\/plate_\d+\.gcode$/));
        if (gcodeEntry) {
            try {
                const gcodeContent = gcodeEntry.getData();
                const gcodeParser = new GCodeParser_1.GCodeParser().parseFromContent(gcodeContent);
                this.slicerInfo = gcodeParser.slicerInfo;
                this.fileInfo = gcodeParser.fileInfo;
                if (this.printerModelId === "Unknown" && ((_a = this.fileInfo) === null || _a === void 0 ? void 0 : _a.printerModel) !== "Unknown") {
                    this.printerModelId = (_c = (_b = this.fileInfo) === null || _b === void 0 ? void 0 : _b.printerModel) !== null && _c !== void 0 ? _c : "Unknown";
                }
                // Create default filament info if not provided by slice_info
                if (this.filaments.length === 0 && this.fileInfo) {
                    if (this.fileInfo.filaments && this.fileInfo.filaments.length > 0) {
                        this.filaments = this.fileInfo.filaments;
                    }
                    else if (this.fileInfo.filamentType !== "Unknown") {
                        this.filaments.push({
                            id: "0",
                            type: this.fileInfo.filamentType,
                            color: "Unknown",
                            usedM: (_d = this.fileInfo.filamentUsedMM) === null || _d === void 0 ? void 0 : _d.toString(),
                            usedG: (_e = this.fileInfo.filamentUsedG) === null || _e === void 0 ? void 0 : _e.toString(),
                        });
                    }
                }
            }
            catch (error) {
                throw new Error(`Failed to parse embedded G-code: ${error.message}`);
            }
        }
        else {
            throw new Error("Embedded G-code is missing.");
        }
        return this;
    }
    /**
     * Parses the data extracted from the slice_info.config XML.
     * @param xmlData Parsed XML object from fast-xml-parser.
     */
    parseConfigXml(xmlData) {
        var _a, _b;
        const plate = (_a = xmlData === null || xmlData === void 0 ? void 0 : xmlData.config) === null || _a === void 0 ? void 0 : _a.plate;
        if (!plate) {
            console.warn("<plate> element not found or invalid structure in slice_info.config.");
            return;
        }
        const ensureArray = (item) => {
            if (!item)
                return [];
            return Array.isArray(item) ? item : [item];
        };
        // Parse Metadata
        const metadataItems = ensureArray(plate.metadata);
        const printerModelMeta = metadataItems.find(m => m['@_key'] === 'printer_model_id');
        if (printerModelMeta) {
            this.printerModelId = (_b = printerModelMeta['@_value']) !== null && _b !== void 0 ? _b : "Unknown";
        }
        const supportUsedMeta = metadataItems.find(m => m['@_key'] === 'support_used');
        if (supportUsedMeta) {
            this.supportUsed = supportUsedMeta['@_value'] === 'true' || supportUsedMeta['@_value'] === '1';
        }
        // Parse first layer time (optional — added in FlashStudio, may appear in future Orca releases)
        const firstLayerTimeMeta = metadataItems.find(m => m['@_key'] === 'first_layer_time');
        if (firstLayerTimeMeta) {
            const val = parseFloat(firstLayerTimeMeta['@_value']);
            if (!isNaN(val)) {
                this.firstLayerTime = val;
            }
        }
        // Parse Object Names
        const objectItems = ensureArray(plate.object);
        this.fileNames = objectItems.map(obj => obj['@_name']).filter(name => !!name);
        // Parse Filament Info
        const filamentItems = ensureArray(plate.filament);
        this.filaments = filamentItems.map((fil, index) => {
            var _a, _b;
            const rawId = fil['@_id'];
            const filamentInfo = {
                id: rawId === null || rawId === void 0 ? void 0 : rawId.toString(),
                type: fil['@_type'],
                color: fil['@_color'],
                usedM: (_a = fil['@_used_m']) === null || _a === void 0 ? void 0 : _a.toString(),
                usedG: (_b = fil['@_used_g']) === null || _b === void 0 ? void 0 : _b.toString(),
            };
            return filamentInfo;
        });
        // Parse Warnings (optional — added in FlashStudio)
        const warningItems = ensureArray(plate.warning);
        this.warnings = warningItems.map(w => {
            var _a, _b, _c;
            const msg = (_a = w['@_msg']) !== null && _a !== void 0 ? _a : '';
            return {
                msg,
                message: (0, warning_translations_1.translateWarning)(msg),
                level: (_b = w['@_level']) !== null && _b !== void 0 ? _b : 0,
                errorCode: (_c = w['@_error_code']) !== null && _c !== void 0 ? _c : '',
            };
        });
    }
}
exports.ThreeMfParser = ThreeMfParser;
