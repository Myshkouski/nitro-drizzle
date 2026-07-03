import { useDatasourceRegistry } from "#nitro-drizzle/runtime";
import type { DatasourceProvider, DatasourceRegistry } from "..";
import { getCachedDatasourceConfig } from "./config";

/**
 * @internal
 */
export async function createDatasource(name: keyof DatasourceRegistry & string) {
  const datasourceRegistry = useDatasourceRegistry();
  const datasourceProvider = datasourceRegistry[name] as DatasourceProvider<any, any>;
  const datasourceConfig = await getCachedDatasourceConfig(name);
  return await datasourceProvider.create(datasourceConfig);
}
