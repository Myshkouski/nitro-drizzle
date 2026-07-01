# nitro-drizzle

[![npm version](https://img.shields.io/npm/v/nitro-drizzle.svg)](https://www.npmjs.com/package/nitro-drizzle)
[![Build Status](https://github.com/Myshkouski/nitro-drizzle/actions/workflows/ci.yml/badge.svg)](https://github.com/Myshkouski/nitro-drizzle/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/Myshkouski/nitro-drizzle.svg)](https://github.com/Myshkouski/nitro-drizzle/blob/main/LICENSE)

`nitro-drizzle` is a powerful module designed to seamlessly integrate the [Drizzle ORM](https://orm.drizzle.team/) with your [Nitro](https://nitro.unjs.io/) applications. It simplifies database management, schema definition, and migrations, allowing you to build robust and scalable backend services with ease.

## ✨ Features

- **Datasource Management**: Easily configure and manage multiple Drizzle ORM datasources within your Nitro project.
- **Multiple Database Drivers**: Support for various database drivers including SQLite (with `better-sqlite3`), PostgreSQL (with `pglite`), MySQL (with `mysql2`), and Cloudflare D1.
- **Automatic Migrations**: Configure automatic database migrations on application initialization.
- **Type-Safe Schemas**: Leverage Drizzle ORM's type-safe schemas for a better development experience.
- **Nitro Task Integration**: Run Drizzle migrations as Nitro tasks.
- **Hot Reloading**: Seamless integration with Nitro's development server for hot reloading of datasource configurations and schemas.

## 🚀 Installation

To get started, install the `nitro-drizzle` module and its peer dependencies:

```bash
npm install nitro-drizzle drizzle-orm drizzle-kit
# Install database drivers based on your needs:
# SQLite:
npm install better-sqlite3
# PostgreSQL (with pglite):
npm install @electric-sql/pglite
# MySQL:
npm install mysql2
# Cloudflare D1: (nitro-drizzle will use the `wrangler d1 bindings` for a local development, for production you can use `@cloudflare/workers-types` and connect directly to the database)
npm install @cloudflare/workers-types
```

## 📚 Usage

### 1. Configure Nitro Module

Add `nitro-drizzle/module` to your `nitro.config.ts` modules:

```ts
// nitro.config.ts
import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  modules: ["nitro-drizzle/module"],
  drizzle: {
    datasources: {
      foo: { connector: "sqlite" },
    },
  },
});
```

See [ModuleOptions](src/module/index.ts) for all available options.

### 2. Define Drizzle Config and Schema

Create your Drizzle configuration files and schemas in the `baseDir` specified in `nitro.config.ts` (e.g., `server/drizzle/foo/drizzle-sqlite.config.ts` and `server/drizzle/foo/sqlite/schema.ts`).

#### Example: `server/drizzle/foo/drizzle-sqlite.config.ts`

```ts
import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    strict: true,
    dialect: "sqlite",
    out: "./sqlite/migrations", // Migration output directory
    schema: ["./sqlite/schema.ts"], // Path to your schema files
    migrations: {
      table: "drizzle_migrations", // Table to track migrations
    },
  },
  import.meta.url, // Pass import.meta.url for correct path resolution
);
```

#### Example: `server/drizzle/foo/sqlite/schema.ts`

```ts
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});
```

#### Example: `server/drizzle/bar/drizzle-pglite.config.ts`

```ts
import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    dialect: "postgresql",
    driver: "pglite",
    out: "./postgres/migrations",
    schema: ["./postgres/schema.ts"],
    migrations: {
      table: "drizzle_migrations",
    },
  },
  import.meta.url,
);
```

#### Example: `server/drizzle/bar/postgres/schema.ts`

```ts
import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
});
```

### 3. Use Datasources in API Routes

You can access your configured datasources in your Nitro API routes using `useDatasource`.

```ts
// server/routes/index.ts
import { eventHandler } from "h3";
import { useDatasource } from "nitro-drizzle/runtime";

export default eventHandler(async () => {
  const fooDatasource = await useDatasource("foo"); // Access the 'foo' datasource
  const barDatasource = await useDatasource("bar"); // Access the 'bar' datasource

  await Promise.all([fooDatasource.waitReady(), barDatasource.waitReady()]);

  // Example usage with 'foo' (SQLite)
  const newUsers = await fooDatasource.database
    .insert(fooDatasource.schema.users)
    .values([
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" },
    ])
    .returning()
    .all();

  // Example usage with 'bar' (PostgreSQL with pglite)
  const newProducts = await barDatasource.database
    .insert(barDatasource.schema.products)
    .values([
      { name: "Laptop", description: "Powerful laptop" },
      { name: "Mouse", description: "Wireless mouse" },
    ])
    .returning()
    .all();

  return { newUsers, newProducts };
});
```

### 4. Run Migrations

If you enabled Nitro tasks in `nitro.config.ts`, you can run migrations via the Nitro CLI:

```bash
npx nitro task drizzle:migrate
```

## 📖 API Documentation

### `useDatasource(name: string, options?: UseDatasourceOptions)`

- **Purpose**: Retrieves a Drizzle ORM datasource instance by its configured name. Caches the datasource for reuse.
- **Parameters**:
    - `name`: The unique name of the datasource as defined in `nitro.config.ts`.
    - `options` (optional):
        - `autoClose`: `boolean` (default: `true`) - Whether to automatically close the datasource when the Nitro app closes.
- **Returns**: A `Promise` that resolves to the Drizzle ORM datasource instance, including `database` (the Drizzle client) and `schema` (your defined schema).

```ts
import { useDatasource } from "nitro-drizzle/runtime";

const myDatasource = await useDatasource("myDatasourceName");
const result = await myDatasource.database.select().from(myDatasource.schema.myTable).all();
```

### `defineConfig(config: DrizzleConfig, filename: string)`

- **Purpose**: Helper function to define Drizzle configuration files (`drizzle.config.ts`) that are compatible with both `nitro-drizzle/module` and `drizzle-kit`. It handles path resolution automatically.
- **Parameters**:
    - `config`: Your DrizzleKit configuration object.
    - `filename`: Pass `import.meta.url` as the `filename` for correct relative path resolution.
- **Returns**: A DrizzleKit compatible configuration object.

```ts
// drizzle.config.ts
import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    dialect: "sqlite",
    out: "./migrations",
    schema: ["./schema.ts"],
  },
  import.meta.url,
);
```

### `migrate(name: string)`

- **Purpose**: Runs Drizzle migrations for a specific datasource. This is typically used internally by the Nitro task, but can be called directly if needed.
- **Parameters**:
    - `name`: The name of the datasource to migrate.
- **Returns**: A `Promise` that resolves to a `MigrationResult` object.

```ts
import { migrate } from "nitro-drizzle/migrations";

await migrate("myDatasourceName");
```

## ⚙️ Development

- Install dependencies:
```bash
pnpm install
```
- Run the unit tests:
```bash
pnpm test
```
- Build the library:
```bash
pnpm build
```
- Run the playground in development mode:
```bash
pnpm playground
```
