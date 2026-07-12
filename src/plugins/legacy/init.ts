import { defineNitroPlugin } from "nitropack/runtime";
import { initHooks } from "#nitro-drizzle/runtime";

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

  // TODO: should be replaced with middleware
  nitro.hooks.hook("request", (event) => {
    event.context.drizzle = {
      get readyState() {
        return readyState;
      },
      waitReady,
    };
  });

  const cleanup: (() => void)[] = [];

  async function callInitHook() {
    if (!initHook) {
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

      for (const fn of cleanup) {
        fn();
      }
    }

    await initHook;
  }

  if (initHooks?.length) {
    const cleanups = initHooks.map((hookName) => {
      return nitro.hooks.hook(hookName, async () => {
        await callInitHook();
      });
    });

    cleanup.push(...cleanups);
  } else {
    await callInitHook();
  }
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
