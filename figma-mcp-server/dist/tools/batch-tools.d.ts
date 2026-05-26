import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebSocketBridge } from "../websocket-bridge.js";
/**
 * BATCH EXECUTE — The main token-saving optimization.
 *
 * Instead of 1 tool call per node (expensive), Claude sends ALL operations
 * for a screen in ONE call. The plugin executes them sequentially.
 *
 * ID REFERENCES — Use "$N" to reference the ID of the Nth command result:
 *   { action: "create_frame",  params: { name: "Card", ... } }       // result[0]
 *   { action: "create_rect",   params: { parentId: "$0", ... } }     // uses frame ID
 *   { action: "set_effects",   params: { nodeId: "$0", ... } }       // same frame
 *
 * RETURN — Only IDs (not full node objects) to keep response tiny.
 */
export declare function registerBatchTools(server: McpServer, bridge: WebSocketBridge): void;
//# sourceMappingURL=batch-tools.d.ts.map