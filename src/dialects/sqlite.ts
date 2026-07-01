import type { SQLiteInsertBase } from "drizzle-orm/sqlite-core";
import type { InferColumns, InferTable, OnConflictDoUpdateOptions } from ".";

/**
 * Adds an ON CONFLICT DO UPDATE clause to a SQLite insert statement.
 * @template TInsert - The insert type
 * @param target - Partial object of columns to target for conflict detection
 * @param insert - The insert statement
 * @param options - Options containing the SET values
 * @returns The modified insert statement
 */
export function onConflictDoUpdate<TInsert extends SQLiteInsertBase<any, any, any, any, any, any>>(
   target: Partial<InferColumns<InferTable<TInsert>>>,
   insert: TInsert,
   options: OnConflictDoUpdateOptions<TInsert>,
): TInsert {
   return insert.onConflictDoUpdate({
     target: Object.values(target),
     set: options.set,
   });
}

/**
 * Adds an ON CONFLICT DO NOTHING clause to a SQLite insert statement.
 * @template TInsert - The insert type
 * @param _ - Partial object of columns (unused but required for API consistency)
 * @param insert - The insert statement
 * @returns The modified insert statement with DO NOTHING
 */
export function onConflictDoNothing<TInsert extends SQLiteInsertBase<any, any, any, any, any, any>>(
   _: Partial<InferColumns<InferTable<TInsert>>>,
   insert: TInsert,
): TInsert {
   return insert.onConflictDoNothing();
}

/**
 * Infers the table type from a SQLite insert statement.
 * @template T - The insert type
 */
export type InferSqliteTable<T extends SQLiteInsertBase<any, any, any, any, any, any>> =
   T extends SQLiteInsertBase<infer TTable, any, any, any, any, any> ? TTable : never;
