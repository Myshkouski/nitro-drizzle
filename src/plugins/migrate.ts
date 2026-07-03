import { defineNitroPlugin } from "nitropack/runtime";
import type { NitroAppPlugin } from "nitropack/types";
import { migrate, type MigrationResult } from "nitro-drizzle/migrations";

import { MIGRATE_ON_INIT } from "#nitro-drizzle/migrations";
import type { DatasourceRegistry } from "nitro-drizzle/runtime";

const MIGRATION_HOOK_KEY = "drizzle:migrate" as const;

/**
 * Nitro plugin that runs migrations on initialization.
 * Registers hooks to run migrations for datasources configured with migrateOnInit.
 */
const plugin: NitroAppPlugin = defineNitroPlugin(async (nitro) => {
  nitro.hooks.hook(MIGRATION_HOOK_KEY, async (name) => {
    await nitro.hooks.callHook(`${MIGRATION_HOOK_KEY}:before`, name);
    const result = await migrate(name);
    await nitro.hooks.callHook(`${MIGRATION_HOOK_KEY}:after`, name, result);
  });

  nitro.hooks.hookOnce("drizzle:init", async () => {
    await Promise.all(
      MIGRATE_ON_INIT.map((name) => {
        return nitro.hooks.callHookParallel(MIGRATION_HOOK_KEY, name);
      }),
    );
  });
});

export default plugin;

/** Type for migration hooks registered for each datasource. */
export interface MigrationHooks {
  "drizzle:migrate:before": (datasource: keyof DatasourceRegistry & string) => Promise<void> | void;
  "drizzle:migrate": (datasource: keyof DatasourceRegistry & string) => Promise<void> | void;
  "drizzle:migrate:after": (
    datasource: keyof DatasourceRegistry & string,
    result: MigrationResult,
  ) => Promise<void> | void;
}

declare module "nitropack/types" {
  interface NitroRuntimeHooks extends MigrationHooks {}
}
