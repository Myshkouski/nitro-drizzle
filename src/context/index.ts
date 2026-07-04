import type { ConsolaInstance } from "consola";
import { colorize, type ColorName } from "consola/utils";
import type { Config, Config as DrizzleConfig } from "drizzle-kit";
import { loadConfig } from "c12";

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
import { dialectVirtualModules, runtimeVirtualModule } from "./internal/virtual";

import type { MaybePromise, VirtualModules } from "nitro-drizzle/shared";

/**
 * Context interface for managing Drizzle datasource configurations.
 */
export interface Context {
  /**
   * Reloads the context, clearing any cached datasource information.
   */
  reload(): MaybePromise<void>;
  /**
   * Returns a list of all resolved datasource information.
   */
  datasources(): MaybePromise<DatasourceInfo[]>;
  /**
   * Returns virtual module code for runtime datasource access.
   */
  virtualModules(): MaybePromise<VirtualModules>;
  virtualTypeDeclarations(): MaybePromise<Record<string, VirtualModules>>;
  moduleTypeDeclarations(): MaybePromise<VirtualModules<`${string}.d.ts`>>;
  runtimeTypeDeclarations(
    // options?: RuntimeDeclarationOptions,
  ): MaybePromise<VirtualModules<`${string}.d.ts`>>;
}

class DefaultContext implements Context {
  #datasources: DatasourceInfo[] | null = null;
  readonly #options: ContextOptions;

  constructor(options: ContextOptions) {
    this.#options = options;
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
          throw new Error("Unable to resolve datasource " + name);
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

  async virtualTypeDeclarations(): Promise<Record<string, VirtualModules<`${string}.d.ts`>>> {
    const datasources = [...(await this.datasources())].filter((d) => d.enabled);
    return {
      "#nitro-drizzle/*": {
        "nitro-drizzle/virtual.d.ts": [dialectDeclarations(datasources)].join("\n"),
      },
    };
  }

  async moduleTypeDeclarations(): Promise<VirtualModules> {
    return moduleTypeDeclarations(await this.datasources());
  }

  async runtimeTypeDeclarations(
    // options?: RuntimeDeclarationOptions,
  ): Promise<VirtualModules<`${string}.d.ts`>> {
    const datasources = await this.datasources();
    const references = new Set([
      { types: "nitro-drizzle/runtime" },
      ...this.#options.plugins.map((pluginId) => {
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

  async virtualModules(): Promise<VirtualModules<`#nitro-drizzle/${string}`>> {
    const datasources = await this.datasources();
    return {
      "#nitro-drizzle/runtime": runtimeVirtualModule(datasources),
      ...dialectVirtualModules(datasources),
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
  /**
   * Attempts to resolve a module ID, returns undefined if not found.
   */
  tryResolve(id: string): string | undefined;
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

  plugins: readonly string[];
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
