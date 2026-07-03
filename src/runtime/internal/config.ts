import { defu } from "defu";
import { useNitroApp, useRuntimeConfig } from "nitropack/runtime";

import type { Datasources, Config } from "..";

const datasourceConfig: Partial<Config> = {};

/**
 * @internal
 */
export async function getCachedDatasourceConfig<TName extends keyof Datasources & string>(
  name: TName,
) {
  if (name in datasourceConfig && !datasourceConfig[name]) {
    throw new Error(
      "Cannot obtain datasource config. Do you try to obtain it inside the 'drizzle:config' hook?",
    );
  } else {
    datasourceConfig[name] = undefined;

    const runtimeConfig = useRuntimeConfig();
    // const config = structuredClone<DrizzleRuntimeConfig[TName]>(runtimeConfig.drizzle?.[name] ?? {})
    const config = defu(runtimeConfig.drizzle?.[name], {});
    const nitro = useNitroApp();
    await nitro.hooks.callHook("drizzle:config", name, config);

    datasourceConfig[name] = config;
  }

  return datasourceConfig[name];
}

export function clearCachedConfig<TName extends keyof Datasources>(name: TName) {
  delete datasourceConfig[name];
}
