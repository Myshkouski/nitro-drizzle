import type { Datasource } from "nitro-drizzle/drivers";
import { useDatasource, type Datasources } from "nitro-drizzle/runtime";

export type DialectOf<TDatasource extends Datasource<any, any, any>> =
  TDatasource extends Datasource<infer TDialect, any, any> ? TDialect : never;

export type DatasourceOfDialect<
  TDialect extends string,
  TDatasource extends Datasource<any, any, any>,
> = TDatasource extends Datasource<TDialect, any, any> ? TDatasource : never;

type ExactHandlers<TName extends keyof Datasources & string, T> =
  T extends DialectHandlers<TName>
    ? { [K in keyof T]: K extends keyof DialectHandlers<TName> ? T[K] : never }
    : never;

export async function useDialect<
  TName extends keyof Datasources & string,
  THandlers extends DialectHandlers<TName>,
>(
  name: TName,
  handlers: THandlers & ExactHandlers<TName, THandlers>,
): Promise<{ [K in keyof THandlers]: ReturnType<THandlers[K]> }[keyof THandlers]> {
  const datasource = await useDatasource(name);
  return await handlers[datasource.dialect](datasource);
}

export type DialectHandlers<TName extends keyof Datasources & string> = {
  [TDialect in DialectOf<Datasources[TName]>]: (
    d: DatasourceOfDialect<TDialect, Datasources[TName]>,
  ) => any;
};
