import type { Storage } from "unstorage";
import { digest } from "ohash";
import type { DatasourceRegistry } from "nitro-drizzle/runtime";
import { MIGRATIONS_STORAGE_BASE } from "#nitro-drizzle/migrations";
import { useStorage } from "#nitro-drizzle/runtime";
import type { Migration } from "./internal/migrate";

/**
 * Gets the storage for a specific datasource's migrations.
 * @template TName - The datasource name
 * @param name - The datasource name
 * @returns Storage instance for migrations
 */
export function useMigrationsStorage<TName extends keyof DatasourceRegistry>(
  name: TName,
): Storage<string> {
  return useStorage(`assets:${MIGRATIONS_STORAGE_BASE}:${name}`);
}

/** Storage key for the migration journal. */
export const JOURNAL_STORAGE_KEY = "meta/_journal.json" as const;

/**
 * Gets an async iterable of migrations for a specific datasource.
 * @template TName - The datasource name
 * @param name - The datasource name
 * @returns Async iterable of migrations
 * @throws If migration journal is not found
 */
export async function useMigrations<TName extends keyof DatasourceRegistry>(
  name: TName,
): Promise<AsyncIterable<Migration>> {
  const storage = useMigrationsStorage(name);
  const journal = await storage.getItem<MigrationJournal>(JOURNAL_STORAGE_KEY);
  if (!journal) {
    throw new Error(`Cannot find migration journal for '${name}'`);
  }

  return generate(journal, storage);
}

const STATEMENT_BREAKPOINT = "--> statement-breakpoint" as const;

async function* generate(journal: MigrationJournal, storage: Storage<string>) {
  for (const { idx, when, tag, breakpoints } of journal.entries) {
    const filename = tag + ".sql";
    const query = await storage.getItem<string>(filename);

    if (!query) {
      throw new Error(`Cannot find migration filename: ${filename}`);
    }

    const migration: Migration = {
      filename,
      idx,
      sql: query.split(STATEMENT_BREAKPOINT),
      hash: digest(query),
      folderMillis: when,
      bps: breakpoints,
    };

    yield migration;
  }
}

/** Single entry in the migration journal. */
export interface MigrationJournalItem {
  /** Migration index/order number. */
  idx: number;
  /** Migration version string. */
  version: string;
  /** Timestamp when migration was created. */
  when: number;
  /** Migration tag/identifier. */
  tag: string;
  /** Indicates if this entry has breakpoints. */
  breakpoints: true;
}

/**
 * Migration journal containing all migration entries.
 * @see https://github.com/drizzle-team/drizzle-orm/blob/48e5406027103a9fca6eb66417187c4a8b5c6aa3/drizzle-kit/src/utils.ts#L63
 */
export interface MigrationJournal {
  /** List of migration entries. */
  entries: Iterable<MigrationJournalItem>;
}
