import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  debug: true,
  compatibilityDate: "latest",
  srcDir: "server",
  imports: false,
  // imports: {
  //   autoImport: true,
  // },
  modules: ["nitro-drizzle/module"],
  experimental: {
    tasks: true,
  },
  runtimeConfig: {
    drizzle: {
      foo: {
        url: "",
      },
      bar: {
        dataDir: "",
        database: "postgres",
      },
      // @ts-expect-error
      unknown: {},
    },
  },
  drizzle: {
    datasources: {
      foo: {
        connector: "sqlite",
      },
      bar: {
        connector: "pglite",
      },
      // @ts-expect-error
      unknown: {},
    },
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        verbatimModuleSyntax: true,
      },
    },
  },
});
