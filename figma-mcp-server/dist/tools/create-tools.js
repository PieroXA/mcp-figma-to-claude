import { z } from "zod";
// Reusable color schema
const colorSchema = z.object({
    r: z.number().min(0).max(1).describe("Red channel (0-1)"),
    g: z.number().min(0).max(1).describe("Green channel (0-1)"),
    b: z.number().min(0).max(1).describe("Blue channel (0-1)"),
    a: z.number().min(0).max(1).optional().describe("Alpha channel (0-1), defaults to 1"),
}).describe("RGBA color with values from 0 to 1");
/**
 * Register all creation tools — for adding new nodes to the Figma canvas
 */
export function registerCreateTools(server, bridge) {
    // ── create_rectangle ──
    server.tool("create_rectangle", "Create a rectangle on the Figma canvas. Optionally place it inside a parent frame.", {
        x: z.number().default(0).describe("X position"),
        y: z.number().default(0).describe("Y position"),
        width: z.number().default(100).describe("Width in pixels"),
        height: z.number().default(100).describe("Height in pixels"),
        name: z.string().optional().describe("Node name"),
        color: colorSchema.optional().describe("Fill color. Example: {r:0.2, g:0.4, b:1}"),
        cornerRadius: z.number().optional().describe("Corner radius for rounded rectangles"),
        parentId: z.string().optional().describe("Parent node ID to place inside (must be a frame/group)"),
    }, async (params) => {
        const response = await bridge.sendCommand("create_rectangle", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: `✅ Rectangle created: ${JSON.stringify(response.data)}` }],
        };
    });
    // ── create_ellipse ──
    server.tool("create_ellipse", "Create an ellipse (or circle if width equals height) on the Figma canvas.", {
        x: z.number().default(0).describe("X position"),
        y: z.number().default(0).describe("Y position"),
        width: z.number().default(100).describe("Width in pixels"),
        height: z.number().default(100).describe("Height in pixels"),
        name: z.string().optional().describe("Node name"),
        color: colorSchema.optional().describe("Fill color"),
        parentId: z.string().optional().describe("Parent node ID"),
    }, async (params) => {
        const response = await bridge.sendCommand("create_ellipse", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: `✅ Ellipse created: ${JSON.stringify(response.data)}` }],
        };
    });
    // ── create_text ──
    server.tool("create_text", "Create a text node on the Figma canvas. The font must be available on the system.", {
        x: z.number().default(0).describe("X position"),
        y: z.number().default(0).describe("Y position"),
        content: z.string().describe("Text content to display"),
        name: z.string().optional().describe("Node name"),
        fontSize: z.number().default(16).describe("Font size in pixels"),
        fontFamily: z.string().default("Inter").describe("Font family name"),
        fontStyle: z.string().default("Regular").describe("Font style (Regular, Bold, Italic, etc.)"),
        color: colorSchema.optional().describe("Text color"),
        width: z.number().optional().describe("Fixed width for text wrapping. Omit for auto-width."),
        parentId: z.string().optional().describe("Parent node ID"),
    }, async (params) => {
        const response = await bridge.sendCommand("create_text", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: `✅ Text created: ${JSON.stringify(response.data)}` }],
        };
    });
    // ── create_frame ──
    server.tool("create_frame", "Create a frame (container) on the Figma canvas. Frames can contain other elements and support auto layout.", {
        x: z.number().default(0).describe("X position"),
        y: z.number().default(0).describe("Y position"),
        width: z.number().default(400).describe("Width in pixels"),
        height: z.number().default(300).describe("Height in pixels"),
        name: z.string().optional().describe("Frame name"),
        color: colorSchema.optional().describe("Background fill color"),
        cornerRadius: z.number().optional().describe("Corner radius"),
        clipContent: z.boolean().default(true).describe("Whether to clip content that overflows the frame"),
        parentId: z.string().optional().describe("Parent node ID"),
    }, async (params) => {
        const response = await bridge.sendCommand("create_frame", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: `✅ Frame created: ${JSON.stringify(response.data)}` }],
        };
    });
    // ── create_component ──
    server.tool("create_component", "Create a reusable component on the Figma canvas. Components can be instanced multiple times.", {
        x: z.number().default(0).describe("X position"),
        y: z.number().default(0).describe("Y position"),
        width: z.number().default(200).describe("Width in pixels"),
        height: z.number().default(100).describe("Height in pixels"),
        name: z.string().describe("Component name"),
        color: colorSchema.optional().describe("Background fill color"),
        parentId: z.string().optional().describe("Parent node ID"),
    }, async (params) => {
        const response = await bridge.sendCommand("create_component", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: `✅ Component created: ${JSON.stringify(response.data)}` }],
        };
    });
    // ── create_instance ──
    server.tool("create_instance", "Create an instance of an existing component by its ID.", {
        componentId: z.string().describe("ID of the component to instantiate"),
        x: z.number().default(0).describe("X position"),
        y: z.number().default(0).describe("Y position"),
        name: z.string().optional().describe("Instance name"),
        parentId: z.string().optional().describe("Parent node ID"),
    }, async (params) => {
        const response = await bridge.sendCommand("create_instance", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: `✅ Instance created: ${JSON.stringify(response.data)}` }],
        };
    });
    // ── create_line ──
    server.tool("create_line", "Create a line on the Figma canvas.", {
        x: z.number().default(0).describe("Start X position"),
        y: z.number().default(0).describe("Start Y position"),
        length: z.number().default(100).describe("Length of the line in pixels"),
        rotation: z.number().default(0).describe("Rotation in degrees (0 = horizontal)"),
        name: z.string().optional().describe("Node name"),
        color: colorSchema.optional().describe("Stroke color"),
        strokeWeight: z.number().default(2).describe("Line thickness"),
        parentId: z.string().optional().describe("Parent node ID"),
    }, async (params) => {
        const response = await bridge.sendCommand("create_line", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: `✅ Line created: ${JSON.stringify(response.data)}` }],
        };
    });
    // ── create_polygon ──
    server.tool("create_polygon", "Create a regular polygon on the Figma canvas.", {
        x: z.number().default(0).describe("X position"),
        y: z.number().default(0).describe("Y position"),
        size: z.number().default(100).describe("Size (width and height) in pixels"),
        sides: z.number().min(3).max(20).default(6).describe("Number of sides (3=triangle, 6=hexagon, etc.)"),
        name: z.string().optional().describe("Node name"),
        color: colorSchema.optional().describe("Fill color"),
        parentId: z.string().optional().describe("Parent node ID"),
    }, async (params) => {
        const response = await bridge.sendCommand("create_polygon", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: `✅ Polygon created: ${JSON.stringify(response.data)}` }],
        };
    });
    // ── create_star ──
    server.tool("create_star", "Create a star shape on the Figma canvas.", {
        x: z.number().default(0).describe("X position"),
        y: z.number().default(0).describe("Y position"),
        size: z.number().default(100).describe("Size (width and height) in pixels"),
        points: z.number().min(3).max(20).default(5).describe("Number of star points"),
        innerRadius: z.number().min(0).max(1).default(0.4).describe("Inner radius ratio (0-1). 0.4 = classic star."),
        name: z.string().optional().describe("Node name"),
        color: colorSchema.optional().describe("Fill color"),
        parentId: z.string().optional().describe("Parent node ID"),
    }, async (params) => {
        const response = await bridge.sendCommand("create_star", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        return {
            content: [{ type: "text", text: `✅ Star created: ${JSON.stringify(response.data)}` }],
        };
    });
}
//# sourceMappingURL=create-tools.js.map