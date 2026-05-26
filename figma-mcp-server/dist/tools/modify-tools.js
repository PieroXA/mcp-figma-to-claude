import { z } from "zod";
const colorSchema = z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1),
    a: z.number().min(0).max(1).optional(),
});
/**
 * Register all modification tools — for changing existing nodes
 */
export function registerModifyTools(server, bridge) {
    // ── move_node ──
    server.tool("move_node", "Move a node to a new position on the canvas.", {
        nodeId: z.string().describe("ID of the node to move"),
        x: z.number().describe("New X position"),
        y: z.number().describe("New Y position"),
    }, async (params) => {
        const response = await bridge.sendCommand("move_node", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return { content: [{ type: "text", text: `✅ Node moved to (${params.x}, ${params.y})` }] };
    });
    // ── resize_node ──
    server.tool("resize_node", "Resize a node to new dimensions.", {
        nodeId: z.string().describe("ID of the node to resize"),
        width: z.number().min(0.01).describe("New width in pixels"),
        height: z.number().min(0.01).describe("New height in pixels"),
    }, async (params) => {
        const response = await bridge.sendCommand("resize_node", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return { content: [{ type: "text", text: `✅ Node resized to ${params.width}×${params.height}` }] };
    });
    // ── rename_node ──
    server.tool("rename_node", "Rename a node.", {
        nodeId: z.string().describe("ID of the node to rename"),
        name: z.string().describe("New name for the node"),
    }, async (params) => {
        const response = await bridge.sendCommand("rename_node", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return { content: [{ type: "text", text: `✅ Node renamed to "${params.name}"` }] };
    });
    // ── set_fills ──
    server.tool("set_fills", "Set the fill colors of a node. Supports solid colors and gradients. Replaces all existing fills.", {
        nodeId: z.string().describe("ID of the node"),
        fills: z.array(z.union([
            z.object({
                type: z.literal("SOLID"),
                color: colorSchema,
                opacity: z.number().min(0).max(1).optional(),
            }),
            z.object({
                type: z.enum(["GRADIENT_LINEAR", "GRADIENT_RADIAL", "GRADIENT_ANGULAR", "GRADIENT_DIAMOND"]),
                gradientStops: z.array(z.object({
                    position: z.number().min(0).max(1),
                    color: colorSchema,
                })),
            }),
        ])).describe("Array of fill paints"),
    }, async (params) => {
        const response = await bridge.sendCommand("set_fills", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return { content: [{ type: "text", text: `✅ Fills updated` }] };
    });
    // ── set_strokes ──
    server.tool("set_strokes", "Set the strokes (borders) of a node.", {
        nodeId: z.string().describe("ID of the node"),
        color: colorSchema.describe("Stroke color"),
        weight: z.number().min(0).default(1).describe("Stroke weight in pixels"),
        align: z.enum(["INSIDE", "OUTSIDE", "CENTER"]).default("CENTER").describe("Stroke alignment"),
    }, async (params) => {
        const response = await bridge.sendCommand("set_strokes", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return { content: [{ type: "text", text: `✅ Strokes updated` }] };
    });
    // ── set_effects ──
    server.tool("set_effects", "Set visual effects on a node — drop shadows, inner shadows, blurs. Replaces all existing effects.", {
        nodeId: z.string().describe("ID of the node"),
        effects: z.array(z.union([
            z.object({
                type: z.enum(["DROP_SHADOW", "INNER_SHADOW"]),
                color: colorSchema,
                offset: z.object({ x: z.number(), y: z.number() }),
                radius: z.number().min(0),
                spread: z.number().optional(),
                visible: z.boolean().default(true),
            }),
            z.object({
                type: z.enum(["LAYER_BLUR", "BACKGROUND_BLUR"]),
                radius: z.number().min(0),
                visible: z.boolean().default(true),
            }),
        ])).describe("Array of effects"),
    }, async (params) => {
        const response = await bridge.sendCommand("set_effects", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return { content: [{ type: "text", text: `✅ Effects updated` }] };
    });
    // ── set_corner_radius ──
    server.tool("set_corner_radius", "Set corner radius on a rectangle or frame. Use uniform for all corners or individual values.", {
        nodeId: z.string().describe("ID of the node"),
        radius: z.number().min(0).optional().describe("Uniform corner radius for all corners"),
        topLeft: z.number().min(0).optional().describe("Top-left corner radius"),
        topRight: z.number().min(0).optional().describe("Top-right corner radius"),
        bottomRight: z.number().min(0).optional().describe("Bottom-right corner radius"),
        bottomLeft: z.number().min(0).optional().describe("Bottom-left corner radius"),
    }, async (params) => {
        const response = await bridge.sendCommand("set_corner_radius", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return { content: [{ type: "text", text: `✅ Corner radius updated` }] };
    });
    // ── set_opacity ──
    server.tool("set_opacity", "Set the opacity of a node.", {
        nodeId: z.string().describe("ID of the node"),
        opacity: z.number().min(0).max(1).describe("Opacity value (0 = transparent, 1 = opaque)"),
    }, async (params) => {
        const response = await bridge.sendCommand("set_opacity", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return { content: [{ type: "text", text: `✅ Opacity set to ${params.opacity}` }] };
    });
    // ── delete_node ──
    server.tool("delete_node", "Delete a node from the Figma canvas.", {
        nodeId: z.string().describe("ID of the node to delete"),
    }, async (params) => {
        const response = await bridge.sendCommand("delete_node", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return { content: [{ type: "text", text: `✅ Node deleted` }] };
    });
    // ── duplicate_node ──
    server.tool("duplicate_node", "Duplicate a node. The copy is placed next to the original with a small offset.", {
        nodeId: z.string().describe("ID of the node to duplicate"),
        offsetX: z.number().default(20).describe("Horizontal offset for the duplicate"),
        offsetY: z.number().default(20).describe("Vertical offset for the duplicate"),
    }, async (params) => {
        const response = await bridge.sendCommand("duplicate_node", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: `✅ Node duplicated: ${JSON.stringify(response.data)}` }],
        };
    });
    // ── set_text_content ──
    server.tool("set_text_content", "Change the text content of a text node.", {
        nodeId: z.string().describe("ID of the text node"),
        content: z.string().describe("New text content"),
    }, async (params) => {
        const response = await bridge.sendCommand("set_text_content", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return { content: [{ type: "text", text: `✅ Text content updated` }] };
    });
    // ── set_text_style ──
    server.tool("set_text_style", "Change the text style (font, size, weight, alignment, etc.) of a text node.", {
        nodeId: z.string().describe("ID of the text node"),
        fontFamily: z.string().optional().describe("Font family name (e.g. 'Inter', 'Roboto')"),
        fontStyle: z.string().optional().describe("Font style (e.g. 'Regular', 'Bold', 'Italic')"),
        fontSize: z.number().optional().describe("Font size in pixels"),
        letterSpacing: z.number().optional().describe("Letter spacing in pixels"),
        lineHeight: z.union([z.number(), z.literal("AUTO")]).optional().describe("Line height in pixels or 'AUTO'"),
        textAlignHorizontal: z.enum(["LEFT", "CENTER", "RIGHT", "JUSTIFIED"]).optional(),
        textAlignVertical: z.enum(["TOP", "CENTER", "BOTTOM"]).optional(),
        textDecoration: z.enum(["NONE", "UNDERLINE", "STRIKETHROUGH"]).optional(),
        textCase: z.enum(["ORIGINAL", "UPPER", "LOWER", "TITLE"]).optional(),
        color: colorSchema.optional().describe("Text color"),
    }, async (params) => {
        const response = await bridge.sendCommand("set_text_style", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return { content: [{ type: "text", text: `✅ Text style updated` }] };
    });
}
//# sourceMappingURL=modify-tools.js.map