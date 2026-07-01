import { defu } from "defu";
import { useNitroApp, useRuntimeConfig } from "nitropack/runtime";

import type { Datasources, DrizzleConfig, DrizzleRuntimeConfig } from "..";

const datasourceConfig: Partial<DrizzleConfig> = {};

export async function useDatasourceConfig<TName extends keyof Datasources>(name: TName) {
  if (name in datasourceConfig) {
    if (!datasourceConfig[name]) {
      throw new Error(
        "Cannot obtain datasource config. Do you try to obtain it inside the 'drizzle:config' hook?",
      );
    }
  } else {
    datasourceConfig[name] = undefined;

    const runtimeConfig = useRuntimeConfig();
    // const config = structuredClone(runtimeConfig.drizzle?.[name] ?? {})
    const config = defu(runtimeConfig.drizzle?.[name], {}) as DrizzleRuntimeConfig[TName];
    const nitro = useNitroApp();
    await nitro.hooks.callHook(`drizzle:config:${name}` as any, config);

    datasourceConfig[name] = config;
  }

  return datasourceConfig[name];
}
