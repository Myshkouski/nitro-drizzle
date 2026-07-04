import type { NitroModule } from "nitropack/types";
import { defu } from "defu";
import { resolve } from "pathe";
import { resolveAlias } from "pathe/utils";

import { createContext, type ConfigPattern, type ContextOptions } from "nitro-drizzle/context";
import { pkgName } from "nitro-drizzle/meta";

import { addAugmentations, addDeclarations } from "./internal/types";
import { createResolver } from "./internal/resolver";
import { updateMigrationAssets, type MigrationOptions } from "./internal/assets";
import { addInlineExternals } from "./internal/externals";
import { reloadPlugin } from "./internal/reload";
import { addPlugin } from "./internal/rollup";
import { migrationsVirtualModule } from "./internal/virtual";
import { enablePlugins } from "./internal/plugins";

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
  baseDir: string;
  /**
   * Patterns to search Drizzle configs
   */
  configPattern: ConfigPattern;

  datasources?: DatasourceOptions;

  /**
   * Enable migrations storage
   */
  migrations: false | MigrationOptions;
}

const defaultModuleOptions: ModuleOptions = {
  baseDir: "~/drizzle",
  configPattern: ["drizzle.config.*", "drizzle-*.config.*"],
  migrations: {
    storageBase: "drizzle:migrations",
    migrateOnInit: false,
  },
};

const module: NitroModule = {
  name: pkgName,
  async setup(nitro) {
    const moduleOptions = defu(nitro.options.drizzle, defaultModuleOptions);

    const plugins = enablePlugins(nitro.options, moduleOptions);

    const resolver = createResolver(nitro.options.rootDir, {
      alias: nitro.options.alias,
    });

    const resolvedBaseDir = resolve(
      nitro.options.srcDir,
      resolveAlias(moduleOptions.baseDir, nitro.options.alias),
    );

    const contextOptions: ContextOptions = {
      cwd: process.cwd(),
      resolver: resolver,
      baseDir: resolvedBaseDir,
      logger: nitro.logger,
      configPattern: moduleOptions.configPattern,
      datasource: { ...moduleOptions.datasources },
      plugins,
    };

    const context = createContext(contextOptions);

    // add inline externals
    addInlineExternals(nitro.options);

    // add virtual modules
    Object.assign(
      nitro.options.virtual,
      await context.virtualModules(),
      migrationsVirtualModule(await context.datasources(), moduleOptions.migrations),
    );

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

    // server assets
    if (moduleOptions.migrations) {
      await updateMigrationAssets(context, nitro.options, moduleOptions.migrations);

      if (nitro.options.experimental.tasks) {
        nitro.options.tasks ||= {};
        nitro.options.tasks["drizzle:migrate"] = {
          description: "Run drizzle migrations for a datasource.",
          handler: "nitro-drizzle/migrations/task",
        };
      }
    }

    // watch options
    nitro.hooks.hook("rollup:before", async (nitro, config) => {
      await addPlugin(config, reloadPlugin(nitro, contextOptions));
    });

    // extend types
    nitro.hooks.hook("types:extend", async (types) => {
      const runtimeTypeDeclarations = await context.runtimeTypeDeclarations();
      const moduleTypeDeclarations = await context.moduleTypeDeclarations();

      await addAugmentations(nitro.options, types, {
        ...runtimeTypeDeclarations,
        ...moduleTypeDeclarations,
      });

      const virtualTypeDeclarations = await context.virtualTypeDeclarations();
      await addDeclarations(nitro.options, types, virtualTypeDeclarations);
    });
  },
};

export default module;
