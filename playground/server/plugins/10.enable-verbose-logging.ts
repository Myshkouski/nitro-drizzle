import { defineNitroPlugin } from "nitropack/runtime";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("drizzle:config:foo", (config) => {
    config.verbose = console.debug;
  });

  nitro.hooks.hook("drizzle:config:bar", (config) => {
    config.debug = 1;
  });
});
