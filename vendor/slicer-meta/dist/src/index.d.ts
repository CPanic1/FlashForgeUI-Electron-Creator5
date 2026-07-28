import { SlicerMeta } from './SlicerMeta';
import { SlicerFileMeta } from './SlicerFileMeta';
import type { FilamentInfo } from './FilamentInfo';
import type { SliceWarning } from './parser/threemf/ThreeMfParser';
export { SlicerType } from './SlicerType';
export { SlicerMeta } from './SlicerMeta';
export { SlicerFileMeta } from './SlicerFileMeta';
export type { FilamentInfo } from './FilamentInfo';
export type { SliceWarning } from './parser/threemf/ThreeMfParser';
export { translateWarning } from './parser/threemf/warning-translations';
export { GCodeParser } from './parser/gcode/GCodeParser';
export { FlashPrintParser } from './parser/gcode/FlashPrintParser';
export { OrcaFlashForgeParser } from './parser/gcode/OrcaFlashForgeParser';
export { OrcaFamilyParser } from './parser/gcode/orca-family/OrcaFamilyParser';
export { GXParser } from './parser/gcode/GXParser';
export { ThreeMfParser } from './parser/threemf/ThreeMfParser';
export interface ParseResult {
    slicer?: SlicerMeta | null;
    file?: SlicerFileMeta | null;
    threeMf?: {
        printerModelId: string;
        supportUsed: boolean;
        fileNames: string[];
        filaments: FilamentInfo[];
        plateImage: string | null;
        warnings: SliceWarning[];
        firstLayerTime: number | null;
    } | null;
}
/**
 * Convenience function to parse a G-code or 3MF file automatically.
 * @param filePath Path to the file.
 * @returns A promise resolving to the parsed metadata.
 * @throws Error on parsing failure or unknown format.
 */
export declare function parseSlicerFile(filePath: string): Promise<ParseResult>;
