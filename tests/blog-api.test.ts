import { describe } from "vitest";
import { buildLegacyNitro } from "./nitro-legacy";
import { setupNitroTest } from "./setup";
import { buildNitro } from "./nitro";

describe("legacy nitro", async () => {
  setupNitroTest(() => buildLegacyNitro("fixtures/blog-api-legacy"));
});

describe("nitro", { skip: true }, async () => {
  setupNitroTest(() => buildNitro("fixtures/blog-api"));
});
