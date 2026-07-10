import { fileURLToPath, URL } from "node:url";
import packageJson from "nitro-drizzle/package.json" with { type: "json" };

const { name: pkgName } = packageJson;

export { pkgName };

/** Directory path of the package. */
export const pkgDir: string = fileURLToPath(
  new URL(".", import.meta.resolve("nitro-drizzle/package.json")),
);
