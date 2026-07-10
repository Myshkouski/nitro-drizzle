import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/index",
    "./src/shared",
    "./src/module",
    "./src/config",
    "./src/context",
    "./src/runtime",
    {
      migrations: "./src/migrations",
      "migrations/task": "./src/migrations/task",
    },
    "./src/utils",
    "./src/meta",
    {
      "drivers/*": ["./src/drivers/*"],
      "dialects/*": ["./src/dialects/*"],
      "middleware/*": ["./src/middleware/*"],
      "plugins/*": ["./src/plugins/*"],
      "plugins/legacy/*": ["./src/plugins/legacy/*"],
    },
  ],
  deps: {
    neverBundle: [/^(virtual:|#)?nitro-drizzle\//],
  },
  dts: {
    tsgo: true,
  },
  unbundle: true,
  unused: true,
  publint: true,
  attw: {
    profile: "esm-only",
  },
  exports: false,
  clean: true,
  sourcemap: true,
});
