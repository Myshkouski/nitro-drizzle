import { defineNitroPlugin } from "nitropack/runtime";

/**
 * Nitro plugin that triggers the 'drizzle:init' hook during server initialization.
 * Used to run migration plugins at startup.
 */
export default defineNitroPlugin(async (nitro) => {
   await nitro.hooks.callHook("drizzle:init");
});

declare module "nitropack/types" {
   interface NitroRuntimeHooks {
     "drizzle:init": () => void;
   }
}