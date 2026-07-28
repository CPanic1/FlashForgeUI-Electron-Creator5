import { SlicerMeta } from '../../SlicerMeta';
import { SlicerFileMeta } from '../../SlicerFileMeta';
/**
 * AIO GCode Parser
 * Supports Orca-FlashForge, FlashPrint, and Legacy GX g-code files.
 */
export declare class GCodeParser {
    slicerInfo: SlicerMeta | null;
    fileInfo: SlicerFileMeta | null;
    constructor();
    /**
     * Parses a G-code file from the given file path.
     * Automatically detects the slicer type and delegates parsing.
     * @param filePath Path to the G-code or 3MF file.
     * @returns The parser instance for chaining or accessing results.
     * @throws Error if the file is unreadable, slicer type is unknown, or parsing fails.
     */
    parse(filePath: string): Promise<this>;
    /**
     * Parses G-code content provided as a string or Buffer.
     * Automatically detects the slicer type and delegates parsing.
     * @param content The G-code content.
     * @returns The parser instance for chaining or accessing results.
     * @throws Error if the slicer type is unknown or parsing fails.
     */
    parseFromContent(content: string | Buffer): this;
    /**
     * Checks if the file extension is typically associated with G-code or 3MF.
     * Note: This is a basic check and not reliable for format identification.
     * @param filePath The path to the file.
     * @returns True if the extension matches common formats, false otherwise.
     */
    private isOkExt;
    /**
     * Determines the slicer type by reading the first line of a file.
     * @param filePath Path to the G-code file.
     * @returns The detected SlicerType.
     * @throws Error if the file cannot be read.
     */
    private getSlicerTypeFromFile;
    /**
     * Determines the slicer type from the first line of G-code content.
     * @param content G-code content as a string or Buffer.
     * @returns The detected SlicerType.
     */
    private getSlicerTypeFromContent;
    /**
     * Detects SlicerType based on a header line.
     * @param header The header line string.
     * @returns The detected SlicerType.
     */
    private detectTypeFromHeader;
}
