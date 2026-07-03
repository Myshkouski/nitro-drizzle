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
  /**
   * @deprecated Use 'nitro.database' instead.
   */
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
    const resolver = createResolver(nitro.options.rootDir, {
      alias: nitro.options.alias,
    });
    const moduleOptions = defu(nitro.options.drizzle, defaultModuleOptions);

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
    };
    const context = createContext(contextOptions);

    // add inline externals
    addInlineExternals(nitro.options);

    // specify plugin names to preserve order
    const plugins: Record<"init" | "migrate", boolean> = {
      migrate: false,
      init: true,
    };

    // add virtual modules
    Object.assign(
      nitro.options.virtual,
      await context.virtualModules(),
      migrationsVirtualModule(await context.datasources(), moduleOptions.migrations),
    );

    nitro.options.typescript = defu(nitro.options.typescript, {
      tsConfig: {
        compilerOptions: {
          paths: {
            "#nitro-drizzle/*": ["./nitro-drizzle/virtual"],
          },
        },
      },
    });

    // extend types
    nitro.hooks.hook("types:extend", async (types) => {
      const augmentations = await context.augmentations();
      await addAugmentations(nitro.options, types, augmentations);

      const declarations = await context.declarations();
      await addDeclarations(nitro.options, types, declarations);

      await addAugmentations(nitro.options, types, {
        "nitro-drizzle/module.d.ts": /* ts */ `import "nitro-drizzle/module";`,
      });
    });

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

      if (moduleOptions.migrations.migrateOnInit) {
        plugins.migrate = true;
      }
    }

    // watch options
    nitro.hooks.hook("rollup:before", async (nitro, config) => {
      await addPlugin(config, reloadPlugin(nitro, contextOptions));
    });

    // add plugins
    const enabledPlugins = Object.entries(plugins)
      .reduce((plugins, [pluginName, enabled]) => {
        if (enabled) {
          plugins.push(pluginName);
        }
        return plugins;
      }, [] as string[])
      .map((pluginName) => {
        return `nitro-drizzle/plugins/${pluginName}`;
      });

    for (const pluginId of enabledPlugins) {
      nitro.options.plugins.push(pluginId);
    }

    if (enabledPlugins.length) {
      nitro.hooks.hook("types:extend", async (types) => {
        await addAugmentations(nitro.options, types, {
          "nitro-drizzle/plugins.d.ts": enabledPlugins
            .map((pluginId) => {
              return `import "${pluginId}";`;
            })
            .join("\n"),
        });
      });
    }
  },
};

export default module;
