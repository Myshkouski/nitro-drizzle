import { definePlugin } from "nitro";
import type { NitroAppPlugin } from "nitro/types";
import { migrate, type MigrationResult } from "nitro-drizzle/migrations";

import { MIGRATE_ON_INIT } from "#nitro-drizzle/migrations";
import type { DatasourceRegistry } from "nitro-drizzle/runtime";

const MIGRATION_HOOK_KEY = "drizzle:migrate" as const;

/**
 * Nitro plugin that runs migrations on initialization.
 * Registers hooks to run migrations for datasources configured with migrateOnInit.
 */
const plugin: NitroAppPlugin = definePlugin(async (nitro) => {
  nitro.hooks.hook(MIGRATION_HOOK_KEY, async (name) => {
    await nitro.hooks.callHook(`${MIGRATION_HOOK_KEY}:before`, name);
    const result = await migrate(name);
    await nitro.hooks.callHook(`${MIGRATION_HOOK_KEY}:after`, name, result);
  });

  let hookCalled = false;
  let removeHook: () => void;
  removeHook = nitro.hooks.hook("drizzle:init", async () => {
    if (hookCalled) return;
    hookCalled = true;
    removeHook();
    await Promise.all(
      MIGRATE_ON_INIT.map((name) => {
        return nitro.hooks.callHook(MIGRATION_HOOK_KEY, name);
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

declare module "nitro/types" {
  interface NitroRuntimeHooks extends MigrationHooks {}
}
