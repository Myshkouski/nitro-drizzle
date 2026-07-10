import { defineHandler } from "nitro";
import { noContent } from "nitro/h3";

export default defineHandler(async (event) => {
  const { readyState } = event.context.drizzle;
  return noContent("done" == readyState ? 200 : 500);
});
