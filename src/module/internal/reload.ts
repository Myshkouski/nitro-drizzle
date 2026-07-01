import type { Nitro } from "nitropack/core";
import type { Plugin } from "rollup";
import { pkgName } from "nitro-drizzle/meta";
import type { ContextOptions } from "nitro-drizzle/context";

export type ReloadPluginOptions = Pick<ContextOptions, "baseDir">;

export function reloadPlugin(nitro: Nitro, options: ReloadPluginOptions): Plugin {
  return {
    name: `${pkgName}:rollup:watch`,

    buildStart() {
      this.addWatchFile(options.baseDir);
    },

    async watchChange(id) {
      if (id.startsWith(options.baseDir)) {
        await nitro.hooks.callHook("restart");
      }
    },
  };
}
