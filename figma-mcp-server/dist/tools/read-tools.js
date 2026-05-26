import { z } from "zod";
/**
 * Register all read tools — for inspecting the current Figma document
 */
export function registerReadTools(server, bridge) {
    // ── get_selection ──
    server.tool("get_selection", "Get the currently selected nodes in Figma. Returns an array of node info objects with id, name, type, position, and size.", {}, async () => {
        const response = await bridge.sendCommand("get_selection");
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
    });
    // ── get_page_nodes ──
    server.tool("get_page_nodes", "Get all top-level nodes on the current Figma page. Returns a flat list with id, name, type, position and size. Use depth parameter to include children.", {
        depth: z.number().min(0).max(10).default(1).describe("How deep to traverse children. 0 = top-level only, 1 = include direct children, etc."),
    }, async ({ depth }) => {
        const response = await bridge.sendCommand("get_page_nodes", { depth });
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
    });
    // ── get_node_properties ──
    server.tool("get_node_properties", "Get detailed properties of a specific node by ID. Returns fills, strokes, effects, text content, auto layout config, and more.", {
        nodeId: z.string().describe("The ID of the node to inspect (e.g. '1:23')"),
    }, async ({ nodeId }) => {
        const response = await bridge.sendCommand("get_node_properties", { nodeId });
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
    });
    // ── get_current_page ──
    server.tool("get_current_page", "Get information about the current Figma page — name, ID, and number of children.", {}, async () => {
        const response = await bridge.sendCommand("get_current_page");
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
    });
    // ── get_local_styles ──
    server.tool("get_local_styles", "Get all local styles defined in the Figma file — paint styles, text styles, effect styles, and grid styles.", {}, async () => {
        const response = await bridge.sendCommand("get_local_styles");
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
    });
    // ── connection_status ──
    server.tool("connection_status", "Check if the Figma Desktop Bridge plugin is connected to the MCP server.", {}, async () => {
        const connected = bridge.isConnected();
        return {
            content: [{
                    type: "text",
                    text: connected
                        ? "✅ Figma plugin is connected and ready."
                        : "❌ Figma plugin is NOT connected. Please open Figma Desktop, import the figma-bridge-plugin, and run it.",
                }],
        };
    });
}
//# sourceMappingURL=read-tools.js.map