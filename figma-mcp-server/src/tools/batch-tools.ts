import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
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
export function registerBatchTools(server: McpServer, bridge: WebSocketBridge): void {

  const colorSchema = z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
    a: z.number().min(0).max(1).optional(),
  });

  // ─────────────────────────────────────────────────────────────────────────
  // batch_execute — send N commands in 1 WebSocket round-trip
  // ─────────────────────────────────────────────────────────────────────────
  server.tool(
    "batch_execute",
    [
      "Execute multiple Figma operations in ONE call — the primary token-saving tool.",
      "Use '$N' in any param to reference the ID returned by command index N.",
      "Commands run sequentially; later ones can reference earlier results via $N.",
      "Returns: { ids: string[], errors: string[] } — ids[N] is the ID of result N (null for modify ops).",
      "",
      "Supported actions (same params as individual tools):",
      "  CREATE: create_frame, create_rectangle, create_ellipse, create_text,",
      "          create_component, create_instance, create_line, create_polygon, create_star",
      "  MODIFY: move_node, resize_node, rename_node, delete_node, duplicate_node,",
      "          set_fills, set_strokes, set_effects, set_corner_radius, set_opacity,",
      "          set_text_content, set_text_style, set_solid_fill,",
      "          set_visibility, set_rotation, set_blend_mode",
      "  LAYOUT: set_auto_layout, remove_auto_layout, set_constraints,",
      "          set_layout_sizing, group_nodes, ungroup_nodes",
    ].join("\n"),
    {
      commands: z.array(
        z.object({
          action: z.string().describe("Tool name (e.g. 'create_frame', 'set_solid_fill')"),
          params: z.record(z.unknown()).describe(
            "Params for the action. Use '$N' string to reference ID of result N."
          ),
        })
      ).min(1).max(200).describe("Ordered list of operations to execute"),
    },
    async ({ commands }) => {
      const response = await bridge.sendCommand("batch_execute", { commands });

      if (!response.success) {
        return { content: [{ type: "text", text: `Batch error: ${response.error}` }] };
      }

      const { ids, errors } = response.data as { ids: (string | null)[]; errors: string[] };

      const errorSummary = errors.filter(Boolean).length > 0
        ? `\nErrors (${errors.filter(Boolean).length}): ${errors.filter(Boolean).join("; ")}`
        : "";

      return {
        content: [{
          type: "text",
          text: `✅ Batch done (${commands.length} ops)\nIDs: ${JSON.stringify(ids)}${errorSummary}`,
        }],
      };
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // create_mobile_screen — build a complete iPhone frame in one call
  // ─────────────────────────────────────────────────────────────────────────
  server.tool(
    "create_mobile_screen",
    [
      "Scaffold a 390×844 iPhone frame with a standard status bar and nav bar.",
      "Returns the IDs of: [frame, statusBar, navBar, contentArea].",
      "Use the contentArea ID as parentId for all screen content.",
    ].join("\n"),
    {
      name: z.string().describe("Screen name (e.g. '01 · Login')"),
      x: z.number().default(0).describe("Canvas X position"),
      y: z.number().default(0).describe("Canvas Y position"),
      bgColor: colorSchema.optional().describe("Screen background color (default: #F8FAFC)"),
      headerColor: colorSchema.optional().describe("Status + nav bar color (default: primary blue)"),
      headerTitle: z.string().optional().describe("Navigation bar title text"),
      showBackButton: z.boolean().default(false).describe("Show ← back arrow in nav bar"),
    },
    async (params) => {
      const response = await bridge.sendCommand("create_mobile_screen", params);

      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }

      const { frameId, statusBarId, navBarId, contentAreaId } = response.data;

      return {
        content: [{
          type: "text",
          text: [
            `✅ Screen "${params.name}" created`,
            `frame=${frameId}`,
            `statusBar=${statusBarId}`,
            `navBar=${navBarId}`,
            `contentArea=${contentAreaId}`,
          ].join("\n"),
        }],
      };
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // create_input_field — reusable input component in one call
  // ─────────────────────────────────────────────────────────────────────────
  server.tool(
    "create_input_field",
    "Create a labeled input field (label + background rect + placeholder text) in one call. Returns { groupId, labelId, bgId, placeholderId }.",
    {
      parentId: z.string().describe("Parent frame/container ID"),
      x: z.number().default(32),
      y: z.number().describe("Y position of the label"),
      width: z.number().default(326).describe("Input width"),
      label: z.string().describe("Field label text"),
      placeholder: z.string().describe("Placeholder text"),
      isFocused: z.boolean().default(false).describe("Show focused state (blue border)"),
      isPassword: z.boolean().default(false).describe("Show dots as placeholder"),
    },
    async (params) => {
      const response = await bridge.sendCommand("create_input_field", params);

      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }

      return {
        content: [{
          type: "text",
          text: `✅ Input "${params.label}" created: ${JSON.stringify(response.data)}`,
        }],
      };
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // create_button — reusable button in one call
  // ─────────────────────────────────────────────────────────────────────────
  server.tool(
    "create_button",
    "Create a button (background rect + label text) in one call. Returns { groupId, bgId, labelId }.",
    {
      parentId: z.string().describe("Parent frame/container ID"),
      x: z.number().default(32),
      y: z.number().describe("Y position"),
      width: z.number().default(326),
      height: z.number().default(52),
      label: z.string().describe("Button text"),
      variant: z.enum(["primary", "secondary", "ghost", "danger"]).default("primary"),
      cornerRadius: z.number().default(12),
    },
    async (params) => {
      const response = await bridge.sendCommand("create_button", params);

      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }

      return {
        content: [{
          type: "text",
          text: `✅ Button "${params.label}" created: ${JSON.stringify(response.data)}`,
        }],
      };
    }
  );

  // ─────────────────────────────────────────────────────────────────────────
  // create_card — reusable card container in one call
  // ─────────────────────────────────────────────────────────────────────────
  server.tool(
    "create_card",
    "Create a white card with optional shadow in one call. Returns { cardId }.",
    {
      parentId: z.string().describe("Parent frame ID"),
      x: z.number().default(16),
      y: z.number().describe("Y position"),
      width: z.number().default(358),
      height: z.number().describe("Card height"),
      cornerRadius: z.number().default(16),
      shadow: z.boolean().default(true).describe("Add subtle drop shadow"),
      bgColor: colorSchema.optional().describe("Card background (default: white)"),
      borderColor: colorSchema.optional().describe("Optional border color"),
    },
    async (params) => {
      const response = await bridge.sendCommand("create_card", params);

      if (!response.success) {
        return { content: [{ type: "text", text: `Error: ${response.error}` }] };
      }

      return {
        content: [{
          type: "text",
          text: `✅ Card created: ${JSON.stringify(response.data)}`,
        }],
      };
    }
  );
}
