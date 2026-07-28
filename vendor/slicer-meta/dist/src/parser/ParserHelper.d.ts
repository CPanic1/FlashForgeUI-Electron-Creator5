export declare class ParserHelper {
    /**
     * Parses a 24-hour time string (HH:mm:ss) and formats it to h:mm tt (e.g., 3:13 PM).
     * Returns "Error" on failure.
     * @param sliceTime Time string in HH:mm:ss format.
     */
    static parseSliceTime(sliceTime: string): string;
    /**
     * Safely parses a string to a float, returning 0.0 on failure.
     * @param value The string value to parse.
     * @returns The parsed float or 0.0.
     */
    static parseFloatOrDefault(value: string | undefined | null): number;
}
