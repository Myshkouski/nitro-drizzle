import { defineNitroPlugin } from "nitropack/runtime";

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("drizzle:config", async (name, config) => {
    switch (name) {
      case "content":
        config.verbose = console.debug;
        break;
      case "users":
        config.debug = 0;
        break;
    }
  });
});
