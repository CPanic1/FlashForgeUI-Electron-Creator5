import { SlicerType } from './SlicerType';
import { FilamentInfo } from './FilamentInfo';
export declare class SlicerFileMeta {
    thumbnail: string | null;
    filamentUsedMM: number;
    filamentUsedG: number;
    filamentType: string;
    printerModel: string;
    sliceSoft: SlicerType;
    filaments?: FilamentInfo[];
    constructor();
}
