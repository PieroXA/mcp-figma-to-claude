import { z } from "zod";
/**
 * Register export tools — for exporting nodes as images
 */
export function registerExportTools(server, bridge) {
    // ── export_node ──
    server.tool("export_node", "Export a node as PNG, SVG, JPG, or PDF. Returns the image as a base64-encoded string.", {
        nodeId: z.string().describe("ID of the node to export"),
        format: z.enum(["PNG", "SVG", "JPG", "PDF"]).default("PNG").describe("Export format"),
        scale: z.number().min(0.01).max(4).default(2).describe("Export scale (1 = 1x, 2 = 2x retina, etc.)"),
    }, async (params) => {
        const response = await bridge.sendCommand("export_node", params);
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        const data = response.data;
        if (params.format === "SVG") {
            // Return SVG as text
            const svgContent = Buffer.from(data.base64, "base64").toString("utf-8");
            return { content: [{ type: "text", text: svgContent }] };
        }
        // Return binary formats as base64 image
        return {
            content: [{
                    type: "image",
                    data: data.base64,
                    mimeType: params.format === "PNG" ? "image/png" :
                        params.format === "JPG" ? "image/jpeg" : "application/pdf",
                }],
        };
    });
    // ── get_image ──
    server.tool("get_image", "Get a rendered preview image of a node (screenshot). Returns a PNG image.", {
        nodeId: z.string().describe("ID of the node to capture"),
        scale: z.number().min(0.5).max(4).default(1).describe("Scale factor"),
    }, async (params) => {
        const response = await bridge.sendCommand("export_node", {
            nodeId: params.nodeId,
            format: "PNG",
            scale: params.scale,
        });
        if (!response.success) {
            return { content: [{ type: "text", text: `Error: ${response.error}` }] };
        }
        const data = response.data;
        return {
            content: [{
                    type: "image",
                    data: data.base64,
                    mimeType: "image/png",
                }],
        };
    });
}
//# sourceMappingURL=export-tools.js.map