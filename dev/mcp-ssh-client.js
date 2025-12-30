#!/usr/bin/env node
import readline from "readline";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Provide your ssh args via the MCP_SSH_ARGS env var (JSON array) or edit the default below
const sshArgsEnv = process.env.MCP_SSH_ARGS;
const defaultArgs = [
  "john@192.168.24.24",
  "docker",
  "exec",
  "-i",
  "grocy-mcp-server",
  "node",
  "build/index.js",
];
const sshArgs = sshArgsEnv ? JSON.parse(sshArgsEnv) : defaultArgs;

console.log("Spawning: ssh " + sshArgs.join(" "));
const transport = new StdioClientTransport({
  command: "ssh",
  args: sshArgs,
  stderr: "inherit",
});

transport.onclose = () => {
  console.log("Remote process closed");
  process.exit(0);
};
transport.onerror = (err) => {
  console.error("Transport error:", err);
};

(async () => {
  try {
    const client = new Client({ name: "vscode-mcp-client", version: "0.1.0" }, {});

    await client.connect(transport);
    console.log("Connected to MCP server over SSH/stdio.");

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });
    rl.prompt();

    rl.on("line", async (line) => {
      const trimmed = line.trim();
      if (!trimmed) { rl.prompt(); return; }
      const [cmd, ...rest] = trimmed.split(" ");

      try {
        if (cmd === "list") {
          const res = await client.listTools({});
          console.log(JSON.stringify(res, null, 2));
        } else if (cmd === "call") {
          const name = rest[0];
          const argsJson = rest.slice(1).join(" ") || "{}";
          const args = JSON.parse(argsJson);
          const res = await client.callTool({ name, arguments: args });
          console.log(JSON.stringify(res, null, 2));
        } else if (cmd === "help") {
          console.log("Commands: list | call <toolName> <jsonArgs> | exit");
        } else if (cmd === "exit") {
          console.log("Exiting...");
          try { await client.disconnect(); } catch (e) {}
          try { await transport.close(); } catch (e) {}
          rl.close();
        } else {
          console.log("Unknown command. Type help for usage.");
        }
      } catch (err) {
        console.error("Error:", err?.message ?? err);
      } finally {
        rl.prompt();
      }
    });

    rl.on("close", () => { process.exit(0); });
  } catch (err) {
    console.error("Failed to connect to MCP server:", err);
    process.exit(1);
  }
})();
