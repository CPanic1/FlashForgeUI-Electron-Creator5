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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GCodeParser = void 0;
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
const SlicerType_1 = require("../../SlicerType");
const FlashPrintParser_1 = require("./FlashPrintParser");
const OrcaFlashForgeParser_1 = require("./OrcaFlashForgeParser");
const GXParser_1 = require("./GXParser");
/**
 * AIO GCode Parser
 * Supports Orca-FlashForge, FlashPrint, and Legacy GX g-code files.
 */
class GCodeParser {
    constructor() {
        this.slicerInfo = null;
        this.fileInfo = null;
        // Properties initialized to null
    }
    /**
     * Parses a G-code file from the given file path.
     * Automatically detects the slicer type and delegates parsing.
     * @param filePath Path to the G-code or 3MF file.
     * @returns The parser instance for chaining or accessing results.
     * @throws Error if the file is unreadable, slicer type is unknown, or parsing fails.
     */
    parse(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            let slicerType;
            try {
                slicerType = yield this.getSlicerTypeFromFile(filePath);
            }
            catch (error) {
                throw new Error(`Failed to determine slicer type for ${filePath}: ${error.message}`);
            }
            if (slicerType === SlicerType_1.SlicerType.Unknown) {
                throw new Error("Cannot process file: sliced by unknown software or format unrecognized.");
            }
            try {
                let result;
                switch (slicerType) {
                    case SlicerType_1.SlicerType.FlashPrint:
                        result = FlashPrintParser_1.FlashPrintParser.parse(filePath);
                        this.slicerInfo = result.slicerMeta;
                        this.fileInfo = result.fileMeta;
                        break;
                    case SlicerType_1.SlicerType.OrcaFF:
                        // For simplicity, we re-read for now. Optimization possible later.
                        result = OrcaFlashForgeParser_1.OrcaFlashForgeParser.parse(filePath);
                        this.slicerInfo = result.slicerMeta;
                        this.fileInfo = result.fileMeta;
                        break;
                    case SlicerType_1.SlicerType.LegacyGX:
                        result = GXParser_1.GXParser.parse(filePath);
                        this.slicerInfo = result.slicerMeta;
                        this.fileInfo = result.fileMeta;
                        break;
                }
            }
            catch (parseError) {
                console.error(`Error parsing ${slicerType} file ${filePath}:`, parseError);
                throw new Error(`Failed to parse ${slicerType} file: ${parseError.message}`);
            }
            return this;
        });
    }
    /**
     * Parses G-code content provided as a string or Buffer.
     * Automatically detects the slicer type and delegates parsing.
     * @param content The G-code content.
     * @returns The parser instance for chaining or accessing results.
     * @throws Error if the slicer type is unknown or parsing fails.
     */
    parseFromContent(content) {
        const slicerType = this.getSlicerTypeFromContent(content);
        if (slicerType === SlicerType_1.SlicerType.Unknown) {
            throw new Error("Cannot process content: sliced by unknown software or format unrecognized.");
        }
        try {
            let result;
            switch (slicerType) {
                case SlicerType_1.SlicerType.FlashPrint:
                    result = FlashPrintParser_1.FlashPrintParser.parseFromContent(content);
                    this.slicerInfo = result.slicerMeta;
                    this.fileInfo = result.fileMeta;
                    break;
                case SlicerType_1.SlicerType.OrcaFF:
                    result = OrcaFlashForgeParser_1.OrcaFlashForgeParser.parseFromContent(content);
                    this.slicerInfo = result.slicerMeta;
                    this.fileInfo = result.fileMeta;
                    break;
                case SlicerType_1.SlicerType.LegacyGX:
                    result = GXParser_1.GXParser.parseFromContent(content);
                    this.slicerInfo = result.slicerMeta;
                    this.fileInfo = result.fileMeta;
                    break;
            }
        }
        catch (parseError) {
            console.error(`Error parsing ${slicerType} content:`, parseError);
            throw new Error(`Failed to parse ${slicerType} content: ${parseError.message}`);
        }
        return this;
    }
    /**
     * Checks if the file extension is typically associated with G-code or 3MF.
     * Note: This is a basic check and not reliable for format identification.
     * @param filePath The path to the file.
     * @returns True if the extension matches common formats, false otherwise.
     */
    isOkExt(filePath) {
        const lowerPath = filePath.toLowerCase();
        return lowerPath.endsWith(".g") || lowerPath.endsWith(".gcode") || lowerPath.endsWith(".gx") // G-code formats
            || lowerPath.endsWith(".3mf"); // 3MF format
    }
    /**
     * Determines the slicer type by reading the first line of a file.
     * @param filePath Path to the G-code file.
     * @returns The detected SlicerType.
     * @throws Error if the file cannot be read.
     */
    getSlicerTypeFromFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let stream = null;
                let rl = null;
                let header = null;
                let firstLineRead = false;
                let settled = false; // Prevent settling the promise twice
                const cleanupAndSettle = (error, result) => {
                    if (settled)
                        return; // Already resolved or rejected
                    settled = true;
                    // console.log(`Cleaning up for ${filePath}. Error: ${error}, Result: ${result}`);
                    if (rl) {
                        rl.close(); // This signals readline to stop reading
                        rl.removeAllListeners(); // Prevent memory leaks
                    }
                    if (stream && !stream.destroyed) {
                        stream.close(); // Close the underlying file stream
                        stream.removeAllListeners();
                    }
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(result !== null && result !== void 0 ? result : this.detectTypeFromHeader(header !== null && header !== void 0 ? header : ""));
                    }
                };
                try {
                    stream = fs.createReadStream(filePath, { encoding: 'utf8' });
                    rl = readline.createInterface({
                        input: stream,
                        crlfDelay: Infinity,
                    });
                    rl.on('line', (line) => {
                        if (!firstLineRead) {
                            // console.log(`First line read for ${filePath}: ${line}`); // Debug log
                            header = line.trim();
                            firstLineRead = true;
                            cleanupAndSettle(undefined, this.detectTypeFromHeader(header));
                        }
                    });
                    rl.on('close', () => {
                        cleanupAndSettle();
                    });
                    rl.on('error', (err) => {
                        console.error(`Readline error for ${filePath}:`, err);
                        cleanupAndSettle(err); // Reject with the error
                    });
                    stream.on('error', (err) => {
                        console.error(`Stream error for ${filePath}:`, err);
                        cleanupAndSettle(err); // Reject with the error
                    });
                    // stream.on('close', () => {
                    //     console.log(`Stream closed event for ${filePath}`);
                    // });
                }
                catch (syncErr) { // Catch synchronous errors (e.g., invalid path)
                    console.error(`Synchronous error setting up stream for ${filePath}:`, syncErr);
                    reject(syncErr);
                    settled = true;
                }
            });
        });
    }
    /**
     * Determines the slicer type from the first line of G-code content.
     * @param content G-code content as a string or Buffer.
     * @returns The detected SlicerType.
     */
    getSlicerTypeFromContent(content) {
        let header = null;
        const contentString = Buffer.isBuffer(content) ? content.toString('utf-8', 0, 512) : content; // Read start of buffer/string
        const newlineIndex = contentString.indexOf('\n');
        if (newlineIndex !== -1) {
            header = contentString.substring(0, newlineIndex).trim();
        }
        else {
            header = contentString.trim(); // Use the whole string if no newline
        }
        if (!header) {
            console.warn("G-code content seems empty.");
            return SlicerType_1.SlicerType.Unknown;
        }
        return this.detectTypeFromHeader(header);
    }
    /**
     * Detects SlicerType based on a header line.
     * @param header The header line string.
     * @returns The detected SlicerType.
     */
    detectTypeFromHeader(header) {
        // FlashPrint check
        if (header.startsWith(';generated by ffslicer')) {
            return SlicerType_1.SlicerType.FlashPrint;
        }
        // Orca check (covers Orca, Orca-FF, Bambu?)
        // Check for specific block start or thumbnail markers typical in OrcaSlicer forks
        if (header.startsWith('; HEADER_BLOCK_START') || header.startsWith('; THUMBNAIL_BLOCK_START') || header.startsWith('; thumbnail begin')) {
            // Further refinement could check for "; generated by Orca-Flashforge"
            // but the block structure is a strong indicator for Orca-like slicers.
            return SlicerType_1.SlicerType.OrcaFF;
        }
        // Legacy GX format check
        if (header.startsWith('xgcode 1.0')) {
            return SlicerType_1.SlicerType.LegacyGX;
        }
        // Add checks for other slicers here if needed (e.g., PrusaSlicer, Cura)
        // ; generated by PrusaSlicer
        // ;FLAVOR:Marlin
        // ;TIME:
        // ;Filament used:
        // ;Layer height:
        // ;Generated with Cura_SteamEngine
        console.warn(`Could not determine slicer type from header: "${header}"`);
        return SlicerType_1.SlicerType.Unknown;
    }
}
exports.GCodeParser = GCodeParser;
