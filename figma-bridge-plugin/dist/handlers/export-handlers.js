"use strict";
// Export handlers — process export commands from the MCP server
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleExportCommand = handleExportCommand;
const utils_1 = require("../utils");
async function handleExportCommand(action, params) {
    try {
        switch (action) {
            case "export_node": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                const format = params.format || "PNG";
                const scale = params.scale || 2;
                const settings = format === "SVG"
                    ? { format: "SVG" }
                    : format === "PDF"
                        ? { format: "PDF" }
                        : { format: format, constraint: { type: "SCALE", value: scale } };
                const bytes = await node.exportAsync(settings);
                // Convert Uint8Array to base64
                let binary = "";
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                // Note: btoa is available in Figma's UI context
                // In the sandbox, we need to manually encode
                const base64 = uint8ArrayToBase64(bytes);
                return {
                    success: true,
                    data: {
                        format,
                        base64,
                        size: bytes.length,
                    },
                };
            }
            default:
                return { success: false, error: `Unknown export action: ${action}` };
        }
    }
    catch (err) {
        return { success: false, error: err.message || String(err) };
    }
}
/**
 * Convert Uint8Array to base64 string (works in Figma sandbox)
 */
function uint8ArrayToBase64(bytes) {
    const CHUNK_SIZE = 8192;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
        for (let j = 0; j < chunk.length; j++) {
            binary += String.fromCharCode(chunk[j]);
        }
    }
    // figma sandbox has btoa available
    return btoa(binary);
}
