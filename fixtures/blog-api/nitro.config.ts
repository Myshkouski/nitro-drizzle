import { defineConfig } from "nitro";

export default defineConfig({
  debug: true,
  serverDir: "./server",
  renderer: false,
  modules: ["nitro-drizzle"],
  runtimeConfig: {
    drizzle: {
      content: {
        url: ":memory:",
      },
      users: {
        dataDir: "memory://",
      },
      // @ts-expect-error
      unknown: {},
    },
  },
  drizzle: {
    migrations: {
      migrateOnInit: true,
    },
    datasources: {
      content: {
        connector: "sqlite",
      },
      users: {
        connector: "pglite",
      },
    },
    // @ts-expect-error
    unknownModuleOptions: {},
  },
  typescript: {
    generateRuntimeConfigTypes: true,
    generateTsConfig: true,
  },
});
