import type { Datasource, DatasourceDriver, Schema } from "nitro-drizzle/drivers";

/**
 * Provider interface for creating Drizzle datasource instances.
 * @template TConfig - The configuration type for the datasource
 * @template TDatasource - The datasource type that extends Datasource
 */
export interface DatasourceProvider<TConfig, TDatasource extends Datasource<any, any, any>> {
  create(config: TConfig): Promise<TDatasource> | TDatasource;
}

/**
 * Extracts the DatasourceProvider type from a DatasourceDriver factory function.
 * @template TSchema - The schema type
 * @template TFactory - The driver factory type
 */
export type ToDatasourceProvider<
  TSchema extends Schema,
  TFactory extends DatasourceDriver<any, any>,
> = TFactory extends (config: infer TConfig, schema: TSchema) => infer TReturn
  ? Awaited<TReturn> extends Datasource<any, any, any>
    ? DatasourceProvider<TConfig, Awaited<TReturn>>
    : never
  : never;

/**
 * Extracts the Datasource type from a DatasourceProvider.
 * @template T - The DatasourceProvider type
 */
export type ToDatasource<T extends DatasourceProvider<any, any>> =
  T extends DatasourceProvider<any, infer TDatasource> ? TDatasource : never;

/**
 * Factory function type for creating database instances.
 * @template TConfig - The configuration type
 * @template TDatabase - The database type
 */
export interface DatabaseFactory<TConfig = any, TDatabase = any> {
  (config: TConfig): Promise<TDatabase> | TDatabase;
}

/**
 * Registry interface for datasource providers.
 * This interface is augmented by the module to include all configured datasources.
 */
export interface DatasourceRegistry {
  // to be augmented
}

/**
 * Mapped type of all datasources from the registry.
 * Provides access to datasource instances by name.
 */
export type Datasources = {
  readonly [K in keyof DatasourceRegistry]: ToDatasource<DatasourceRegistry[K]>;
};

/**
 * Recursively extracts primitive properties from a type.
 * @template T - The type to extract primitive properties from
 */
export type PrimitiveProps<T> = {
  [K in keyof T]: T[K] extends Record<string, any>
    ? PrimitiveProps<T[K]>
    : T[K] extends (...args: any[]) => infer R
      ? Awaited<R> extends Primitive
        ? Awaited<R>
        : never
      : T[K] extends Primitive
        ? T[K]
        : never;
};

/**
 * Primitive types supported by the runtime configuration.
 */
export type Primitive = string | number | boolean | null | undefined;

/**
 * Extracts the configuration type from a DatasourceProvider.
 * @template T - The DatasourceProvider type
 */
export type DatasourceProviderConfig<T extends DatasourceProvider<any, any>> =
  T extends DatasourceProvider<infer TConfig, any> ? TConfig : never;

/**
 * Configuration type mapping datasource names to their configurations.
 */
export type DatasourceConfig = {
  [K in keyof DatasourceRegistry]: DatasourceProviderConfig<DatasourceRegistry[K]>;
};

/**
 * Runtime configuration type with primitive values for each datasource.
 * Used for Nitro runtime config.
 */
export type RuntimeConfig = {
  [K in keyof DatasourceConfig]: PrimitiveProps<DatasourceConfig[K]>;
};

declare module "nitropack/types" {
  interface NitroRuntimeConfig {
    drizzle?: RuntimeConfig;
  }
}

declare module "nitro/types" {
  interface NitroRuntimeConfig {
    drizzle?: RuntimeConfig;
  }
}

export type ConfigHookArgs = {
  [K in keyof DatasourceConfig]: [name: K, config: DatasourceConfig[K]];
}[keyof DatasourceConfig];

export interface ConfigHooks {
  "drizzle:config": (...args: ConfigHookArgs) => void | Promise<void>;
}

declare module "nitropack/types" {
  interface NitroRuntimeHooks extends ConfigHooks {}
}

declare module "nitro/types" {
  interface NitroRuntimeHooks extends ConfigHooks {}
}

export * from "./useDatasource";
export * from "./useDialect";
