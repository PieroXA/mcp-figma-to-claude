#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WebSocketBridge } from "./websocket-bridge.js";
import { registerReadTools } from "./tools/read-tools.js";
import { registerCreateTools } from "./tools/create-tools.js";
import { registerModifyTools } from "./tools/modify-tools.js";
import { registerLayoutTools } from "./tools/layout-tools.js";
import { registerStyleTools } from "./tools/style-tools.js";
import { registerExportTools } from "./tools/export-tools.js";
const WS_PORT = parseInt(process.env.FIGMA_WS_PORT || "9001", 10);
async function main() {
    console.error("╔══════════════════════════════════════════╗");
    console.error("║     Figma MCP Server for Antigravity     ║");
    console.error("║            v1.0.0                        ║");
    console.error("╚══════════════════════════════════════════╝");
    // 1. Start WebSocket bridge (waits for Figma plugin to connect)
    const bridge = new WebSocketBridge(WS_PORT);
    await bridge.start();
    // 2. Create MCP Server
    const server = new McpServer({
        name: "figma-mcp",
        version: "1.0.0",
    });
    // 3. Register all tool groups
    registerReadTools(server, bridge);
    registerCreateTools(server, bridge);
    registerModifyTools(server, bridge);
    registerLayoutTools(server, bridge);
    registerStyleTools(server, bridge);
    registerExportTools(server, bridge);
    console.error(`[FigmaMCP] Registered tools: read, create, modify, layout, style, export`);
    console.error(`[FigmaMCP] WebSocket bridge listening on port ${WS_PORT}`);
    console.error(`[FigmaMCP] Waiting for Figma plugin connection...`);
    // 4. Connect MCP via stdio
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[FigmaMCP] MCP Server connected via stdio. Ready!");
    // Handle graceful shutdown
    const shutdown = async () => {
        console.error("[FigmaMCP] Shutting down...");
        await bridge.stop();
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
main().catch((err) => {
    console.error("[FigmaMCP] Fatal error:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map