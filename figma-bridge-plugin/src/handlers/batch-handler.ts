// Batch handler — executes multiple commands in a single plugin call.
// Resolves "$N" ID references so later commands can use IDs from earlier ones.

import { handleCreateCommand } from "./create-handlers";
import { handleModifyCommand } from "./modify-handlers";
import { handleLayoutCommand } from "./layout-handlers";
import { makeSolidPaint, serializeNode } from "../utils";

// ─── Design tokens (used by composite commands) ───────────────────────────────
const TOKENS = {
  primary:     { r: 0.102, g: 0.337, b: 0.859 },  // #1A56DB
  primaryDark: { r: 0.055, g: 0.200, b: 0.718 },  // #0E33B7
  bgLight:     { r: 0.973, g: 0.980, b: 0.992 },  // #F8FAFC
  white:       { r: 1,     g: 1,     b: 1         },
  textDark:    { r: 0.059, g: 0.090, b: 0.165 },   // #0F172A
  textGray:    { r: 0.392, g: 0.455, b: 0.545 },   // #64748B
  textMuted:   { r: 0.580, g: 0.639, b: 0.722 },   // #94A3B8
  border:      { r: 0.886, g: 0.910, b: 0.941 },   // #E2E8F0
  inputBg:     { r: 0.949, g: 0.961, b: 0.976 },   // #F1F5F9
  success:     { r: 0.063, g: 0.725, b: 0.506 },   // #10B981
  danger:      { r: 0.937, g: 0.267, b: 0.267 },   // #EF4444
  warning:     { r: 0.961, g: 0.620, b: 0.043 },   // #F59E0B
  conductor:   { r: 0.388, g: 0.400, b: 0.945 },   // #6366F1
  admin:       { r: 0.851, g: 0.467, b: 0.024 },   // #D97706
};

// ─── Action router (mirrors code.ts routing) ─────────────────────────────────
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

// set_solid_fill is a style shorthand — route to modify handler as set_fills
function normalizeAction(action: string): { handler: string; action: string } {
  if (action === "set_solid_fill") {
    return { handler: "modify", action: "set_solid_fill_internal" };
  }
  if (CREATE_ACTIONS.has(action)) return { handler: "create", action };
  if (MODIFY_ACTIONS.has(action)) return { handler: "modify", action };
  if (LAYOUT_ACTIONS.has(action)) return { handler: "layout", action };
  return { handler: "unknown", action };
}

/**
 * Resolve "$N" placeholders in params with actual IDs from previous results.
 * Works recursively for nested objects (e.g. color objects).
 */
function resolveRefs(params: any, ids: (string | null)[]): any {
  if (typeof params === "string" && params.startsWith("$")) {
    const idx = parseInt(params.slice(1), 10);
    if (!isNaN(idx) && ids[idx] !== null && ids[idx] !== undefined) {
      return ids[idx];
    }
    return params; // unresolved ref — pass through
  }
  if (Array.isArray(params)) {
    return params.map((item: any) => resolveRefs(item, ids));
  }
  if (params !== null && typeof params === "object") {
    const resolved: any = {};
    for (const [key, val] of Object.entries(params)) {
      resolved[key] = resolveRefs(val, ids);
    }
    return resolved;
  }
  return params;
}

/**
 * Execute a single command, returning its node ID (or null for modify ops).
 */
