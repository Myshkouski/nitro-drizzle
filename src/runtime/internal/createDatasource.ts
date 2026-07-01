import { useDatasourceRegistry } from "#nitro-drizzle/runtime";
import type { DatasourceProvider, DatasourceRegistry } from "..";
import { useDatasourceConfig } from "./useDatasourceConfig";

/**
 * @internal
 */
export async function createDatasource(name: keyof DatasourceRegistry) {
  const datasourceRegistry = useDatasourceRegistry();
  const datasourceProvider = datasourceRegistry[name] as DatasourceProvider<any, any>;
  const datasourceConfig = await useDatasourceConfig(name);
  return await datasourceProvider.create(datasourceConfig);
}
