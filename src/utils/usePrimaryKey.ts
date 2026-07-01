import { Table } from "drizzle-orm";
import type { InferPrimaryColumns } from "nitro-drizzle/dialects";

// @ts-expect-error - internal Drizzle API
const ColumnsSymbol = Table.Symbol.Columns as symbol;

/**
 * Extracts primary key columns from a Drizzle table.
 * @template T - The table type
 * @param table - The Drizzle table
 * @returns Object containing only primary key columns
 */
export function usePrimaryColumns<T extends Table>(table: T): InferPrimaryColumns<T> {
   // @ts-expect-error Internal Drizzle API
   const columns = table[ColumnsSymbol] as typeof table._.columns;
   return Object.fromEntries(
     Object.entries(columns).filter(([_, column]) => {
       return column.primary;
     }),
   ) as InferPrimaryColumns<T>;
}