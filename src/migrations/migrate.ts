import { useDatasource, type DatasourceRegistry } from "nitro-drizzle/runtime";
import { migrationConfig } from "#nitro-drizzle/migrations";
import { useMigrations } from "./useMigrations";
import { migrateDatabase, type DrizzleDatabase, type MigrationConfig } from "./internal/migrate";

/** Result of a migration operation. */
export type MigrationResult =
   | {}
   | {
       /** Error if migration failed. */
       error?: any;
     };

export type { MigrationConfig };

/**
 * Runs migrations for a specific datasource.
 * @template TName - The datasource name
 * @param name - The datasource name to migrate
 * @returns Migration result
 */
export async function migrate<TName extends keyof DatasourceRegistry>(
   name: TName,
): Promise<MigrationResult> {
   const { database, waitReady } = await useDatasource(name);
   const migrations = await useMigrations(name);
   const config = migrationConfig[name];
   await waitReady();
   await migrateDatabase(database as any as DrizzleDatabase, migrations, config);
   return {};
}