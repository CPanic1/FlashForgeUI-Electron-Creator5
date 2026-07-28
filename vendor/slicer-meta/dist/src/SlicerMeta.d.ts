import { SlicerType } from './SlicerType';
export declare class SlicerMeta {
    slicerName: string;
    slicerVersion: string;
    sliceDate: string;
    sliceTime: string;
    printEta: string | null;
    slicer: SlicerType;
    constructor();
    fromGeneratedByString(slicerType: SlicerType, line: string): this;
    setEta(etaLine: string): void;
    private resetToDefaults;
}
