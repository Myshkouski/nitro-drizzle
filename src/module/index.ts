import type { NitroModule } from "nitropack/types";
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
import { addInlineExternals } from "./utils/externals";

import { addAugmentations, addDeclarations } from "./internal/types";
import { createResolver } from "./internal/resolver";
import { reloadPlugin } from "./internal/reload";
import { addPlugin } from "./internal/rollup";

/**
 * Datasource-specific configuration options.
 * This interface is augmented by the module with connector-specific options.
 */
export interface DatasourceOptions {
  // augmented by module
}

declare module "nitropack/types" {
  interface NitroOptions {
    drizzle: ModuleOptions;
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

export function createDefaultOptions() {
  return {
    baseDir: "~/drizzle",
    configPattern: ["drizzle.config.{js,ts}", "drizzle-*.config.{js,ts}"],
    migrations: {
      storageBase: "drizzle:migrations",
      migrateOnInit: false,
    },
  } as const satisfies ModuleOptions;
}

const module: NitroModule = {
  name: pkgName,
  async setup(nitro) {
    const moduleOptions = defu(nitro.options.drizzle, createDefaultOptions());

    const resolver = createResolver(nitro.options.rootDir, {
      alias: nitro.options.alias,
    });

    const baseDir = resolve(
      nitro.options.srcDir,
      resolveAlias(moduleOptions.baseDir, nitro.options.alias),
    );

    const contextOptions: ContextOptions = {
      cwd: process.cwd(),
      resolver: resolver,
      baseDir,
      logger: nitro.logger,
      configPattern: moduleOptions.configPattern,
      datasource: { ...moduleOptions.datasources },
      migrations: moduleOptions.migrations || void 0,

      tasks: nitro.options.experimental.tasks
        ? (tasks) => {
            nitro.options.tasks ||= {};
            Object.assign(nitro.options.tasks, tasks);
          }
        : void 0,

      plugins(plugins) {
        nitro.options.plugins.push(...plugins);
      },

      virtualModules(modules: VirtualModules): MaybePromise<void> {
        Object.assign(nitro.options.virtual, modules);
      },

      declarations(declarations): MaybePromise<void> {
        nitro.hooks.hook("types:extend", async (types) => {
          await addAugmentations(nitro.options, types, {
            ...declarations.runtime,
            ...declarations.module,
          });

          await addDeclarations(nitro.options, types, declarations.virtual);
        });
      },

      assets(assets) {
        updateServerAssets(nitro.options, assets);
      },

      inlineExternals(modules: readonly string[]) {
        addInlineExternals(nitro.options, modules);
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

export { addInlineExternals, updateServerAssets };
