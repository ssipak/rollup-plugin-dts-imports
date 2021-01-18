import { OutputAsset, OutputBundle } from 'rollup';
declare type BundleEntry = OutputBundle[string];
export declare function isAsset(e: BundleEntry): e is OutputAsset;
export {};
