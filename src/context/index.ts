import type { ConsolaInstance } from "consola";
import { colorize, type ColorName } from "consola/utils";
import type { Config, Config as DrizzleConfig } from "drizzle-kit";
import { loadConfig } from "c12";
import { pkgDir, pkgName } from "nitro-drizzle/meta";

import { mapAsync } from "./internal/async";
import { accent } from "./internal/logger";
import { resolveFiles } from "./internal/fs";
import {
  dialectDeclarations,
  genReference,
  moduleTypeDeclarations,
  runtimeDeclarations,
} from "./internal/templates";
import { transformDrizzleConfig } from "./internal/config";
import {
  dialectVirtualModules,
  migrationsVirtualModule,
  runtimeVirtualModule,
} from "./internal/virtual";

import type { MaybePromise, VirtualModules } from "nitro-drizzle/shared";
import type { ServerAssetDir } from "nitropack/types";
import { join } from "pathe";

/**
 * Context interface for managing Drizzle datasource configurations.
 */
export interface Context {
  init(): MaybePromise<void>;
  /**
   * Reloads the context, clearing any cached datasource information.
   */
  reload(): MaybePromise<void>;
  /**
   * Returns a list of all resolved datasource information.
   */
  datasources(): MaybePromise<DatasourceInfo[]>;
}

class DefaultContext implements Context {
  #datasources: DatasourceInfo[] | null = null;
  readonly #options: ContextOptions;

  constructor(options: ContextOptions) {
    this.#options = options;
  }

  async init(): Promise<void> {
    const datasources = await this.datasources();

    await this.#options.plugins(this.enabledPlugins());

    const [virtualModules, virtualTypes, moduleTypes, runtimeTypes] = await Promise.all([
      this.virtualModules(datasources),
      this.virtualTypeDeclarations(datasources),
      this.moduleTypeDeclarations(datasources),
      this.runtimeTypeDeclarations(datasources),
    ]);

    await this.#options.virtualModules(virtualModules);

    await this.#options.declarations({
      virtual: virtualTypes,
      module: moduleTypes,
      runtime: runtimeTypes,
    });

    if (this.#options.migrations) {
      const assets = await this.migrationAssets(datasources);
      if (assets) {
        await this.#options.assets(assets);
      }

      await this.#options.tasks?.({
        "drizzle:migrate": {
          description: "Run drizzle migrations for a datasource.",
          handler: "nitro-drizzle/migrations/task",
        },
      });
    }

    if (this.#options.inlineExternals) {
      const inlineModuleIds = ["runtime", "plugins", "migrations"].flatMap((id) => {
        return [join(pkgName, id), join(pkgDir, "dist", id)];
      });

      await this.#options.inlineExternals(inlineModuleIds);
    }
  }

  async datasources() {
    const {
      logger,
      baseDir,
      configPattern,
      resolver,
      datasource: datasourceOptions,
    } = this.#options;

    if (!this.#datasources) {
      logger?.info("Searching drizzle datasources in", colorize("blue", baseDir));

      const drizzleConfigsResolvedPaths = await resolveFiles(
        baseDir,
        [configPattern].flat().map((pattern) => "*/" + pattern),
      );

      let datasources: DatasourceInfo[] = await mapAsync(
        drizzleConfigsResolvedPaths,
        async (path) => {
          const { config } = await loadConfig<DrizzleConfig>({
            configFile: path,
          });
          const [_, dirName] = path.match(/(.+\/(.+))\/.+$/)!.slice(1, 3) as [string, string];

          return await transformDrizzleConfig(config, {
            cwd: this.#options.cwd,
            path,
            dirName,
            resolver,
          });
        },
      );

      datasources = Object.entries(datasourceOptions).reduce((_datasources, [name, options]) => {
        const datasource = datasources.find(
          (d) => d.name == name && options.connector == (d.driver ? d.driver : d.dialect),
        );
        if (!datasource) {
          return _datasources;
        }
        return [..._datasources, datasource];
      }, [] as DatasourceInfo[]);

      logger?.info(
        "Found drizzle datasources:",
        datasources
          .toSorted((datasource) => {
            return datasource.enabled ? -1 : 1;
          })
          .map((datasource) => {
            let msg = [datasource.name];
            let color: ColorName;
            if (datasource.enabled) {
              color = "greenBright";
            } else {
              color = "gray";
              msg.push("(disabled)");
            }
            return colorize(color, msg.join(" "));
          })
          .join(", "),
      );

      const enabledDatasources = datasources.filter((d) => d.enabled);

      logger?.info(
        accent`Using ${enabledDatasources.length} of ${datasources.length} resolved datasources` +
          (enabledDatasources.length > 0 ? ":" : ""),
        enabledDatasources
          .map((datasource) => {
            return [
              colorize("greenBright", datasource.name),
              colorize("yellow", "(" + (datasource.driver || datasource.dialect) + ")"),
            ].join(" ");
          })
          .join(", "),
      );

      this.#datasources = datasources;
    }

    return this.#datasources;
  }

  private async migrationAssets(
    datasources: readonly DatasourceInfo[],
  ): Promise<readonly ServerAssetDir[]> {
    const migrationOptions = this.#options.migrations;

    if (!migrationOptions) {
      return [];
    }

    return datasources.reduce((acc, { name, migrations }) => {
      const dir = migrations.assets;
      if (dir) {
        acc.push({
          baseName: `${migrationOptions.storageBase}:${name}`,
          dir,
          /**
           * @todo Doesn't work in dev mode - 'fs' driver does not support 'pattern'
           * Disabled - include all files to use with meta/_journal.json
           */
          // pattern: '*.sql',
        });
      }
      return acc;
    }, [] as ServerAssetDir[]);
  }

  private async virtualTypeDeclarations(
    datasources: readonly DatasourceInfo[],
  ): Promise<Record<string, VirtualModules<`${string}.d.ts`>>> {
    return {
      "#nitro-drizzle/*": {
        "nitro-drizzle/virtual.d.ts": [dialectDeclarations(datasources)].join("\n"),
      },
    };
  }

  private enabledPlugins(): readonly string[] {
    const plugins: ("init" | "migrate")[] = [];

    const migrationOptions = this.#options.migrations;
    const enableMigrationPlugin = migrationOptions
      ? Array.isArray(migrationOptions)
        ? 0 < migrationOptions.length
        : true == migrationOptions.migrateOnInit
      : false;

    if (enableMigrationPlugin) {
      plugins.push("migrate");
    }

    plugins.push("init");

    const pluginIds = plugins.map((pluginName) => `nitro-drizzle/plugins/${pluginName}`);

    return pluginIds;
  }

  private async moduleTypeDeclarations(
    datasources: readonly DatasourceInfo[],
  ): Promise<VirtualModules> {
    return moduleTypeDeclarations(datasources);
  }

  private async runtimeTypeDeclarations(
    datasources: readonly DatasourceInfo[],
  ): Promise<VirtualModules<`${string}.d.ts`>> {
    const references = new Set([
      { types: "nitro-drizzle/runtime" },
      ...this.enabledPlugins().map((pluginId) => {
        return { types: pluginId };
      }),
    ]);
    const content = [
      ...[...references.values()].map((reference) => genReference(reference)),
      runtimeDeclarations(datasources),
      /* ts */ `export {};`,
    ].join("\n");
    return {
      "nitro-drizzle/runtime.d.ts": content,
    };
  }

  private async virtualModules(
    datasources: readonly DatasourceInfo[],
  ): Promise<VirtualModules<`#nitro-drizzle/${string}`>> {
    return {
      "#nitro-drizzle/runtime": runtimeVirtualModule(datasources),
      ...dialectVirtualModules(datasources),
      ...migrationsVirtualModule(datasources, this.#options.migrations),
    };
  }

  reload() {
    this.#datasources = null;
  }
}

