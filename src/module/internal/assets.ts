import type { NitroConfig, ServerAssetDir } from "nitropack/types";

export function updateServerAssets(config: NitroConfig, assets: readonly ServerAssetDir[]) {
  config.serverAssets ||= [];
  config.serverAssets = config.serverAssets
    .filter((_assets) => {
      const baseName = _assets?.baseName;
      if (!baseName) {
        return true;
      }
      return assets.some((assets) => baseName == assets.baseName);
    })
    .concat(assets);
}
