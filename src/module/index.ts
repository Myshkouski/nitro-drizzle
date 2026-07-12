import type { NitroModule as LegacyNitroModule } from "nitropack/types";
import type { NitroModule } from "nitro/types";
import { defu } from "defu";
import { resolve } from "pathe";
import { resolveAlias } from "pathe/utils";

import {
  createContext,
  type ConfigPattern,
  type ContextOptions,
  type MigrationOptions,
} from "nitro-drizzle/context";
import type { VirtualModules, MaybePromise } from "nitro-drizzle/shared";
import { pkgName } from "nitro-drizzle/meta";

import { updateServerAssets } from "./utils/assets";
import { addInlineExternals, addNoExternals } from "./utils/externals";

import { addAugmentations, addDeclarations } from "./internal/types";
import { createResolver } from "./internal/resolver";
import { reloadPlugin } from "./internal/reload";
import { addPlugin } from "./internal/rollup";
import { isLegacy } from "./utils/nitro";

/**
 * Datasource-specific configuration options.
 * This interface is augmented by the module with connector-specific options.
 */
export interface DatasourceOptions {
  // augmented by module
}

declare module "nitropack/types" {
  interface NitroOptions {
    drizzle?: ModuleOptions;
  }
}

declare module "nitro/types" {
  interface NitroOptions {
    drizzle?: ModuleOptions;
  }
}

export interface ModuleOptions {
  /**
   * Directory to search datasources
   */
  baseDir?: string;
  /**
   * Patterns to search Drizzle configs
   */
  configPattern?: ConfigPattern;

  datasources?: DatasourceOptions;

  /**
   * Enable migrations storage
   */
  migrations?: false | Partial<MigrationOptions>;
}

export type ModuleConfig = Required<ModuleOptions> & {
  migrations: false | Required<MigrationOptions>;
};

export function createDefaultOptions() {
  return {
    baseDir: "./drizzle",
    configPattern: ["drizzle.config.{js,ts}", "drizzle-*.config.{js,ts}"],
    datasources: {},
    migrations: {
      storageBase: "drizzle:migrations",
      migrateOnInit: false,
    },
  } as const satisfies ModuleConfig;
}

export function defineModuleConfig(options?: ModuleOptions): ModuleConfig {
  return defu(options, createDefaultOptions());
}

const module: LegacyNitroModule & NitroModule = {
  name: pkgName,
  async setup(nitro) {
    const moduleConfig = defineModuleConfig(nitro.options.drizzle);

    const resolver = createResolver(nitro.options.rootDir, {
      alias: nitro.options.alias,
    });

    const serverDir = isLegacy(nitro) ? nitro.options.srcDir : nitro.options.serverDir;
    if (!serverDir) {
      nitro.logger.info("No server directory configured.");
      return;
    }

    const baseDir = resolve(serverDir, resolveAlias(moduleConfig.baseDir, nitro.options.alias));

    if (!isLegacy(nitro)) {
      nitro.options.handlers ||= [];
      nitro.options.handlers.push({
        route: "/**",
        handler: resolver.resolve("nitro-drizzle/middleware/context"),
        middleware: true,
      });
    }

    const contextOptions: ContextOptions = {
      legacy: isLegacy(nitro),
      cwd: process.cwd(),
      resolver: resolver,
      baseDir,
      logger: nitro.logger,
      configPattern: moduleConfig.configPattern,
      datasources: { ...moduleConfig.datasources },
      migrations: moduleConfig.migrations || void 0,
      get initHooks() {
        const hooks: NitroHookName[] = [];
        if (nitro.options.preset.startsWith("cloudflare")) {
          if (nitro.options.preset.endsWith("durable")) {
            hooks.push("cloudflare:durable:init", "cloudflare:durable:alarm");
          }
          hooks.push(
            "request",
            "cloudflare:email",
            "cloudflare:queue",
            "cloudflare:scheduled",
            "cloudflare:tail",
            "cloudflare:trace",
          );
        }
        return hooks;
      },

      tasks: nitro.options.experimental.tasks
        ? (tasks) => {
            nitro.options.tasks ||= {};
            Object.assign(nitro.options.tasks, tasks);
          }
        : void 0,

      plugins(plugins) {
        nitro.options.plugins.push(
          ...plugins.map((plugin) => resolver.resolve(plugin).replace(/\.mjs$/, "")),
        );
      },

      virtualModules(modules: VirtualModules): MaybePromise<void> {
        Object.assign(nitro.options.virtual, modules);
      },

      declarations(declarations): MaybePromise<void> {
        nitro.hooks.hook("types:extend", async (types) => {
          await addAugmentations(nitro, types, {
            ...declarations.runtime,
            ...declarations.module,
          });

          await addDeclarations(nitro, types, declarations.virtual);
        });
      },

      assets(assets) {
        updateServerAssets(nitro.options, assets);
      },

      externals(modules) {
        if (isLegacy(nitro)) {
          addInlineExternals(nitro.options, modules);
        } else {
          addNoExternals(nitro.options, modules);
        }
      },
    };

    const context = createContext(contextOptions);

    // auto-imports
    if (nitro.options.imports) {
      nitro.options.imports.imports ||= [];

      // TODO
      // nitro.options.imports.imports.push({
      //   name: 'useMigrations',
      //   as: 'useDrizzleMigrations',
      //   from: 'nitro-drizzle/runtime',
      // })
    }

    nitro.hooks.hook("rollup:before", async (nitro, config) => {
      await addPlugin(config, reloadPlugin(nitro, { baseDir }));
    });

    await context.init();
  },
};

export default module;

export { addInlineExternals, updateServerAssets, isLegacy as isLegacyNitro };
