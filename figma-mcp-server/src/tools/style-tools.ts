import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WebSocketBridge } from "../websocket-bridge.js";

const colorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
  a: z.number().min(0).max(1).optional(),
});

/**
 * Register style tools — dedicated tools for common styling operations
 */
export function registerStyleTools(server: McpServer, bridge: WebSocketBridge): void {

  // ── set_solid_fill ──
  server.tool(
    "set_solid_fill",
    "Quick helper to set a single solid fill color on a node. Simpler than set_fills for the common case.",
    {
      nodeId: z.string().describe("ID of the node"),
      r: z.number().min(0).max(1).describe("Red (0-1)"),
      g: z.number().min(0).max(1).describe("Green (0-1)"),
      b: z.number().min(0).max(1).describe("Blue (0-1)"),
      a: z.number().min(0).max(1).default(1).describe("Alpha (0-1)"),
    },
    async (params) => {
      const response = await bridge.sendCommand("set_fills", {
        nodeId: params.nodeId,
        fills: [{ type: "SOLID", color: { r: params.r, g: params.g, b: params.b, a: params.a } }],
      });
      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }
      return { content: [{ type: "text", text: `✅ Fill color set` }] };
    }
  );

  // ── set_visibility ──
  server.tool(
    "set_visibility",
    "Show or hide a node.",
    {
      nodeId: z.string().describe("ID of the node"),
      visible: z.boolean().describe("true = visible, false = hidden"),
    },
    async (params) => {
      const response = await bridge.sendCommand("set_visibility", params);
      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }
      return { content: [{ type: "text", text: `✅ Visibility set to ${params.visible}` }] };
    }
  );

  // ── set_rotation ──
  server.tool(
    "set_rotation",
    "Set the rotation of a node in degrees.",
    {
      nodeId: z.string().describe("ID of the node"),
      rotation: z.number().describe("Rotation angle in degrees (clockwise)"),
    },
    async (params) => {
      const response = await bridge.sendCommand("set_rotation", params);
      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }
      return { content: [{ type: "text", text: `✅ Rotation set to ${params.rotation}°` }] };
    }
  );

  // ── set_blend_mode ──
  server.tool(
    "set_blend_mode",
    "Set the blend mode of a node.",
    {
      nodeId: z.string().describe("ID of the node"),
      blendMode: z.enum([
        "PASS_THROUGH", "NORMAL", "DARKEN", "MULTIPLY", "LINEAR_BURN", "COLOR_BURN",
        "LIGHTEN", "SCREEN", "LINEAR_DODGE", "COLOR_DODGE",
        "OVERLAY", "SOFT_LIGHT", "HARD_LIGHT",
        "DIFFERENCE", "EXCLUSION",
        "HUE", "SATURATION", "COLOR", "LUMINOSITY",
      ]).describe("Blend mode"),
    },
    async (params) => {
      const response = await bridge.sendCommand("set_blend_mode", params);
      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }
      return { content: [{ type: "text", text: `✅ Blend mode set to ${params.blendMode}` }] };
    }
  );
}
