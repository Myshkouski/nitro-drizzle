import { describe, it } from "vitest";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { MySqlContainer, StartedMySqlContainer } from "@testcontainers/mysql";
import { default as postgresql } from "nitro-drizzle/drivers/postgresql";
import { default as mysql } from "nitro-drizzle/drivers/mysql";
import { default as sqlite } from "nitro-drizzle/drivers/sqlite";
import { default as pglite } from "nitro-drizzle/drivers/pglite";
import type { Datasource } from "nitro-drizzle/drivers";

describe("drivers", () => {
  describe("postgresql", (ctx) => {
    let container: StartedPostgreSqlContainer;

    ctx.beforeEach(async () => {
      container = await new PostgreSqlContainer("postgres:18-alpine").start();
    }, 120000);

    ctx.afterEach(async () => {
      await container.stop();
    });

    it("should initialize postgresql datasource", async () => {
      const datasource = postgresql({ url: container.getConnectionUri() }, {});
      await testDatasource(datasource, async () => {
        await datasource.database.execute("SELECT 1");
      });
    });
  });

  describe("mysql", (ctx) => {
    let container: StartedMySqlContainer;

    ctx.beforeEach(async () => {
      container = await new MySqlContainer("mysql:9").start();
    }, 120000);

    ctx.afterEach(async () => {
      await container.stop();
    });

    it("should initialize mysql datasource", async () => {
      const datasource = await mysql({ url: container.getConnectionUri() }, {});
      await testDatasource(datasource, async () => {
        await datasource.database.execute("SELECT 1");
      });
    });
  });

  describe("sqlite", () => {
    it("should initialize sqlite datasource", async () => {
      const datasource = sqlite({ url: ":memory:" }, {});
      await testDatasource(datasource, async () => {
        await datasource.database.run("SELECT 1");
      });
    });
  });

  describe("pglite", () => {
    it("should initialize pglite datasource", async () => {
      const datasource = pglite({ dataDir: "memory://" }, {});
      await testDatasource(datasource, async () => {
        await datasource.database.execute("SELECT 1");
      });
    });
  });
});

async function testDatasource(
  datasource: Datasource<any, any, any>,
  fn: () => void | Promise<void>,
) {
  await datasource.waitReady();
  await fn();
  await datasource.close();
}
