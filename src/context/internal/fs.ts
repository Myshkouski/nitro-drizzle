import { glob } from "tinyglobby";

export async function resolveFiles(
  baseDir: string,
  pattern: string | readonly string[],
  options?: {
    ignore?: string | readonly string[];
    followSymbolicLinks?: boolean;
  },
): Promise<string[]> {
  const fileNames = await glob(pattern, {
    cwd: baseDir,
    dot: true,
    absolute: true,
    ignore: options?.ignore,
    followSymbolicLinks: options?.followSymbolicLinks,
  });

  return fileNames.sort((a, b) => a.localeCompare(b));
}
