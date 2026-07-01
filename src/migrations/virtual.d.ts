import type { DatasourceRegistry } from "#nitro-drizzle/runtime";
import type { MigrationConfig } from "./migrate";

export declare const MIGRATIONS_STORAGE_BASE: string;
export declare const MIGRATE_ON_INIT: readonly (keyof DatasourceRegistry & string)[];
export declare const migrationConfig: Record<keyof DatasourceRegistry, MigrationConfig | undefined>;
