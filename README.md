# nitro-drizzle

[![npm version](https://img.shields.io/npm/v/nitro-drizzle.svg)](https://www.npmjs.com/package/nitro-drizzle)
[![Build Status](https://github.com/Myshkouski/nitro-drizzle/actions/workflows/ci.yml/badge.svg)](https://github.com/Myshkouski/nitro-drizzle/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/myshkouski/nitro-drizzle/graph/badge.svg?token=98LDGXABMO)](https://codecov.io/github/myshkouski/nitro-drizzle)
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

Add `nitro-drizzle` to your `nitro.config.ts` modules:

```ts
// nitro.config.ts
import { defineNitroConfig } from "nitropack/config";

export default defineNitroConfig({
  modules: ["nitro-drizzle"],
  drizzle: {
    datasources: {
      content: { connector: "sqlite" },
    },
  },
});
```

See [ModuleOptions](src/module/index.ts) for all available options.

### 2. Define Drizzle Config and Schema

Create your Drizzle configuration files and schemas in the `baseDir` specified in `nitro.config.ts` (e.g., `server/drizzle/content/drizzle-sqlite.config.ts` and `server/drizzle/content/sqlite/schema.ts`).

#### Example: `server/drizzle/content/drizzle-sqlite.config.ts`

```ts
import { defineConfig } from "nitro-drizzle/config";

export default defineConfig(
  {
    strict: true,
    dialect: "sqlite",
    out: "./sqlite/migrations", // Migration output directory
    schema: "./sqlite/schema.ts", // Path to your schema files
    migrations: {
      table: "drizzle_migrations", // Table to track migrations
    },
  },
  import.meta.url, // Pass import.meta.url for compatibility with "drizzle-kit"
);
```

#### Example: `server/drizzle/content/sqlite/schema.ts`

```ts
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull().defaultNow(),
  authors: text("authors", { mode: "json" }).$type<number[]>(),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  authorId: integer("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

### 3. Generate migrations

```shell
drizzle-kit generate --config server/drizzle/content/drizzle-sqlite.config.ts
```

### 4. Use Datasources in API Routes

You can access your configured datasources in your Nitro API routes using `useDatasource`.

```ts
// server/routes/index.ts
import { defineEventHandler } from "h3";
import { useDatasource } from "nitro-drizzle/runtime";

export default defineEventHandler(async () => {
  await event.context.drizzle.waitReady(); // Wait for "drizzle:init" hook finished
  const { database, waitReady } = await useDatasource("content"); // Access the 'content' datasource
  await waitReady(); // Wait datasource is ready
  const posts = await database.select().from(schema.posts).limit(10);
  return { posts };
});
```

### 4. Run Migrations

If you enabled Nitro tasks in `nitro.config.ts`, you can run migrations via the Nitro CLI:

```bash
npx nitro task drizzle:migrate
```

## 📁 Sample Project Structure

A minimal layout with SQLite database for `content` and PostgreSQL database for `users`. Each datasource has its own drizzle config, schema, and migrations folder.

```
blog-api/
├── nitro.config.ts
├── package.json
└── server/
    └── drizzle/
        ├── content/
        │   ├── drizzle-sqlite.config.ts
        │   └── sqlite/
        │       ├── migrations/*.sql
        │       └── schema/*.ts
        └── users/
            ├── drizzle-postgresql.config.ts
            └── postgresql/
                ├── migrations/*.sql
                └── schema.ts
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

- **Purpose**: Helper function to define Drizzle configuration files (`drizzle.config.ts`) that are compatible with both `nitro-drizzle` and `drizzle-kit`. It handles path resolution automatically.
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
