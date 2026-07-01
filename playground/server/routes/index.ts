import { eventHandler } from "h3";
import { useDatasource } from "nitro-drizzle/runtime";
import type { Datasource, Schema } from "nitro-drizzle/drivers";
import type { Column } from "drizzle-orm";

export default eventHandler(async () => {
  const [fooDatasource, barDatasource] = await Promise.all([
    useDatasource("foo"),
    useDatasource("bar"),
  ]);

  await Promise.all([fooDatasource.waitReady(), barDatasource.waitReady()]);

  const content = [fooDatasource, barDatasource]
    .map((datasource) => {
      return useDatasourceInfo(datasource);
    })
    .map((datasourceInfo) => {
      return useDatasourceTable(datasourceInfo);
    })
    .join("");

  return `
    <meta charset="utf-8">
    <h1>This is your brand new Nitro + Drizzle project 🚀 </h1>
    <p>Here is how datasources configured. Take a look at <code>server/drizzle</code> and <code>nitro.config.ts</code></p>
    ${content}
    <p>Learn more from 📖 <a href="https://nitro.build/guide" target="_blank">Nitro Documentation</a></p>
  `;
});

function useDatasourceInfo(datasource: Datasource<any, Schema>) {
  return {
    database: datasource.database.constructor.name,
    schema: {
      tables: Object.fromEntries(
        Object.entries(datasource.schema).map(([name, schema]) => {
          const schemaProps = Object.entries(schema)
            .filter(([_, value]) => {
              return "function" !== typeof value;
            })
            .map(([_, value]) => {
              const column = value as Column;
              const { name, dataType, primary } = column;
              return { name, dataType, primary };
            });

          return [name, schemaProps];
        }),
      ),
    },
  };
}

function useDatasourceTable(datasourceInfo: ReturnType<typeof useDatasourceInfo>) {
  const { database, schema } = datasourceInfo;
  const tables = Object.entries(schema.tables);

  return `
    <h3>${database}</h3>
    ${tables
      .map(
        ([tableName, columns]) => `
      <h4>${tableName}</h4>
      <table border="1" cellpadding="4" cellspacing="0">
        <tr>
          <th>name</th>
          <th>type</th>
          <th>primary</th>
        </tr>
        ${columns
          .map(
            (col) => `
          <tr>
            <td>${col.name}</td>
            <td>${col.dataType}</td>
            <td>${col.primary ? "✅" : "❌"}</td>
          </tr>
        `,
          )
          .join("")}
      </table>
    `,
      )
      .join("")}
  `;
}
