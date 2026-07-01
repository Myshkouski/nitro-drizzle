import type { Config as DrizzleConfig } from "drizzle-kit";
import { resolve as resolvePath, relative as relativePath } from "pathe";
import { cwd } from "node:process";
import { fileURLToPath } from "node:url";

/**
 * Define Drizzle config compatible with both 'nitro-drizzle/module' and 'drizzle-kit' packages.
 *
 * @param config
 * @param dirname
 * @returns
 */
export function defineConfig(config: DrizzleConfig, filename: string) {
  const { schema, out, ...other } = config;

  const workingDir = cwd();

  const dirname = fileURLToPath(new URL(".", filename));

  return {
    schema: transformToPluginCompatiblePath(dirname, workingDir, schema),
    out: transformToPluginCompatiblePath(dirname, workingDir, out),
    ...other,
  };
}

function transformToPluginCompatiblePath(
  dirname: string,
  cwd: string,
  path: string | undefined,
): string | undefined;
function transformToPluginCompatiblePath(
  dirname: string,
  cwd: string,
  path: string | string[] | undefined,
): string | string[] | undefined;
function transformToPluginCompatiblePath(
  dirname: string,
  cwd: string,
  path: string | string[] | undefined,
) {
  if (!path) return;
  if (Array.isArray(path)) {
    return path.flatMap((path) => transformToRelative(dirname, cwd, path));
  }
  return relativePath(cwd, resolvePath(dirname, path));
}

function transformToRelative(dirname: string, cwd: string, path: string) {
  path = resolvePath(dirname, path);
  return relativePath(cwd, path);
}
