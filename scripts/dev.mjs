import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const npmCmd = "npm";

const start = (name, args, cwd) => {
  const child = spawn(npmCmd, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.stdout.write(`[${name}] exited with signal ${signal}\n`);
    } else {
      process.stdout.write(`[${name}] exited with code ${code}\n`);
    }
  });

  return child;
};

const server = start("server", ["run", "dev"], path.join(rootDir, "server"));
const client = start("client", ["run", "dev"], path.join(rootDir, "client"));

const shutdown = () => {
  for (const child of [server, client]) {
    try {
      child.kill("SIGTERM");
    } catch {}
  }
};

process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});

process.on("SIGTERM", () => {
  shutdown();
  process.exit(143);
});

const exitCode = await new Promise((resolve) => {
  let finished = 0;
  let resolved = false;

  for (const child of [server, client]) {
    child.on("exit", (code) => {
      finished += 1;

      if (!resolved && code && code !== 0) {
        resolved = true;
        shutdown();
        resolve(code);
        return;
      }

      if (!resolved && finished === 2) {
        resolved = true;
        resolve(0);
      }
    });
  }
});

process.exit(exitCode);
