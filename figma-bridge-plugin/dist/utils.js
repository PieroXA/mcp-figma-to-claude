"use strict";
// Utility functions for the Figma Bridge Plugin
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseColor = parseColor;
exports.makeSolidPaint = makeSolidPaint;
exports.serializeNode = serializeNode;
exports.serializeNodeDetail = serializeNodeDetail;
exports.findNodeById = findNodeById;
exports.appendToParent = appendToParent;
/**
 * Convert params color {r, g, b, a} to Figma RGB + opacity
 */
function parseColor(color) {
    return {
        rgb: { r: color.r, g: color.g, b: color.b },
        opacity: color.a !== undefined ? color.a : 1,
    };
}
/**
 * Create a Figma SolidPaint from color params
 */
function makeSolidPaint(color) {
    const { rgb, opacity } = parseColor(color);
    return {
        type: "SOLID",
        color: rgb,
        opacity,
    };
}
/**
 * Serialize basic node info for sending back via WebSocket
 */
function serializeNode(node, depth = 0) {
    const info = {
        id: node.id,
        name: node.name,
        type: node.type,
        x: "x" in node ? node.x : 0,
        y: "y" in node ? node.y : 0,
        width: "width" in node ? node.width : 0,
        height: "height" in node ? node.height : 0,
        visible: node.visible,
        opacity: "opacity" in node ? node.opacity : 1,
    };
    if (depth > 0 && "children" in node) {
        info.children = node.children.map((c) => serializeNode(c, depth - 1));
    }
    return info;
}
/**
 * Serialize detailed node properties
 */
function serializeNodeDetail(node) {
    const detail = serializeNode(node, 0);
    // Fills
    if ("fills" in node && node.fills !== figma.mixed) {
        detail.fills = JSON.parse(JSON.stringify(node.fills));
    }
    // Strokes
    if ("strokes" in node) {
        detail.strokes = JSON.parse(JSON.stringify(node.strokes));
        if ("strokeWeight" in node) {
            detail.strokeWeight = node.strokeWeight;
        }
        if ("strokeAlign" in node) {
            detail.strokeAlign = node.strokeAlign;
        }
    }
    // Effects
    if ("effects" in node) {
        detail.effects = JSON.parse(JSON.stringify(node.effects));
    }
    // Corner radius
    if ("cornerRadius" in node) {
        detail.cornerRadius = node.cornerRadius;
    }
    if ("topLeftRadius" in node) {
        detail.topLeftRadius = node.topLeftRadius;
        detail.topRightRadius = node.topRightRadius;
        detail.bottomRightRadius = node.bottomRightRadius;
        detail.bottomLeftRadius = node.bottomLeftRadius;
    }
    // Auto Layout
    if ("layoutMode" in node && node.layoutMode !== "NONE") {
        const frame = node;
        detail.autoLayout = {
            mode: frame.layoutMode,
            paddingTop: frame.paddingTop,
            paddingRight: frame.paddingRight,
            paddingBottom: frame.paddingBottom,
            paddingLeft: frame.paddingLeft,
            itemSpacing: frame.itemSpacing,
            primaryAxisAlignItems: frame.primaryAxisAlignItems,
            counterAxisAlignItems: frame.counterAxisAlignItems,
            primaryAxisSizingMode: frame.primaryAxisSizingMode,
            counterAxisSizingMode: frame.counterAxisSizingMode,
        };
    }
    // Text properties
    if (node.type === "TEXT") {
        const textNode = node;
        detail.characters = textNode.characters;
        if (textNode.fontName !== figma.mixed) {
            detail.fontName = textNode.fontName;
        }
        if (textNode.fontSize !== figma.mixed) {
            detail.fontSize = textNode.fontSize;
        }
        detail.textAlignHorizontal = textNode.textAlignHorizontal;
        detail.textAlignVertical = textNode.textAlignVertical;
    }
    // Constraints
    if ("constraints" in node) {
        detail.constraints = node.constraints;
    }
    // Blend mode
    if ("blendMode" in node) {
        detail.blendMode = node.blendMode;
    }
    return detail;
}
/**
 * Find a node by ID on the current page
 */
function findNodeById(nodeId) {
    return figma.currentPage.findOne((n) => n.id === nodeId);
}
/**
 * Append a node to a parent (by ID) or to the current page
 */
function appendToParent(node, parentId) {
    if (parentId) {
        const parent = findNodeById(parentId);
        if (parent && "appendChild" in parent) {
            parent.appendChild(node);
            return;
        }
    }
    figma.currentPage.appendChild(node);
}
