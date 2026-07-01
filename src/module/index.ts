import type { NitroModule } from "nitropack/types"
import { defu } from "defu"
import { resolve } from "pathe"
import { resolveAlias } from "pathe/utils"

import { createContext, type ConfigPattern, type ContextOptions } from "nitro-drizzle/context"
import { pkgName } from "nitro-drizzle/meta"

import { extendTypes } from "./internal/types"
import { createResolver } from "./internal/resolver"
import { updateMigrationAssets, type MigrationOptions } from "./internal/assets"
import { addInlineExternals } from "./internal/externals"
import { reloadPlugin } from "./internal/reload"
import { addPlugin } from "./internal/rollup"
import { migrationsVirtualModule } from "./internal/virtual"

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
  baseDir: string
  /**
   * Patterns to search Drizzle configs
   */
  configPattern: ConfigPattern
  /**
   * @deprecated Use 'nitro.database' instead.
   */
  datasources?: DatasourceOptions

  /**
   * Enable migrations storage
   */
  migrations: false | MigrationOptions
}

const defaultModuleOptions: ModuleOptions = {
  baseDir: '~/drizzle',
  configPattern: [
    'drizzle.config.*',
    'drizzle-*.config.*',
  ],
  migrations: {
    storageBase: 'drizzle:migrations',
    migrateOnInit: true,
  },
}

const module: NitroModule = {
  name: pkgName,
  async setup(nitro) {
    const resolver = createResolver(nitro.options.rootDir, {
      alias: nitro.options.alias
    })
    const moduleOptions = defu(nitro.options.drizzle, defaultModuleOptions)

    const resolvedBaseDir = resolve(nitro.options.srcDir, resolveAlias(moduleOptions.baseDir, nitro.options.alias))
    const contextOptions: ContextOptions = {
      cwd: process.cwd(),
      resolver: resolver,
      baseDir: resolvedBaseDir,
      logger: nitro.logger,
      configPattern: moduleOptions.configPattern,
      datasource: { ...moduleOptions.datasources },
    }
    const context = createContext(contextOptions)

    // add inline externals
    addInlineExternals(nitro.options)

    // specify plugin names to preserve order
    const plugins: Record<'init' | 'migrate', boolean> = {
      migrate: false,
      init: true,
    }

    // add virtual modules
    Object.assign(
      nitro.options.virtual, 
      await context.virtualModules(),
      migrationsVirtualModule(await context.datasources(), moduleOptions.migrations)
    )

    nitro.options.alias ||= {}
    nitro.options.alias["#nitro-drizzle/dialects/foo"] = resolver.resolve("nitro-drizzle/dialects/sqlite")
    nitro.options.alias["#nitro-drizzle/dialects/bar"] = resolver.resolve("nitro-drizzle/dialects/postgresql")

    nitro.options.typescript = defu(nitro.options.typescript, {
      tsConfig: {
        compilerOptions: {
          paths: {
            "#nitro-drizzle/dialects/*": ["./nitro-drizzle"]
          }
        }
      }
    })

    // extend types
    nitro.hooks.hook("types:extend", async (types) => {
      await extendTypes(context, nitro.options, types)
    })

    // auto-imports
    if (nitro.options.imports) {
      nitro.options.imports.imports ||= []
      
      // TODO
      // nitro.options.imports.imports.push({
      //   name: 'useMigrations',
      //   as: 'useDrizzleMigrations',
      //   from: 'nitro-drizzle/runtime',
      // })
    }

    // server assets
    if (moduleOptions.migrations) {
      await updateMigrationAssets(context, nitro.options, moduleOptions.migrations)

      if (nitro.options.experimental.tasks) {
        nitro.options.tasks ||= {}
        nitro.options.tasks['drizzle:migrate'] = {
          description: 'Run drizzle migrations',
          handler: 'nitro-drizzle/migrations/task'
        }
      }

      if (moduleOptions.migrations.migrateOnInit) {
        plugins.migrate = true
      }
    }

    // watch options
    nitro.hooks.hook("rollup:before", async (nitro, config) => {
      await addPlugin(config, reloadPlugin(nitro, contextOptions))
    })

    // add plugins
    for (const [pluginName, enabled] of Object.entries(plugins)) {
      if (enabled) {
        nitro.options.plugins.push(`nitro-drizzle/plugins/${pluginName}`)
      }
    }
  },
}

export default module
