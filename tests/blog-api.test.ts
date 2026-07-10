import { describe } from "vitest";
import { buildLegacyNitro } from "./nitro-legacy";
import { setupNitroTest } from "./setup";
import { buildNitro } from "./nitro";

describe("legacy nitro", async () => {
  const listener = await buildLegacyNitro("fixtures/blog-api-legacy");
  setupNitroTest(listener);
});

describe("nitro", { skip: true }, async () => {
  const listener = await buildNitro("fixtures/blog-api");
  setupNitroTest(listener);
});
