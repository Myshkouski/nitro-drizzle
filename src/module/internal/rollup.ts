import type { RollupConfig as NitropackRollupConfig } from "nitropack/types";
import type { RollupConfig } from "nitro/types";
import type { Plugin } from "rollup";

export async function addPlugin(
  rollupConfig: RollupConfig | NitropackRollupConfig,
  plugin: Plugin,
) {
  const plugins = [await rollupConfig.plugins].flat();
  rollupConfig.plugins = [...plugins, plugin];
}
