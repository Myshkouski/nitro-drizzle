import type { ServerAssetDir, NitroConfig } from "nitropack/types";
import type { Context } from "nitro-drizzle/context";
import type { DatasourceOptions } from "..";

/** Options for configuring migration storage. */
export interface MigrationOptions {
   /** Base storage key path for migrations. */
   storageBase: string;
   /** Whether and which datasources to migrate on initialization. */
   migrateOnInit:
     | boolean
     | readonly (keyof DatasourceOptions extends never ? string : keyof DatasourceOptions)[];
}

/**
 * Updates Nitro's server assets configuration with migration directories.
 * @see [function serverAssets(nitro: Nitro)](https://github.com/nitrojs/nitro/blob/ef01b092b5fa09d28acb5bd0668ae80505f7c6b4/src/build/virtual/server-assets.ts#L18)
 */
export async function updateMigrationAssets(
   context: Context,
   config: NitroConfig,
   migrationOptions: MigrationOptions,
) {
   const datasources = await context.datasources();

   const migrationAssets: ServerAssetDir[] = datasources
     .map(({ name, migrations }) => {
       const dir = migrations.assets;
       if (dir) {
         return {
           baseName: `${migrationOptions.storageBase}:${name}`,
           dir,
           /**
            * @todo Doesn't work in dev mode - 'fs' driver does not support 'pattern'
            * Disabled - include all files to use with meta/_journal.json
            */
           // pattern: '*.sql',
         };
       }
     })
     .filter((value) => !!value);

   config.serverAssets = [config.serverAssets ?? []]
     .flat()
     .filter((serverAsset) => {
       return serverAsset?.baseName?.startsWith(migrationOptions.storageBase);
     })
     .concat(migrationAssets);
}