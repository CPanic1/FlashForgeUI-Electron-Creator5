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
exports.ThreeMfParser = exports.GXParser = exports.OrcaFamilyParser = exports.OrcaFlashForgeParser = exports.FlashPrintParser = exports.GCodeParser = exports.translateWarning = exports.SlicerFileMeta = exports.SlicerMeta = exports.SlicerType = void 0;
exports.parseSlicerFile = parseSlicerFile;
const GCodeParser_1 = require("./parser/gcode/GCodeParser");
const ThreeMfParser_1 = require("./parser/threemf/ThreeMfParser");
const path = __importStar(require("path"));
var SlicerType_1 = require("./SlicerType");
Object.defineProperty(exports, "SlicerType", { enumerable: true, get: function () { return SlicerType_1.SlicerType; } });
var SlicerMeta_1 = require("./SlicerMeta");
Object.defineProperty(exports, "SlicerMeta", { enumerable: true, get: function () { return SlicerMeta_1.SlicerMeta; } });
var SlicerFileMeta_1 = require("./SlicerFileMeta");
Object.defineProperty(exports, "SlicerFileMeta", { enumerable: true, get: function () { return SlicerFileMeta_1.SlicerFileMeta; } });
var warning_translations_1 = require("./parser/threemf/warning-translations");
Object.defineProperty(exports, "translateWarning", { enumerable: true, get: function () { return warning_translations_1.translateWarning; } });
var GCodeParser_2 = require("./parser/gcode/GCodeParser");
Object.defineProperty(exports, "GCodeParser", { enumerable: true, get: function () { return GCodeParser_2.GCodeParser; } });
var FlashPrintParser_1 = require("./parser/gcode/FlashPrintParser");
Object.defineProperty(exports, "FlashPrintParser", { enumerable: true, get: function () { return FlashPrintParser_1.FlashPrintParser; } });
var OrcaFlashForgeParser_1 = require("./parser/gcode/OrcaFlashForgeParser");
Object.defineProperty(exports, "OrcaFlashForgeParser", { enumerable: true, get: function () { return OrcaFlashForgeParser_1.OrcaFlashForgeParser; } });
var OrcaFamilyParser_1 = require("./parser/gcode/orca-family/OrcaFamilyParser");
Object.defineProperty(exports, "OrcaFamilyParser", { enumerable: true, get: function () { return OrcaFamilyParser_1.OrcaFamilyParser; } });
var GXParser_1 = require("./parser/gcode/GXParser");
Object.defineProperty(exports, "GXParser", { enumerable: true, get: function () { return GXParser_1.GXParser; } });
var ThreeMfParser_2 = require("./parser/threemf/ThreeMfParser");
Object.defineProperty(exports, "ThreeMfParser", { enumerable: true, get: function () { return ThreeMfParser_2.ThreeMfParser; } });
/**
 * Convenience function to parse a G-code or 3MF file automatically.
 * @param filePath Path to the file.
 * @returns A promise resolving to the parsed metadata.
 * @throws Error on parsing failure or unknown format.
 */
function parseSlicerFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.3mf') {
            const parser = new ThreeMfParser_1.ThreeMfParser().parse(filePath);
            return {
                slicer: parser.slicerInfo,
                file: parser.fileInfo,
                threeMf: {
                    printerModelId: parser.printerModelId,
                    supportUsed: parser.supportUsed,
                    fileNames: parser.fileNames,
                    filaments: parser.filaments,
                    plateImage: parser.plateImage,
                    warnings: parser.warnings,
                    firstLayerTime: parser.firstLayerTime,
                }
            };
        }
        else if (ext === '.gcode' || ext === '.g' || ext === '.gx') {
            const parser = new GCodeParser_1.GCodeParser();
            yield parser.parse(filePath);
            return {
                slicer: parser.slicerInfo,
                file: parser.fileInfo,
                threeMf: null
            };
        }
        else {
            console.warn(`Unknown file extension '${ext}'. Attempting G-code parse...`);
            try {
                const parser = new GCodeParser_1.GCodeParser();
                yield parser.parse(filePath);
                return {
                    slicer: parser.slicerInfo,
                    file: parser.fileInfo,
                    threeMf: null
                };
            }
            catch (gcodeError) {
                const message = gcodeError instanceof Error ? gcodeError.message : String(gcodeError);
                throw new Error(`Unsupported file extension '${ext}' and G-code parsing failed: ${message}`);
            }
        }
    });
}
