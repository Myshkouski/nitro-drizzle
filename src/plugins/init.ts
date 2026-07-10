import { definePlugin } from "nitro";

/**
 * Nitro plugin that triggers the 'drizzle:init' hook during server initialization.
 * Used to run migration plugins at startup.
 */
export default definePlugin(async (nitro) => {
  await nitro.hooks.callHook("drizzle:init");
});

export type InitHooks = {
  "drizzle:init": () => void;
};

declare module "nitro/types" {
  interface NitroRuntimeHooks extends InitHooks {}
}
