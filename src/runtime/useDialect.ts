import type { Datasource } from "nitro-drizzle/drivers";
import { useDatasource, type Datasources } from "nitro-drizzle/runtime";

export type ToDialect<TDatasource extends Datasource<any, any, any>> =
  TDatasource extends Datasource<infer TDialect, any, any> ? TDialect : never;

export type ToDatasourceWithDialect<
  TDialect extends string,
  TDatasource extends Datasource<any, any, any>,
> = TDatasource extends Datasource<TDialect, any, any> ? TDatasource : never;

export async function useDialect<
  TName extends keyof Datasources & string,
  THandlers extends {
    [TDialect in ToDialect<Datasources[TName]>]: (
      d: ToDatasourceWithDialect<TDialect, Datasources[TName]>,
    ) => any;
  },
>(
  name: TName,
  handlers: THandlers,
): Promise<{ [K in keyof THandlers]: ReturnType<THandlers[K]> }[keyof THandlers]> {
  const datasource = await useDatasource(name);
  return await handlers[datasource.dialect](datasource);
}
