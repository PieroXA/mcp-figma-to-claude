"use strict";
// Layout handlers — process layout commands from the MCP server
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLayoutCommand = handleLayoutCommand;
const utils_1 = require("../utils");
async function handleLayoutCommand(action, params) {
    try {
        switch (action) {
            case "set_auto_layout": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if (node.type !== "FRAME" && node.type !== "COMPONENT") {
                    return { success: false, error: "Auto layout can only be applied to frames or components" };
                }
                const frame = node;
                frame.layoutMode = params.mode;
                // Padding
                if (params.padding !== undefined) {
                    if (typeof params.padding === "number") {
                        frame.paddingTop = params.padding;
                        frame.paddingRight = params.padding;
                        frame.paddingBottom = params.padding;
                        frame.paddingLeft = params.padding;
                    }
                    else {
                        frame.paddingTop = params.padding.top ?? 0;
                        frame.paddingRight = params.padding.right ?? 0;
                        frame.paddingBottom = params.padding.bottom ?? 0;
                        frame.paddingLeft = params.padding.left ?? 0;
                    }
                }
                if (params.itemSpacing !== undefined)
                    frame.itemSpacing = params.itemSpacing;
                if (params.primaryAxisAlignItems)
                    frame.primaryAxisAlignItems = params.primaryAxisAlignItems;
                if (params.counterAxisAlignItems)
                    frame.counterAxisAlignItems = params.counterAxisAlignItems;
                if (params.primaryAxisSizingMode)
                    frame.primaryAxisSizingMode = params.primaryAxisSizingMode;
                if (params.counterAxisSizingMode)
                    frame.counterAxisSizingMode = params.counterAxisSizingMode;
                return { success: true };
            }
            case "remove_auto_layout": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if (node.type !== "FRAME" && node.type !== "COMPONENT") {
                    return { success: false, error: "Not a frame or component" };
                }
                node.layoutMode = "NONE";
                return { success: true };
            }
            case "set_constraints": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if (!("constraints" in node))
                    return { success: false, error: "Node does not support constraints" };
                node.constraints = {
                    horizontal: params.horizontal,
                    vertical: params.vertical,
                };
                return { success: true };
            }
            case "group_nodes": {
                const nodes = [];
                for (const id of params.nodeIds) {
                    const node = (0, utils_1.findNodeById)(id);
                    if (!node)
                        return { success: false, error: `Node not found: ${id}` };
                    nodes.push(node);
                }
                if (nodes.length < 2) {
                    return { success: false, error: "Need at least 2 nodes to group" };
                }
                const group = figma.group(nodes, figma.currentPage);
                if (params.name)
                    group.name = params.name;
                return { success: true, data: (0, utils_1.serializeNode)(group) };
            }
            case "ungroup_nodes": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if (node.type !== "GROUP") {
                    return { success: false, error: "Node is not a group" };
                }
                const group = node;
                const parent = group.parent;
                if (!parent)
                    return { success: false, error: "Group has no parent" };
                // Move children out of the group
                const children = [...group.children];
                for (const child of children) {
                    parent.appendChild(child);
                }
                group.remove();
                return { success: true, data: children.map((c) => (0, utils_1.serializeNode)(c)) };
            }
            case "set_layout_sizing": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if (params.horizontal) {
                    if (params.horizontal === "FILL") {
                        node.layoutSizingHorizontal = "FILL";
                    }
                    else if (params.horizontal === "HUG") {
                        node.layoutSizingHorizontal = "HUG";
                    }
                    else {
                        node.layoutSizingHorizontal = "FIXED";
                    }
                }
                if (params.vertical) {
                    if (params.vertical === "FILL") {
                        node.layoutSizingVertical = "FILL";
                    }
                    else if (params.vertical === "HUG") {
                        node.layoutSizingVertical = "HUG";
                    }
                    else {
                        node.layoutSizingVertical = "FIXED";
                    }
                }
                return { success: true };
            }
            default:
                return { success: false, error: `Unknown layout action: ${action}` };
        }
    }
    catch (err) {
        return { success: false, error: err.message || String(err) };
    }
}