/**
 * Glob pattern or array of patterns to match Drizzle configuration files.
 */
export type ConfigPattern = string | readonly string[];

/**
 * Resolver interface for importing modules and resolving paths.
 */
export interface Resolver {
  /**
   * Resolves a module ID to its full path.
   */
  resolve(id: string): string;
}

export type ContextHook<TArgs extends readonly any[] = []> = (
  this: void,
  ...args: TArgs
) => MaybePromise<void>;

export interface MigrationOptions {
  /** Base storage key path for migrations. */
  storageBase: string;
  /** Whether and which datasources to migrate on initialization. */
  migrateOnInit: boolean | readonly string[];
}

export interface ContextOptions {
  logger?: ConsolaInstance;
  /**
   * Current working directory
   */
  cwd: string;
  /**
   * Base project directory to search drizzle config files
   */
  baseDir: string;
  /**
   * Pattern for drizzle config files
   */
  configPattern: ConfigPattern;
  /**
   * Nuxt Kit resolver
   */
  resolver: Resolver;
  /**
   * Connector options
   */
  datasource: Record<string, { connector: string }>;

  migrations: MigrationOptions | undefined;

  tasks?: ContextHook<
    [
      tasks: Record<
        string,
        {
          handler: string;
          description: string;
        }
      >,
    ]
  >;

  plugins: ContextHook<[plugins: readonly string[]]>;

  declarations: ContextHook<
    [
      declarations: {
        module: VirtualModules<`${string}.d.ts`>;
        runtime: VirtualModules<`${string}.d.ts`>;
        virtual: Record<string, VirtualModules<`${string}.d.ts`>>;
      },
    ]
  >;

  virtualModules: ContextHook<[modules: VirtualModules]>;

  assets: ContextHook<[assets: readonly ServerAssetDir[]]>;

  inlineExternals?: ContextHook<[modules: readonly string[]]>;
}

/**
 * Creates a Context instance for managing Drizzle datasource configurations.
 * @param options - Configuration options for the context
 * @returns A Context instance
 */
export function createContext(options: ContextOptions): Context {
  return new DefaultContext(options);
}

/**
 * Information about a resolved Drizzle datasource.
 */
export interface DatasourceInfo {
  /** Directory name of the datasource (derived from config file location). */
  dirName: string;
  /** Unique name identifier for the datasource. */
  name: string;
  /** Whether the datasource is enabled (filtered by connector configuration). */
  enabled: boolean;
  /** Database dialect (e.g., 'sqlite', 'postgresql', 'mysql'). */
  dialect: string;
  /** Driver type if specified in config, otherwise undefined. */
  driver: string | undefined;
  /** Import paths for schema, connector, and helpers. */
  imports: {
    config: string;
    schema: string[];
    connector: string;
    helpers: string;
  };
  /** Migration configuration for this datasource. */
  migrations: {
    assets?: string;
    config?: Config["migrations"];
  };
}
