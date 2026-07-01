import type { Datasources } from ".";
import { createDatasource } from "./internal/createDatasource";
import { useNitroApp } from "nitropack/runtime";

const datasources: Partial<Datasources> = {};

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
export async function useDatasource<TName extends keyof Datasources>(
   name: TName,
   options: UseDatasourceOptions = {},
): Promise<Datasources[TName]> {
   let datasource: Datasources[TName];

   if (name in datasources) {
     datasource = datasources[name];
   } else {
     datasource = datasources[name] = (await createDatasource(name)) as Datasources[TName];
     const { autoClose = true } = options;
     if (autoClose) {
       const nitro = useNitroApp();
       nitro.hooks.hookOnce("close", async () => {
         await datasource.close();
       });
     }
   }

   return datasource;
}