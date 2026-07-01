import type { RollupConfig } from "nitropack/types";
import type { Plugin } from "rollup";

export async function addPlugin(rollupConfig: RollupConfig, plugin: Plugin) {
  const plugins = [await rollupConfig.plugins].flat();
  rollupConfig.plugins = [...plugins, plugin];
}
