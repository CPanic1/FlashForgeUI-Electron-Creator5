import { SlicerMeta } from '../../SlicerMeta';
import { SlicerFileMeta } from '../../SlicerFileMeta';
interface GXParseResult {
    slicerMeta: SlicerMeta;
    fileMeta: SlicerFileMeta;
}
export declare class GXParser {
    /**
     * Parses a .gx file from a file path.
     * @param filePath Path to the .gx file.
     * @returns An object containing SlicerMeta and SlicerFileMeta.
     * @throws Error if the file cannot be read.
     */
    static parse(filePath: string): GXParseResult;
    /**
     * Parses .gx content from a Buffer.
     * @param content The .gx content as a Buffer.
     * @returns An object containing SlicerMeta and SlicerFileMeta.
     */
    static parseFromContent(content: Buffer | string): GXParseResult;
    /**
     * Determines if the buffer contains a FlashPrint-generated GX format file.
     * @param buffer The .gx file buffer.
     * @returns True if the file is a FlashPrint-generated .gx file (as opposed to a converted .gx file).
     */
    private static isFlashPrintGXFormat;
    /**
     * Searches for the header information in a binary GX file.
     * @param buffer The .gx file buffer.
     * @returns The extracted header information or null if not found.
     */
    private static findHeaderInformation;
    /**
     * Extracts the thumbnail image from the binary GX file.
     * @param buffer The .gx file buffer.
     * @param fileMeta The SlicerFileMeta to populate with the thumbnail.
     */
    private static extractThumbnail;
    /**
     * Extracts the G-code content from the binary .gx file.
     * @param buffer The .gx file buffer.
     * @returns The G-code content as a string.
     */
    private static extractGcodeContent;
    /**
     * Parses the G-code content to extract metadata.
     * @param gcodeContent The G-code content as a string.
     * @param slicerMeta The SlicerMeta object to populate.
     * @param fileMeta The SlicerFileMeta object to populate.
     * @param isFlashPrintGX Whether the file is a FlashPrint-generated GX file.
     */
    private static parseGcodeContent;
}
export {};
