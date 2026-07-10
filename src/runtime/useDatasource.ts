import type { Datasources } from ".";
import { createDatasource } from "./internal/createDatasource";
import { clearCachedConfig } from "./internal/config";

import { onServerClose } from "#nitro-drizzle/runtime";

const datasources: {
  [K in keyof Datasources & string]?: Promise<Datasources[K]>;
} = {};

/** Options for datasource creation and lifecycle management. */
export type UseDatasourceOptions = Partial<{
  /** Whether to automatically close the datasource when Nitro app closes. */
  autoClose: boolean;
}>;

/**
 * Gets or creates a datasource instance by name.
 * Caches the datasource for reuse.
 * @template TName - The datasource name
 * @param name - The datasource name
 * @param options - Lifecycle options
 * @returns The datasource instance
 */
export async function useDatasource<TName extends keyof Datasources & string>(
  name: TName,
  options: UseDatasourceOptions = {},
): Promise<Datasources[TName]> {
  let datasourcePromise: Promise<Datasources[TName]>;

  if (name in datasources) {
    datasourcePromise = datasources[name]!;
  } else {
    datasourcePromise = datasources[name] = createDatasource(name) as Datasources[TName];
    const { autoClose = true } = options;
    if (autoClose) {
      let removeCloseHandler: () => void;
      removeCloseHandler = onServerClose(async () => {
        const datasource = await datasourcePromise;

        clearCachedConfig(name);
        cleanCachedDatasource(name);

        await datasource.close();

        removeCloseHandler();
      });
    }
  }

  return await datasourcePromise;
}

function cleanCachedDatasource<TName extends keyof Datasources & string>(name: TName) {
  delete datasources[name];
}
