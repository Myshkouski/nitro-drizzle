import { defu } from "defu";
import type { Datasources, DatasourceConfig } from "..";

import { callConfigHook, useRuntimeConfig } from "#nitro-drizzle/runtime";

const datasourceConfig: Partial<DatasourceConfig> = {};

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
    const config = defu(runtimeConfig?.[name], {});
    await callConfigHook(name, config);

    datasourceConfig[name] = config;
  }

  return datasourceConfig[name];
}

export function clearCachedConfig<TName extends keyof Datasources>(name: TName) {
  delete datasourceConfig[name];
}
