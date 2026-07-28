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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GXParser = void 0;
const fs = __importStar(require("fs"));
const SlicerMeta_1 = require("../../SlicerMeta");
const SlicerFileMeta_1 = require("../../SlicerFileMeta");
const SlicerType_1 = require("../../SlicerType");
const ParserHelper_1 = require("../ParserHelper");
class GXParser {
    /**
     * Parses a .gx file from a file path.
     * @param filePath Path to the .gx file.
     * @returns An object containing SlicerMeta and SlicerFileMeta.
     * @throws Error if the file cannot be read.
     */
    static parse(filePath) {
        try {
            const fileBuffer = fs.readFileSync(filePath);
            return GXParser.parseFromContent(fileBuffer);
        }
        catch (error) {
            console.error(`Error reading or parsing .gx file ${filePath}:`, error);
            throw new Error(`Failed to read or parse .gx: ${filePath}`);
        }
    }
    /**
     * Parses .gx content from a Buffer.
     * @param content The .gx content as a Buffer.
     * @returns An object containing SlicerMeta and SlicerFileMeta.
     */
    static parseFromContent(content) {
        const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
        const slicerMeta = new SlicerMeta_1.SlicerMeta();
        const fileMeta = new SlicerFileMeta_1.SlicerFileMeta();
        fileMeta.sliceSoft = SlicerType_1.SlicerType.LegacyGX;
        try {
            // Check for standard FlashPrint first
            const isFlashPrintGX = GXParser.isFlashPrintGXFormat(buffer);
            // Extract the PNG thumbnail (both formats have this)
            GXParser.extractThumbnail(buffer, fileMeta);
            try {
                if (!isFlashPrintGX) {
                    // check for converted .gcode -> .gx information
                    const headerInfo = GXParser.findHeaderInformation(buffer);
                    if (headerInfo) {
                        console.log(`Found header info in binary search: ${headerInfo}`);
                        slicerMeta.fromGeneratedByString(SlicerType_1.SlicerType.LegacyGX, headerInfo);
                    }
                }
            }
            catch (headerError) {
                console.warn("Error searching for header in binary data:", headerError);
            }
            // Extract and parse content
            const gcode = GXParser.extractGcodeContent(buffer);
            GXParser.parseGcodeContent(gcode, slicerMeta, fileMeta, isFlashPrintGX);
            return { slicerMeta, fileMeta };
        }
        catch (error) {
            console.error("Error parsing Legacy GX content:", error);
            throw new Error(`Failed to parse Legacy GX content: ${error}`);
        }
    }
    /**
     * Determines if the buffer contains a FlashPrint-generated GX format file.
     * @param buffer The .gx file buffer.
     * @returns True if the file is a FlashPrint-generated .gx file (as opposed to a converted .gx file).
     */
    static isFlashPrintGXFormat(buffer) {
        try {
            const content = buffer.toString('utf8');
            return content.includes(';gcode_flavor: flashforge'); // only standard FlashPrint has this key/uses this format
        }
        catch (error) {
            console.warn("Error checking for FlashPrint gx format:", error);
            return false;
        }
    }
    /**
     * Searches for the header information in a binary GX file.
     * @param buffer The .gx file buffer.
     * @returns The extracted header information or null if not found.
     */
    static findHeaderInformation(buffer) {
        try {
            const fullContent = buffer.toString('latin1');
            const generatedByMatch = fullContent.match(/; generated by.+on.+at.+/);
            if (generatedByMatch) {
                return generatedByMatch[0];
            }
            const simpleMatch = fullContent.match(/generated by [\w\s-]+ [\d.]+/);
            if (simpleMatch) {
                return simpleMatch[0];
            }
            return null;
        }
        catch (error) {
            console.error("Error searching for header information:", error);
            return null;
        }
    }
    /**
     * Extracts the thumbnail image from the binary GX file.
     * @param buffer The .gx file buffer.
     * @param fileMeta The SlicerFileMeta to populate with the thumbnail.
     */
    static extractThumbnail(buffer, fileMeta) {
        try {
            // Look for PNG signature (89 50 4E 47 0D 0A 1A 0A)
            const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
            // Search for PNG signature in the first part of the file
            const searchLimit = Math.min(buffer.length, 102400); // Search first 100KB
            let pngStartIndex = -1;
            for (let i = 0; i <= searchLimit - pngSignature.length; i++) {
                if (buffer.slice(i, i + pngSignature.length).equals(pngSignature)) {
                    pngStartIndex = i;
                    break;
                }
            }
            if (pngStartIndex !== -1) {
                // Find the end of the PNG (look for IEND chunk)
                const iendSignature = Buffer.from([0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
                let pngEndIndex = -1;
                for (let i = pngStartIndex + pngSignature.length; i <= buffer.length - iendSignature.length; i++) {
                    if (buffer.slice(i, i + iendSignature.length).equals(iendSignature)) {
                        pngEndIndex = i + iendSignature.length;
                        break;
                    }
                }
                if (pngEndIndex !== -1) {
                    const pngData = buffer.slice(pngStartIndex, pngEndIndex);
                    const base64Data = pngData.toString('base64');
                    fileMeta.thumbnail = `data:image/png;base64,${base64Data}`;
                    return;
                }
            }
            // Fallback to fixed positions if automatic detection fails
            console.warn("PNG detection failed, falling back to fixed position extraction");
            const bitmapStart = 58;
            const gcodeStart = 14512;
            if (buffer.length >= gcodeStart) {
                const bitmapData = buffer.slice(bitmapStart, gcodeStart);
                const base64Data = bitmapData.toString('base64');
                fileMeta.thumbnail = `data:image/png;base64,${base64Data}`;
            }
            else {
                console.warn("Buffer too short to contain thumbnail");
                fileMeta.thumbnail = null;
            }
        }
        catch (error) {
            console.error("Error extracting thumbnail:", error);
            fileMeta.thumbnail = null;
        }
    }
    /**
     * Extracts the G-code content from the binary .gx file.
     * @param buffer The .gx file buffer.
     * @returns The G-code content as a string.
     */
    static extractGcodeContent(buffer) {
        try {
            // direct check first
            const gcodeStart = 14512;
            if (buffer.length > gcodeStart) {
                const gcodeBuffer = buffer.slice(gcodeStart);
                const gcode = gcodeBuffer.toString('utf-8', 0, gcodeBuffer.length);
                if (gcode.includes(';') || gcode.includes('G') || gcode.includes('M')) {
                    return gcode;
                }
            }
            // search fallback
            const fullContent = buffer.toString('utf8');
            const markers = [';generated by', ';gcode_flavor:'];
            for (const marker of markers) {
                const index = fullContent.indexOf(marker);
                if (index !== -1) {
                    return fullContent.substring(index);
                }
            }
            console.warn("Could not extract G-code content using known methods");
            return "";
        }
        catch (error) {
            console.error("Error extracting G-code content:", error);
            return "";
        }
    }
    /**
     * Parses the G-code content to extract metadata.
     * @param gcodeContent The G-code content as a string.
     * @param slicerMeta The SlicerMeta object to populate.
     * @param fileMeta The SlicerFileMeta object to populate.
     * @param isFlashPrintGX Whether the file is a FlashPrint-generated GX file.
     */
    static parseGcodeContent(gcodeContent, slicerMeta, fileMeta, isFlashPrintGX) {
        slicerMeta.slicer = SlicerType_1.SlicerType.LegacyGX;
        const lines = gcodeContent.split(/\r?\n/);
        let inHeaderBlock = false;
        let reachedStartGcode = false;
        if (isFlashPrintGX) {
            // Look for the generator line in FlashPrint GX format
            const generatorMatch = gcodeContent.match(/;generated by ([^\s]+) ([^\s]+) ([^\s]+) ([^\s]+)/);
            if (generatorMatch) {
                slicerMeta.slicerName = generatorMatch[1]; // ffslicer
                slicerMeta.slicerVersion = generatorMatch[2]; // 2.4.4
                slicerMeta.sliceDate = generatorMatch[3]; // 05/13/25
                slicerMeta.sliceTime = ParserHelper_1.ParserHelper.parseSliceTime(generatorMatch[4]); // 23:40:12
            }
            else {
                // Fallback to defaults if generator line not found
                slicerMeta.slicerName = "ffslicer";
                slicerMeta.slicerVersion = "2.4.4";
            }
        }
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === ';start gcode') { // no metadata after this line (for standard FlashPrint .gx)
                reachedStartGcode = true;
                continue;
            }
            if (isFlashPrintGX && reachedStartGcode) {
                continue;
            } // exit early for standard FlashPrint .gx
            if (trimmedLine.startsWith('; HEADER_BLOCK_START')) {
                inHeaderBlock = true;
                continue;
            }
            if (trimmedLine.startsWith('; HEADER_BLOCK_END')) {
                inHeaderBlock = false;
                continue;
            }
            if (inHeaderBlock) {
                if (trimmedLine.startsWith('; generated by')) {
                    slicerMeta.fromGeneratedByString(SlicerType_1.SlicerType.LegacyGX, trimmedLine);
                }
                continue;
            }
            if (isFlashPrintGX && trimmedLine.startsWith(';generated by')) {
                const cleanedLine = trimmedLine.replace(/^;/, "").trim();
                const parts = cleanedLine.split(/\s+/);
                slicerMeta.slicerName = parts[2] || "Unknown";
                slicerMeta.slicerVersion = parts[3] || "Unknown";
                slicerMeta.sliceDate = parts[4] || "Unknown";
                slicerMeta.sliceTime = parts[5] ? ParserHelper_1.ParserHelper.parseSliceTime(parts[5]) : "Unknown";
                continue;
            }
            if (trimmedLine.startsWith('; estimated printing time')) {
                slicerMeta.setEta(trimmedLine);
                continue;
            }
            // Handle standard FlashPrint GX metadata format (;key: value)
            if (isFlashPrintGX && trimmedLine.startsWith(';') && trimmedLine.includes(':')) {
                const colonIndex = trimmedLine.indexOf(':');
                const key = trimmedLine.substring(1, colonIndex).trim();
                const value = trimmedLine.substring(colonIndex + 1).trim();
                switch (key) {
                    case 'machine_type':
                        fileMeta.printerModel = value;
                        break;
                    case 'right_extruder_material':
                    case 'left_extruder_material':
                        // Set filament type from extruder material
                        if (fileMeta.filamentType === "Unknown" || key === 'right_extruder_material') {
                            fileMeta.filamentType = value;
                        }
                        break;
                }
                continue;
            }
            if (!isFlashPrintGX) {
                if (trimmedLine.startsWith('; filament used [mm]')) {
                    const match = trimmedLine.match(/; filament used \[mm\] = ([\d.]+)/);
                    if (match) {
                        fileMeta.filamentUsedMM = ParserHelper_1.ParserHelper.parseFloatOrDefault(match[1]);
                    }
                }
                else if (trimmedLine.startsWith('; filament used [g]')) {
                    const match = trimmedLine.match(/; filament used \[g\] = ([\d.]+)/);
                    if (match) {
                        fileMeta.filamentUsedG = ParserHelper_1.ParserHelper.parseFloatOrDefault(match[1]);
                    }
                }
                else if (trimmedLine.startsWith('; default_filament_profile =') || trimmedLine.startsWith('default_filament_profile =')) {
                    const match = trimmedLine.match(/default_filament_profile = "([^"]+)/);
                    if (match) {
                        // Extract material type
                        const fullType = match[1];
                        const parts = fullType.split(' ');
                        const materialType = parts[parts.length - 1];
                        fileMeta.filamentType = materialType || fullType;
                    }
                }
                else if (trimmedLine.startsWith('; printer_model =') || trimmedLine.startsWith('printer_model =')) {
                    const match = trimmedLine.match(/printer_model = (.+)$/);
                    if (match) {
                        fileMeta.printerModel = match[1].trim();
                    }
                }
            }
        }
    }
}
exports.GXParser = GXParser;
