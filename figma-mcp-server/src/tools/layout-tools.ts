import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WebSocketBridge } from "../websocket-bridge.js";

/**
 * Register all layout tools — auto layout, constraints, grouping
 */
export function registerLayoutTools(server: McpServer, bridge: WebSocketBridge): void {

  // ── set_auto_layout ──
  server.tool(
    "set_auto_layout",
    "Configure auto layout on a frame. Enables automatic arrangement of children horizontally or vertically with spacing and padding.",
    {
      nodeId: z.string().describe("ID of the frame to configure"),
      mode: z.enum(["HORIZONTAL", "VERTICAL"]).describe("Layout direction"),
      padding: z.union([
        z.number().min(0),
        z.object({
          top: z.number().min(0),
          right: z.number().min(0),
          bottom: z.number().min(0),
          left: z.number().min(0),
        }),
      ]).optional().describe("Padding — uniform number or {top, right, bottom, left}"),
      itemSpacing: z.number().min(0).optional().describe("Spacing between children in pixels"),
      primaryAxisAlignItems: z.enum(["MIN", "MAX", "CENTER", "SPACE_BETWEEN"]).optional().describe("Alignment on the primary axis"),
      counterAxisAlignItems: z.enum(["MIN", "MAX", "CENTER"]).optional().describe("Alignment on the counter axis"),
      primaryAxisSizingMode: z.enum(["FIXED", "AUTO"]).optional().describe("Sizing mode for primary axis"),
      counterAxisSizingMode: z.enum(["FIXED", "AUTO"]).optional().describe("Sizing mode for counter axis"),
    },
    async (params) => {
      const response = await bridge.sendCommand("set_auto_layout", params);
      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }
      return { content: [{ type: "text", text: `✅ Auto layout configured (${params.mode})` }] };
    }
  );

  // ── remove_auto_layout ──
  server.tool(
    "remove_auto_layout",
    "Remove auto layout from a frame, returning it to free positioning.",
    {
      nodeId: z.string().describe("ID of the frame"),
    },
    async (params) => {
      const response = await bridge.sendCommand("remove_auto_layout", params);
      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }
      return { content: [{ type: "text", text: `✅ Auto layout removed` }] };
    }
  );

  // ── set_constraints ──
  server.tool(
    "set_constraints",
    "Set the constraints of a node within its parent frame. Controls how the node responds to parent resizing.",
    {
      nodeId: z.string().describe("ID of the node"),
      horizontal: z.enum(["MIN", "MAX", "CENTER", "STRETCH", "SCALE"]).describe("Horizontal constraint"),
      vertical: z.enum(["MIN", "MAX", "CENTER", "STRETCH", "SCALE"]).describe("Vertical constraint"),
    },
    async (params) => {
      const response = await bridge.sendCommand("set_constraints", params);
      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }
      return { content: [{ type: "text", text: `✅ Constraints set (H:${params.horizontal}, V:${params.vertical})` }] };
    }
  );

  // ── group_nodes ──
  server.tool(
    "group_nodes",
    "Group multiple nodes together into a Group node.",
    {
      nodeIds: z.array(z.string()).min(2).describe("Array of node IDs to group (minimum 2)"),
      name: z.string().optional().describe("Name for the group"),
    },
    async (params) => {
      const response = await bridge.sendCommand("group_nodes", params);
      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }
      return {
        content: [{ type: "text", text: `✅ Nodes grouped: ${JSON.stringify(response.data)}` }],
      };
    }
  );

  // ── ungroup_nodes ──
  server.tool(
    "ungroup_nodes",
    "Ungroup a group node, releasing its children into the parent.",
    {
      nodeId: z.string().describe("ID of the group to ungroup"),
    },
    async (params) => {
      const response = await bridge.sendCommand("ungroup_nodes", params);
      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }
      return { content: [{ type: "text", text: `✅ Group ungrouped` }] };
    }
  );

  // ── set_layout_sizing ──
  server.tool(
    "set_layout_sizing",
    "Set how a child behaves in an auto-layout frame — fill container, hug contents, or fixed size.",
    {
      nodeId: z.string().describe("ID of the child node"),
      horizontal: z.enum(["FILL", "HUG", "FIXED"]).optional().describe("Horizontal sizing mode"),
      vertical: z.enum(["FILL", "HUG", "FIXED"]).optional().describe("Vertical sizing mode"),
    },
    async (params) => {
      const response = await bridge.sendCommand("set_layout_sizing", params);
      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }
      return { content: [{ type: "text", text: `✅ Layout sizing updated` }] };
    }
  );
}
