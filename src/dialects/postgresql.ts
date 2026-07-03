import type { PgInsertBase } from "drizzle-orm/pg-core";
import type { InferColumns, InferTable, OnConflictDoUpdateOptions } from ".";

/**
 * Adds an ON CONFLICT DO UPDATE clause to a PostgreSQL insert statement.
 * @template TInsert - The insert type
 * @param target - Partial object of columns to target for conflict detection
 * @param insert - The insert statement
 * @param options - Options containing the SET values
 * @returns The modified insert statement
 */
export function onConflictDoUpdate<TInsert extends PgInsertBase<any, any, any>>(
  target: Partial<InferColumns<InferTable<TInsert>>>,
  insert: TInsert,
  options: OnConflictDoUpdateOptions<TInsert>,
):
  | TInsert
  | Omit<
      PgInsertBase<
        TInsert["_"]["table"],
        TInsert["_"]["queryResult"],
        TInsert["_"]["selectedFields"],
        TInsert["_"]["returning"],
        any,
        "onConflictDoNothing" | "onConflictDoUpdate" | TInsert["_"]["excludedMethods"]
      >,
      "onConflictDoNothing" | "onConflictDoUpdate" | TInsert["_"]["excludedMethods"]
    > {
  return insert.onConflictDoUpdate({
    target: Object.values(target),
    set: options.set,
  });
}

/**
 * Adds an ON CONFLICT DO NOTHING clause to a PostgreSQL insert statement.
 * @template TInsert - The insert type
 * @param _ - Partial object of columns (unused but required for API consistency)
 * @param insert - The insert statement
 * @returns The modified insert statement with DO NOTHING
 */
export function onConflictDoNothing<TInsert extends PgInsertBase<any, any, any>>(
  target: Partial<InferColumns<InferTable<TInsert>>>,
  insert: TInsert,
):
  | TInsert
  | Omit<
      PgInsertBase<
        TInsert["_"]["table"],
        TInsert["_"]["queryResult"],
        TInsert["_"]["selectedFields"],
        TInsert["_"]["returning"],
        any,
        "onConflictDoNothing" | "onConflictDoUpdate" | TInsert["_"]["excludedMethods"]
      >,
      "onConflictDoNothing" | "onConflictDoUpdate" | TInsert["_"]["excludedMethods"]
    > {
  return insert.onConflictDoNothing({
    target: Object.values(target),
  });
}

/**
 * Infers the table type from a PostgreSQL insert statement.
 * @template T - The insert type
 */
export type InferPgTable<T extends PgInsertBase<any, any, any, any, any, any>> =
  T extends PgInsertBase<infer TTable, any, any, any, any, any> ? TTable : never;
