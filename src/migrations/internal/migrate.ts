import type {
  MigrationConfig as DrizzleMigrationConfig,
  MigrationMeta,
} from "drizzle-orm/migrator";

/** Configuration options for database migrations. */
export type MigrationConfig = Partial<{
   /** Schema name for migrations. */
   schema: string;
   /** Table name for storing migration metadata. */
   table: string;
}>;

/**
 * Migrates a database using the provided migrations.
 * @template TSession - The session type
 * @param database - The Drizzle database instance
 * @param migrations - Iterable or async iterable of migrations
 * @param config - Migration configuration options
 */
export async function migrateDatabase<TSession = any>(
   database: DrizzleDatabase<TSession>,
   migrations: Iterable<Migration> | AsyncIterable<Migration>,
   config?: MigrationConfig,
) {
   for await (const { filename, idx, ...migrationsMeta } of migrations) {
     try {
       await database.dialect.migrate([migrationsMeta], database.session, {
         migrationsSchema: config?.schema,
         migrationsTable: config?.table,
       });
     } catch (cause) {
       throw new MigrationError({ migration: { idx, filename } }, cause);
     }
   }
}

/** Options for creating a MigrationError. */
export interface MigrationErrorOptions {
   migration: Pick<Migration, "idx" | "filename">;
}

/** Error thrown when a migration fails. */
export class MigrationError extends Error {
   constructor(
     readonly data: MigrationErrorOptions,
     cause: unknown,
   ) {
     super(`Migration failed: ${data.migration.filename}#${data.migration.idx}`, { cause });
   }
}

/** Interface for a Drizzle database dialect with migrate capabilities. */
export interface DrizzleDatabaseDialect<TSession = any> {
   migrate(
     migrations: Iterable<MigrationMeta>,
     session: TSession,
     config: Partial<DrizzleMigrationConfig> | string,
   ): any;
}

/** Interface for a Drizzle database instance. */
export interface DrizzleDatabase<TSession = any> {
   dialect: DrizzleDatabaseDialect<TSession>;
   session: TSession;
}

/** Migration information including SQL statements and metadata. */
export interface Migration extends MigrationMeta {
   idx: number;
   filename: string;
}