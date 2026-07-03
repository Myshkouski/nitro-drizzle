import type { DatasourceProvider } from "nitro-drizzle/runtime";

declare module "nitro-drizzle/runtime" {
  interface DatasourceRegistry {
    [name: string]: DatasourceProvider<any, any>;
  }
}

export {};
