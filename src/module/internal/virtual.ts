import { genString, genArrayFromRaw, genObjectFromRawEntries } from "knitwork";
import type { VirtualModules } from "nitro-drizzle/shared";
import type { MigrationOptions } from "./assets";
import type { DatasourceInfo } from "nitro-drizzle/context";

export function migrationsVirtualModule(
  datasources: DatasourceInfo[],
  options: false | MigrationOptions,
): VirtualModules {
  if (!options) {
    return {};
  }

  const parts: string[] = [];

  const enabledDatasources = datasources.filter((d) => d.enabled);

  parts.push(/*js*/ `
    export const migrationConfig = ${genObjectFromRawEntries(
      enabledDatasources.map(({ name, migrations }) => {
        return [name, JSON.stringify(migrations.config)];
      }),
    )};
  `);

  let migrateOnInit = enabledDatasources.map((d) => d.name);
  if (options && Array.isArray(options.migrateOnInit)) {
    migrateOnInit = migrateOnInit.filter((name) =>
      (options.migrateOnInit as readonly string[]).includes(name),
    );
  }

  parts.push(/*js*/ `
    export const MIGRATIONS_STORAGE_BASE = ${genString(options.storageBase)};
    export const MIGRATE_ON_INIT = ${genArrayFromRaw(migrateOnInit.map((name) => genString(name)))};
  `);

  return {
    "#nitro-drizzle/migrations": parts.join("\n"),
  };
}
