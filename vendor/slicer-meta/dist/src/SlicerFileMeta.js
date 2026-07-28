"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlicerFileMeta = void 0;
const SlicerType_1 = require("./SlicerType");
class SlicerFileMeta {
    constructor() {
        this.thumbnail = null; // Base64 encoded PNG data URL, or just base64 data
        this.filamentUsedMM = 0.0;
        this.filamentUsedG = 0.0;
        this.filamentType = "Unknown";
        this.printerModel = "Unknown";
        this.sliceSoft = SlicerType_1.SlicerType.Unknown;
        // Defaults are set via initializers
    }
}
exports.SlicerFileMeta = SlicerFileMeta;