async function executeOne(
  action: string,
  params: any
): Promise<{ id: string | null; error?: string }> {
  try {
    // ── set_solid_fill shorthand ──
    if (action === "set_solid_fill") {
      const result = await handleModifyCommand("set_fills", {
        nodeId: params.nodeId,
        fills: [{ type: "SOLID", color: { r: params.r, g: params.g, b: params.b, a: params.a ?? 1 } }],
      });
      return { id: null, error: result.error };
    }

    const { handler } = normalizeAction(action);

    let result: { success: boolean; data?: any; error?: string };
    if (handler === "create") {
      result = await handleCreateCommand(action, params);
    } else if (handler === "modify") {
      result = await handleModifyCommand(action, params);
    } else if (handler === "layout") {
      result = await handleLayoutCommand(action, params);
    } else {
      return { id: null, error: `Unknown action: ${action}` };
    }

    if (!result.success) {
      return { id: null, error: result.error ?? "Unknown error" };
    }

    // Extract ID from creation results
    const id: string | null = result.data?.id ?? null;
    return { id };
  } catch (err: any) {
    return { id: null, error: err.message ?? String(err) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITE COMMANDS — build complex UI components in one handler call
// ─────────────────────────────────────────────────────────────────────────────

async function handleCreateMobileScreen(params: any): Promise<any> {
  const {
    name, x = 0, y = 0,
    bgColor   = TOKENS.bgLight,
    headerColor = TOKENS.primary,
    headerTitle,
    showBackButton = false,
  } = params;

  // 1. Main frame
  const frame = figma.createFrame();
  frame.name = name;
  frame.x = x; frame.y = y;
  frame.resize(390, 844);
  frame.fills = [makeSolidPaint(bgColor)];
  frame.clipsContent = true;

  // 2. Status bar (44px)
  const statusBar = figma.createFrame();
  statusBar.name = "status-bar";
  statusBar.resize(390, 44);
  statusBar.x = 0; statusBar.y = 0;
  statusBar.fills = [makeSolidPaint(headerColor)];
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  const time = figma.createText();
  time.characters = "9:41";
  time.fills = [makeSolidPaint({ r: 1, g: 1, b: 1 })];
  time.fontSize = 13;
  (time as any).fontName = { family: "Inter", style: "Regular" };
  time.x = 32; time.y = 14;
  statusBar.appendChild(time);
  frame.appendChild(statusBar);

  // 3. Nav bar (52px) — only if headerTitle provided
  let navBar: FrameNode | null = null;
  if (headerTitle) {
    navBar = figma.createFrame();
    navBar.name = "nav-bar";
    navBar.resize(390, 52);
    navBar.x = 0; navBar.y = 44;
    navBar.fills = [makeSolidPaint(headerColor)];

    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    const title = figma.createText();
    title.characters = headerTitle;
    title.fills = [makeSolidPaint({ r: 1, g: 1, b: 1 })];
    title.fontSize = 17;
    (title as any).fontName = { family: "Inter", style: "Bold" };
    title.x = showBackButton ? 60 : 16;
    title.y = 16;
    navBar.appendChild(title);

    if (showBackButton) {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      const back = figma.createText();
      back.characters = "‹";
      back.fills = [makeSolidPaint({ r: 1, g: 1, b: 1 })];
      back.fontSize = 26;
      (back as any).fontName = { family: "Inter", style: "Regular" };
      back.x = 20; back.y = 12;
      navBar.appendChild(back);
    }

    frame.appendChild(navBar);
  }

  // 4. Content area frame
  const headerH = headerTitle ? 96 : 44;
  const contentArea = figma.createFrame();
  contentArea.name = "content-area";
  contentArea.resize(390, 844 - headerH);
  contentArea.x = 0;
  contentArea.y = headerH;
  contentArea.fills = [];
  frame.appendChild(contentArea);

  return {
    frameId:       frame.id,
    statusBarId:   statusBar.id,
    navBarId:      navBar?.id ?? null,
    contentAreaId: contentArea.id,
  };
}

async function handleCreateInputField(params: any): Promise<any> {
  const {
    parentId, x = 32, y, width = 326,
    label, placeholder, isFocused = false, isPassword = false,
  } = params;

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });

  const parent = figma.getNodeById(parentId) as FrameNode;
  if (!parent) throw new Error(`Parent not found: ${parentId}`);

  // Label
  const lbl = figma.createText();
  lbl.characters = label;
  lbl.fills = [makeSolidPaint(TOKENS.textDark)];
  lbl.fontSize = 13;
  (lbl as any).fontName = { family: "Inter", style: "Medium" };
  lbl.x = x; lbl.y = y;
  parent.appendChild(lbl);

  // Input bg
  const bg = figma.createRectangle();
  bg.resize(width, 52);
  bg.x = x; bg.y = y + 22;
  bg.cornerRadius = 12;
  bg.fills = [makeSolidPaint(TOKENS.inputBg)];
  bg.strokes = [makeSolidPaint(isFocused ? TOKENS.primary : TOKENS.border)];
  bg.strokeWeight = isFocused ? 2 : 1.5;
  bg.strokeAlign = "INSIDE";
  parent.appendChild(bg);

  // Placeholder / value text
  const ph = figma.createText();
  ph.characters = isPassword ? "••••••••" : placeholder;
  ph.fills = [makeSolidPaint(TOKENS.textMuted)];
  ph.fontSize = isPassword ? 18 : 15;
  (ph as any).fontName = { family: "Inter", style: "Regular" };
  ph.x = x + 16; ph.y = y + 38;
  parent.appendChild(ph);

  return { labelId: lbl.id, bgId: bg.id, placeholderId: ph.id };
}

async function handleCreateButton(params: any): Promise<any> {
  const {
    parentId, x = 32, y, width = 326, height = 52,
    label, variant = "primary", cornerRadius = 12,
  } = params;

  const parent = figma.getNodeById(parentId) as FrameNode;
  if (!parent) throw new Error(`Parent not found: ${parentId}`);

  const VARIANT_COLORS: Record<string, { bg: any; text: any; border?: any }> = {
    primary:   { bg: TOKENS.primary,    text: TOKENS.white },
    secondary: { bg: TOKENS.white,      text: TOKENS.primary,   border: TOKENS.primary },
    ghost:     { bg: { ...TOKENS.white, a: 0 }, text: TOKENS.textGray, border: TOKENS.border },
    danger:    { bg: TOKENS.danger,     text: TOKENS.white },
  };

  const style = VARIANT_COLORS[variant] ?? VARIANT_COLORS.primary;

  const bg = figma.createRectangle();
  bg.resize(width, height);
  bg.x = x; bg.y = y;
  bg.cornerRadius = cornerRadius;
  bg.fills = [makeSolidPaint(style.bg)];
  if (style.border) {
    bg.strokes = [makeSolidPaint(style.border)];
    bg.strokeWeight = 1.5;
    bg.strokeAlign = "INSIDE";
  }
  parent.appendChild(bg);

  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  const lbl = figma.createText();
  lbl.characters = label;
  lbl.fills = [makeSolidPaint(style.text)];
  lbl.fontSize = 16;
  (lbl as any).fontName = { family: "Inter", style: "Bold" };
  lbl.textAlignHorizontal = "CENTER";
  lbl.resize(width, height);
  lbl.textAlignVertical = "CENTER";
  lbl.x = x; lbl.y = y;
  parent.appendChild(lbl);

  return { bgId: bg.id, labelId: lbl.id };
}

async function handleCreateCard(params: any): Promise<any> {
  const {
    parentId, x = 16, y, width = 358, height,
    cornerRadius = 16, shadow = true,
    bgColor = TOKENS.white, borderColor,
  } = params;

  const parent = figma.getNodeById(parentId) as FrameNode;
  if (!parent) throw new Error(`Parent not found: ${parentId}`);

  const card = figma.createFrame();
  card.resize(width, height);
  card.x = x; card.y = y;
  card.cornerRadius = cornerRadius;
  card.fills = [makeSolidPaint(bgColor)];
  card.clipsContent = false;

  if (borderColor) {
    card.strokes = [makeSolidPaint(borderColor)];
    card.strokeWeight = 1;
    card.strokeAlign = "INSIDE";
  }

  if (shadow) {
    card.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: 0.08 },
      offset: { x: 0, y: 2 },
      radius: 12,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
    }];
  }

  parent.appendChild(card);
  return { cardId: card.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN BATCH HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function handleBatchCommand(
  action: string,
  params: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // ── Composite commands ──
    if (action === "create_mobile_screen") {
      const data = await handleCreateMobileScreen(params);
      return { success: true, data };
    }
    if (action === "create_input_field") {
      const data = await handleCreateInputField(params);
      return { success: true, data };
    }
    if (action === "create_button") {
      const data = await handleCreateButton(params);
      return { success: true, data };
    }
    if (action === "create_card") {
      const data = await handleCreateCard(params);
      return { success: true, data };
    }

    // ── batch_execute ──
    if (action === "batch_execute") {
      const commands: Array<{ action: string; params: Record<string, unknown> }> = params.commands;
      const ids: (string | null)[] = [];
      const errors: string[] = [];

      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        // Resolve $N references in this command's params
        const resolvedParams = resolveRefs(cmd.params, ids);
        const result = await executeOne(cmd.action, resolvedParams);
        ids.push(result.id);
        errors.push(result.error ?? "");
      }

      return { success: true, data: { ids, errors } };
    }

    return { success: false, error: `Unknown batch action: ${action}` };
  } catch (err: any) {
    return { success: false, error: err.message ?? String(err) };
  }
}
