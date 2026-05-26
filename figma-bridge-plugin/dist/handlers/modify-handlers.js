"use strict";
// Modify handlers — process modification commands from the MCP server
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleModifyCommand = handleModifyCommand;
const utils_1 = require("../utils");
async function handleModifyCommand(action, params) {
    try {
        switch (action) {
            case "move_node": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                node.x = params.x;
                node.y = params.y;
                return { success: true };
            }
            case "resize_node": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if ("resize" in node) {
                    node.resize(params.width, params.height);
                }
                return { success: true };
            }
            case "rename_node": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                node.name = params.name;
                return { success: true };
            }
            case "set_fills": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if (!("fills" in node))
                    return { success: false, error: "Node does not support fills" };
                const fills = params.fills.map((f) => {
                    if (f.type === "SOLID") {
                        return (0, utils_1.makeSolidPaint)(f.color);
                    }
                    // Gradient fills
                    return {
                        type: f.type,
                        gradientStops: f.gradientStops.map((stop) => ({
                            position: stop.position,
                            color: {
                                r: stop.color.r,
                                g: stop.color.g,
                                b: stop.color.b,
                                a: stop.color.a ?? 1,
                            },
                        })),
                        gradientTransform: [
                            [1, 0, 0],
                            [0, 1, 0],
                        ],
                    };
                });
                node.fills = fills;
                return { success: true };
            }
            case "set_strokes": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if (!("strokes" in node))
                    return { success: false, error: "Node does not support strokes" };
                const strokeNode = node;
                strokeNode.strokes = [(0, utils_1.makeSolidPaint)(params.color)];
                if ("strokeWeight" in node) {
                    node.strokeWeight = params.weight ?? 1;
                }
                if ("strokeAlign" in node && params.align) {
                    node.strokeAlign = params.align;
                }
                return { success: true };
            }
            case "set_effects": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if (!("effects" in node))
                    return { success: false, error: "Node does not support effects" };
                const effects = params.effects.map((e) => {
                    if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
                        return {
                            type: e.type,
                            color: {
                                r: e.color.r,
                                g: e.color.g,
                                b: e.color.b,
                                a: e.color.a ?? 0.25,
                            },
                            offset: { x: e.offset.x, y: e.offset.y },
                            radius: e.radius,
                            spread: e.spread ?? 0,
                            visible: e.visible !== false,
                            blendMode: "NORMAL",
                        };
                    }
                    return {
                        type: e.type,
                        radius: e.radius,
                        visible: e.visible !== false,
                    };
                });
                node.effects = effects;
                return { success: true };
            }
            case "set_corner_radius": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if (!("cornerRadius" in node))
                    return { success: false, error: "Node does not support corner radius" };
                const rectNode = node;
                if (params.radius !== undefined) {
                    rectNode.cornerRadius = params.radius;
                }
                else {
                    // Individual corners
                    if (params.topLeft !== undefined)
                        rectNode.topLeftRadius = params.topLeft;
                    if (params.topRight !== undefined)
                        rectNode.topRightRadius = params.topRight;
                    if (params.bottomRight !== undefined)
                        rectNode.bottomRightRadius = params.bottomRight;
                    if (params.bottomLeft !== undefined)
                        rectNode.bottomLeftRadius = params.bottomLeft;
                }
                return { success: true };
            }
            case "set_opacity": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if ("opacity" in node) {
                    node.opacity = params.opacity;
                }
                return { success: true };
            }
            case "delete_node": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                node.remove();
                return { success: true };
            }
            case "duplicate_node": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                const clone = node.clone();
                clone.x += params.offsetX ?? 20;
                clone.y += params.offsetY ?? 20;
                return { success: true, data: (0, utils_1.serializeNode)(clone) };
            }
            case "set_text_content": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node || node.type !== "TEXT") {
                    return { success: false, error: `Text node not found: ${params.nodeId}` };
                }
                const textNode = node;
                // Load all fonts used in the text node
                const fontName = textNode.fontName;
                if (fontName === figma.mixed) {
                    // Load all unique fonts from ranges
                    const len = textNode.characters.length;
                    const fontsToLoad = new Set();
                    for (let i = 0; i < len; i++) {
                        const fn = textNode.getRangeFontName(i, i + 1);
                        fontsToLoad.add(`${fn.family}::${fn.style}`);
                    }
                    for (const key of fontsToLoad) {
                        const [family, style] = key.split("::");
                        await figma.loadFontAsync({ family, style });
                    }
                }
                else {
                    await figma.loadFontAsync(fontName);
                }
                textNode.characters = params.content;
                return { success: true };
            }
            case "set_text_style": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node || node.type !== "TEXT") {
                    return { success: false, error: `Text node not found: ${params.nodeId}` };
                }
                const textNode = node;
                // Determine font to load
                const family = params.fontFamily || (textNode.fontName !== figma.mixed ? textNode.fontName.family : "Inter");
                const style = params.fontStyle || (textNode.fontName !== figma.mixed ? textNode.fontName.style : "Regular");
                await figma.loadFontAsync({ family, style });
                if (params.fontFamily || params.fontStyle) {
                    textNode.fontName = { family, style };
                }
                if (params.fontSize !== undefined)
                    textNode.fontSize = params.fontSize;
                if (params.letterSpacing !== undefined) {
                    textNode.letterSpacing = { value: params.letterSpacing, unit: "PIXELS" };
                }
                if (params.lineHeight !== undefined) {
                    if (params.lineHeight === "AUTO") {
                        textNode.lineHeight = { unit: "AUTO" };
                    }
                    else {
                        textNode.lineHeight = { value: params.lineHeight, unit: "PIXELS" };
                    }
                }
                if (params.textAlignHorizontal)
                    textNode.textAlignHorizontal = params.textAlignHorizontal;
                if (params.textAlignVertical)
                    textNode.textAlignVertical = params.textAlignVertical;
                if (params.textDecoration)
                    textNode.textDecoration = params.textDecoration;
                if (params.textCase)
                    textNode.textCase = params.textCase;
                if (params.color) {
                    textNode.fills = [(0, utils_1.makeSolidPaint)(params.color)];
                }
                return { success: true };
            }
            case "set_visibility": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                node.visible = params.visible;
                return { success: true };
            }
            case "set_rotation": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if ("rotation" in node) {
                    node.rotation = params.rotation;
                }
                return { success: true };
            }
            case "set_blend_mode": {
                const node = (0, utils_1.findNodeById)(params.nodeId);
                if (!node)
                    return { success: false, error: `Node not found: ${params.nodeId}` };
                if ("blendMode" in node) {
                    node.blendMode = params.blendMode;
                }
                return { success: true };
            }
            default:
                return { success: false, error: `Unknown modify action: ${action}` };
        }
    }
    catch (err) {
        return { success: false, error: err.message || String(err) };
    }
}
