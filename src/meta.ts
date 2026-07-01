import { fileURLToPath, URL } from "node:url";
import { name as pkgName } from "nitro-drizzle/package.json";

export { pkgName };

/** Directory path of the package. */
export const pkgDir: string = fileURLToPath(
   new URL(".", import.meta.resolve("nitro-drizzle/package.json")),
);