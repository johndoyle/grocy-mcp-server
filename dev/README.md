# dev: MCP SSH client

Use the SSH-based MCP client to connect from your workstation (via VS Code) to the remote MCP server running inside a Docker container.

Quick steps

1. Edit `.vscode/launch.json` and replace `your-username@192.168.24.24` with your SSH user/host (or set the `MCP_SSH_ARGS` env var in the launch config).
2. Open the Run view in VS Code and start **Run MCP SSH Client** (or run `npm run dev-client`).
3. In the interactive prompt type `list` to list tools, or `call <toolName> <jsonArgs>` to call a tool.

Examples

- list tools:
  > list

- call a tool:
  > call get_products {}

Notes

- The client spawns `ssh` and runs `docker exec -i grocy-mcp-server node build/index.js` by default. Adjust the args as needed via `MCP_SSH_ARGS`.
- If your remote container expects env vars (e.g., `GROCY_API_KEY`), ensure they're set inside the container or modify the docker exec invocation to inject them.
