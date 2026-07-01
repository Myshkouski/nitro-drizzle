import { defineNitroPlugin } from "nitropack/runtime";
import { migrate } from "nitro-drizzle/migrations";
import type { NitroAppPlugin } from "nitropack/types";
import { MIGRATE_ON_INIT } from "#nitro-drizzle/migrations";

/**
 * Nitro plugin that runs migrations on initialization.
 * Registers hooks to run migrations for datasources configured with migrateOnInit.
 */
const plugin: NitroAppPlugin = defineNitroPlugin(async (nitro) => {
   for (const name of MIGRATE_ON_INIT) {
     // @ts-expect-error
     nitro.hooks.hookOnce(`drizzle:migrate:${name}`, async () => {
       await migrate(name);
     });
   }

   nitro.hooks.hookOnce("drizzle:init", async () => {
     for (const name of MIGRATE_ON_INIT) {
       // @ts-expect-error
       await nitro.hooks.callHookParallel(`drizzle:migrate:${name}`);
     }
   });
});

export default plugin

/** Type for migration hooks registered for each datasource. */
export type MigrationHooks = {
   [K in (typeof MIGRATE_ON_INIT)[number] as `drizzle:config:${K}`]: () => Promise<void> | void;
};

declare module "nitropack/types" {
   interface NitroRuntimeHooks extends MigrationHooks {}
}