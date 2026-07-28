import { SlicerMeta } from '../../SlicerMeta';
import { SlicerFileMeta } from '../../SlicerFileMeta';
import { FilamentInfo } from '../../FilamentInfo';
/**
 * Parser for 3MF files, tested with Orca-FlashForge and FlashStudio output.
 * Extracts metadata from slice_info.config, plate image, and embedded G-code.
 */
export declare class ThreeMfParser {
    printerModelId: string;
    supportUsed: boolean;
    fileNames: string[];
    filaments: FilamentInfo[];
    plateImage: string | null;
    warnings: SliceWarning[];
    firstLayerTime: number | null;
    slicerInfo: SlicerMeta | null;
    fileInfo: SlicerFileMeta | null;
    private xmlParser;
    constructor();
    /**
     * Parses a 3MF file from the given path.
     * @param filePath Path to the 3MF file.
     * @returns The parser instance.
     * @throws Error if the file cannot be read, is not a valid ZIP, or required entries are missing/invalid.
     */
    parse(filePath: string): this;
    /**
     * Parses the data extracted from the slice_info.config XML.
     * @param xmlData Parsed XML object from fast-xml-parser.
     */
    private parseConfigXml;
}
/** A slicer warning extracted from 3MF slice_info.config */
export interface SliceWarning {
    /** Raw warning key as emitted by the slicer, e.g. `bed_temperature_too_high_than_filament`. */
    msg: string;
    /** Human-readable translation of `msg`, suitable for display. */
    message: string;
    level: number;
    errorCode: string;
}
