import { mkdir, writeFile as fspWriteFile } from "node:fs/promises";
import { dirname } from "pathe";

export async function writeFile(file: string, contents: Buffer | string) {
  await mkdir(dirname(file), { recursive: true });
  await fspWriteFile(file, contents, typeof contents === "string" ? "utf8" : undefined);
}
