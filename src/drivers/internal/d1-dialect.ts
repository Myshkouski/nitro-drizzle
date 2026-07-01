import { sql, type SQL } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import type { SQLiteD1Session } from "drizzle-orm/d1";
import type { MigrationMeta, MigrationConfig } from "drizzle-orm/migrator";
import { SQLiteAsyncDialect, type SQLiteSession } from "drizzle-orm/sqlite-core";
import { SQLiteRaw } from "drizzle-orm/sqlite-core/query-builders/raw";

/**
 * Dialect for Cloudflare D1 with batching instead of transaction for migrations.
 * @see [Cloudflare D1 transaction not supported #2463](https://github.com/drizzle-team/drizzle-orm/issues/2463)
 */
export class SQLiteD1Dialect extends SQLiteAsyncDialect {
  override async migrate(
    migrations: Iterable<MigrationMeta>,
    session: SQLiteD1Session<any, any>,
    config?: MigrationConfig,
  ): Promise<void> {
    const migrationsTable = config?.migrationsTable || "__drizzle_migrations";
    const migrationTableCreate = sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at numeric
      )
    `;
    await session.run(migrationTableCreate);
    const dbMigrations = await session.values(
      sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`,
    );
    const lastDbMigration = dbMigrations[0] ?? void 0;

    const statementsToBatch: SQL[] = [];
    for (const migration of migrations) {
      if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
        for (const stmt of migration.sql) {
          statementsToBatch.push(sql.raw(stmt));
        }
        statementsToBatch.push(
          sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${sql.raw(`'${migration.hash}'`)}, ${sql.raw(`${migration.folderMillis}`)})`,
        );
      }
    }
    if (statementsToBatch.length > 0) {
      await session.batch(
        statementsToBatch.map((sql) => {
          return createBatchItem({ session, dialect: this, sql });
        }),
      );
    }
  }
}

function createBatchItem<TResult>({
  session,
  dialect,
  sql,
}: CreateBatchItemOptions): BatchItem<"sqlite"> {
  return new SQLiteRaw<TResult>(
    async () => await session.run(sql),
    () => sql,
    "run",
    dialect,
    (result) => result,
  );
}

type CreateBatchItemOptions = {
  session: SQLiteSession<"async", any, any, any>;
  dialect: SQLiteAsyncDialect;
  sql: SQL<unknown>;
};
