import { OutputAsset, OutputBundle } from 'rollup';

type BundleEntry = OutputBundle[string]

export function isAsset (e: BundleEntry): e is OutputAsset {
  return e.type === 'asset';
}
