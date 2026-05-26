"use strict";
// Read handlers — process read commands from the MCP server
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReadCommand = handleReadCommand;
const utils_1 = require("../utils");
async function handleReadCommand(action, params) {
    switch (action) {
        case "get_selection": {
            const selection = figma.currentPage.selection;
            const nodes = selection.map((n) => (0, utils_1.serializeNode)(n, 1));
            return { success: true, data: nodes };
        }
        case "get_page_nodes": {
            const depth = params.depth ?? 1;
            const nodes = figma.currentPage.children.map((n) => (0, utils_1.serializeNode)(n, depth));
            return { success: true, data: nodes };
        }
        case "get_node_properties": {
            const node = (0, utils_1.findNodeById)(params.nodeId);
            if (!node) {
                return { success: false, error: `Node not found: ${params.nodeId}` };
            }
            return { success: true, data: (0, utils_1.serializeNodeDetail)(node) };
        }
        case "get_current_page": {
            return {
                success: true,
                data: {
                    id: figma.currentPage.id,
                    name: figma.currentPage.name,
                    childCount: figma.currentPage.children.length,
                },
            };
        }
        case "get_local_styles": {
            const paintStyles = figma.getLocalPaintStyles().map((s) => ({
                id: s.id,
                name: s.name,
                type: "PAINT",
                paints: JSON.parse(JSON.stringify(s.paints)),
            }));
            const textStyles = figma.getLocalTextStyles().map((s) => ({
                id: s.id,
                name: s.name,
                type: "TEXT",
                fontName: s.fontName,
                fontSize: s.fontSize,
            }));
            const effectStyles = figma.getLocalEffectStyles().map((s) => ({
                id: s.id,
                name: s.name,
                type: "EFFECT",
                effects: JSON.parse(JSON.stringify(s.effects)),
            }));
            const gridStyles = figma.getLocalGridStyles().map((s) => ({
                id: s.id,
                name: s.name,
                type: "GRID",
            }));
            return {
                success: true,
                data: { paintStyles, textStyles, effectStyles, gridStyles },
            };
        }
        default:
            return { success: false, error: `Unknown read action: ${action}` };
    }
}
