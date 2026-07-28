/**
 * Translates a raw slicer warning key into human-readable text.
 * Returns a curated message for known keys, a prettified fallback for unknown
 * snake_case keys, and an empty string if the input is empty.
 */
export declare function translateWarning(msg: string): string;
