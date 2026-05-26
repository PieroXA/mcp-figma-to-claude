#!/usr/bin/env node

import { McpServer }           from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WebSocketBridge }     from "./websocket-bridge.js";
import { registerReadTools }   from "./tools/read-tools.js";
import { registerCreateTools } from "./tools/create-tools.js";
import { registerModifyTools } from "./tools/modify-tools.js";
import { registerLayoutTools } from "./tools/layout-tools.js";
import { registerStyleTools }  from "./tools/style-tools.js";
import { registerExportTools } from "./tools/export-tools.js";
import { registerBatchTools }  from "./tools/batch-tools.js";   // ← NEW

const WS_PORT = parseInt(process.env.FIGMA_WS_PORT || "9001", 10);

async function main() {
  const bridge = new WebSocketBridge(WS_PORT);
  await bridge.start();

  const server = new McpServer({ name: "figma-mcp", version: "2.0.0" });

  // Original tools (kept for backward compat)
  registerReadTools(server, bridge);
  registerCreateTools(server, bridge);
  registerModifyTools(server, bridge);
  registerLayoutTools(server, bridge);
  registerStyleTools(server, bridge);
  registerExportTools(server, bridge);

  // ★ Batch / composite tools (use these to save tokens)
  registerBatchTools(server, bridge);

  console.error(`[FigmaMCP v2] Ready on port ${WS_PORT}`);
  console.error(`[FigmaMCP v2] Batch tools registered: batch_execute, create_mobile_screen, create_input_field, create_button, create_card`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const shutdown = async () => { await bridge.stop(); process.exit(0); };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => { console.error("[FigmaMCP] Fatal:", err); process.exit(1); });
