// Figma MCP Bridge Plugin — Main sandbox code (OPTIMIZED)
// Adds batch_execute, create_mobile_screen, create_input_field,
// create_button, create_card routing.

import { handleReadCommand }   from "./handlers/read-handlers";
import { handleCreateCommand } from "./handlers/create-handlers";
import { handleModifyCommand } from "./handlers/modify-handlers";
import { handleLayoutCommand } from "./handlers/layout-handlers";
import { handleExportCommand } from "./handlers/export-handlers";
import { handleBatchCommand }  from "./handlers/batch-handler";   // ← NEW

figma.showUI(__html__, { width: 320, height: 240, visible: true });

// ── Action sets ──────────────────────────────────────────────────────────────
const READ_ACTIONS = new Set([
  "get_selection","get_page_nodes","get_node_properties",
  "get_current_page","get_local_styles",
]);
const CREATE_ACTIONS = new Set([
  "create_rectangle","create_ellipse","create_text","create_frame",
  "create_component","create_instance","create_line","create_polygon","create_star",
]);
const MODIFY_ACTIONS = new Set([
  "move_node","resize_node","rename_node","set_fills","set_strokes","set_effects",
  "set_corner_radius","set_opacity","delete_node","duplicate_node",
  "set_text_content","set_text_style","set_visibility","set_rotation","set_blend_mode",
]);
const LAYOUT_ACTIONS = new Set([
  "set_auto_layout","remove_auto_layout","set_constraints",
  "group_nodes","ungroup_nodes","set_layout_sizing",
]);
// Batch / composite actions handled by batch-handler
const BATCH_ACTIONS = new Set([
  "batch_execute",
  "create_mobile_screen",
  "create_input_field",
  "create_button",
  "create_card",
]);

async function routeCommand(
  action: string,
  params: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (BATCH_ACTIONS.has(action))  return handleBatchCommand(action, params);
  if (READ_ACTIONS.has(action))   return handleReadCommand(action, params);
  if (CREATE_ACTIONS.has(action)) return handleCreateCommand(action, params);
  if (MODIFY_ACTIONS.has(action)) return handleModifyCommand(action, params);
  if (LAYOUT_ACTIONS.has(action)) return handleLayoutCommand(action, params);
  if (EXPORT_ACTIONS.has(action)) return handleExportCommand(action, params);
  return { success: false, error: `Unknown action: ${action}` };
}

const EXPORT_ACTIONS = new Set(["export_node"]);

figma.ui.onmessage = async (msg: any) => {
  if (msg.type === "bridge_command") {
    const { id, action, params } = msg;
    console.log(`[MCP Bridge] ${action}`);
    try {
      const result = await routeCommand(action, params || {});
      figma.ui.postMessage({ type: "bridge_response", id, ...result });
    } catch (err: any) {
      figma.ui.postMessage({ type: "bridge_response", id, success: false, error: err.message });
    }
  }
};

figma.ui.postMessage({ type: "sandbox_ready" });
console.log("[MCP Bridge] Ready (batch-optimized)");
