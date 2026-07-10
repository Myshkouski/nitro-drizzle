import { defineNitroPlugin } from "nitropack/runtime";

/**
 * Nitro plugin that triggers the 'drizzle:init' hook during server initialization.
 * Used to run migration plugins at startup.
 */
export default defineNitroPlugin(async (nitro) => {
  let initHook: Promise<ReadyState>;
  let readyState: ReadyState = "pending";

  const waitReady = async () => {
    await initHook;
  };

  nitro.hooks.hook("request", (event) => {
    event.context.drizzle = {
      readyState,
      waitReady,
    };
  });

  initHook = new Promise((resolve, reject) => {
    nitro.hooks
      .callHook("drizzle:init")
      .then(() => {
        readyState = "done";
        resolve(readyState);
      })
      .catch((err) => {
        readyState = "error";
        reject(err);
      });
  });

  await initHook;
});

export type ReadyState = "pending" | "done" | "error";

export type InitHooks = {
  "drizzle:init": () => void;
};

declare module "nitropack/types" {
  interface NitroRuntimeHooks extends InitHooks {}
}

declare module "h3" {
  interface H3EventContext {
    drizzle: {
      readyState: ReadyState;
      waitReady: () => Promise<void>;
    };
  }
}
