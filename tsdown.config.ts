import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
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
      "plugins/*": ["./src/plugins/*"],
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
