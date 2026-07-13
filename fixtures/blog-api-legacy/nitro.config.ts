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
  cloudflare: {
    deployConfig: true,
    nodeCompat: true,
    wrangler: {
      // durable_objects: {
      //   bindings: [
      //     {
      //       name: "server",
      //       class_name: "$DurableObject",
      //     },
      //   ],
      // },
      d1_databases: [
        {
          database_name: "content",
          binding: "content",
        },
        {
          database_name: "users",
          binding: "users",
        },
      ],
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
