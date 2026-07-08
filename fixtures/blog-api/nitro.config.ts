import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  debug: true,
  compatibilityDate: "latest",
  srcDir: "server",
  modules: ["nitro-drizzle"],
  experimental: {
    tasks: true,
  },
  runtimeConfig: {
    drizzle: {
      content: {
        url: "./.data/content/sqlite/data.db",
      },
      users: {
        dataDir: "./.data/users/pglite",
        database: "postgres",
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
    tsConfig: {
      compilerOptions: {
        verbatimModuleSyntax: true,
      },
    },
  },
});
