"use strict";
// Create handlers — process creation commands from the MCP server
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateCommand = handleCreateCommand;
const utils_1 = require("../utils");
async function handleCreateCommand(action, params) {
    try {
        switch (action) {
            case "create_rectangle": {
                const rect = figma.createRectangle();
                rect.x = params.x ?? 0;
                rect.y = params.y ?? 0;
                rect.resize(params.width ?? 100, params.height ?? 100);
                if (params.name)
                    rect.name = params.name;
                if (params.color) {
                    rect.fills = [(0, utils_1.makeSolidPaint)(params.color)];
                }
                if (params.cornerRadius !== undefined) {
                    rect.cornerRadius = params.cornerRadius;
                }
                (0, utils_1.appendToParent)(rect, params.parentId);
                return { success: true, data: (0, utils_1.serializeNode)(rect) };
            }
            case "create_ellipse": {
                const ellipse = figma.createEllipse();
                ellipse.x = params.x ?? 0;
                ellipse.y = params.y ?? 0;
                ellipse.resize(params.width ?? 100, params.height ?? 100);
                if (params.name)
                    ellipse.name = params.name;
                if (params.color) {
                    ellipse.fills = [(0, utils_1.makeSolidPaint)(params.color)];
                }
                (0, utils_1.appendToParent)(ellipse, params.parentId);
                return { success: true, data: (0, utils_1.serializeNode)(ellipse) };
            }
            case "create_text": {
                const text = figma.createText();
                const fontFamily = params.fontFamily || "Inter";
                const fontStyle = params.fontStyle || "Regular";
                // Load font before setting text
                await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
                text.x = params.x ?? 0;
                text.y = params.y ?? 0;
                text.fontName = { family: fontFamily, style: fontStyle };
                text.fontSize = params.fontSize ?? 16;
                text.characters = params.content || "Text";
                if (params.name)
                    text.name = params.name;
                if (params.color) {
                    text.fills = [(0, utils_1.makeSolidPaint)(params.color)];
                }
                if (params.width) {
                    text.resize(params.width, text.height);
                    text.textAutoResize = "HEIGHT";
                }
                (0, utils_1.appendToParent)(text, params.parentId);
                return { success: true, data: (0, utils_1.serializeNode)(text) };
            }
            case "create_frame": {
                const frame = figma.createFrame();
                frame.x = params.x ?? 0;
                frame.y = params.y ?? 0;
                frame.resize(params.width ?? 400, params.height ?? 300);
                if (params.name)
                    frame.name = params.name;
                if (params.color) {
                    frame.fills = [(0, utils_1.makeSolidPaint)(params.color)];
                }
                if (params.cornerRadius !== undefined) {
                    frame.cornerRadius = params.cornerRadius;
                }
                if (params.clipContent !== undefined) {
                    frame.clipsContent = params.clipContent;
                }
                (0, utils_1.appendToParent)(frame, params.parentId);
                return { success: true, data: (0, utils_1.serializeNode)(frame) };
            }
            case "create_component": {
                const comp = figma.createComponent();
                comp.x = params.x ?? 0;
                comp.y = params.y ?? 0;
                comp.resize(params.width ?? 200, params.height ?? 100);
                comp.name = params.name || "Component";
                if (params.color) {
                    comp.fills = [(0, utils_1.makeSolidPaint)(params.color)];
                }
                (0, utils_1.appendToParent)(comp, params.parentId);
                return { success: true, data: (0, utils_1.serializeNode)(comp) };
            }
            case "create_instance": {
                const component = figma.currentPage.findOne((n) => n.id === params.componentId && n.type === "COMPONENT");
                if (!component) {
                    return {
                        success: false,
                        error: `Component not found: ${params.componentId}`,
                    };
                }
                const instance = component.createInstance();
                instance.x = params.x ?? 0;
                instance.y = params.y ?? 0;
                if (params.name)
                    instance.name = params.name;
                (0, utils_1.appendToParent)(instance, params.parentId);
                return { success: true, data: (0, utils_1.serializeNode)(instance) };
            }
            case "create_line": {
                const line = figma.createLine();
                line.x = params.x ?? 0;
                line.y = params.y ?? 0;
                line.resize(params.length ?? 100, 0);
                if (params.rotation) {
                    line.rotation = params.rotation;
                }
                if (params.name)
                    line.name = params.name;
                line.strokeWeight = params.strokeWeight ?? 2;
                if (params.color) {
                    line.strokes = [(0, utils_1.makeSolidPaint)(params.color)];
                }
                (0, utils_1.appendToParent)(line, params.parentId);
                return { success: true, data: (0, utils_1.serializeNode)(line) };
            }
            case "create_polygon": {
                const polygon = figma.createPolygon();
                polygon.x = params.x ?? 0;
                polygon.y = params.y ?? 0;
                polygon.resize(params.size ?? 100, params.size ?? 100);
                polygon.pointCount = params.sides ?? 6;
                if (params.name)
                    polygon.name = params.name;
                if (params.color) {
                    polygon.fills = [(0, utils_1.makeSolidPaint)(params.color)];
                }
                (0, utils_1.appendToParent)(polygon, params.parentId);
                return { success: true, data: (0, utils_1.serializeNode)(polygon) };
            }
            case "create_star": {
                const star = figma.createStar();
                star.x = params.x ?? 0;
                star.y = params.y ?? 0;
                star.resize(params.size ?? 100, params.size ?? 100);
                star.pointCount = params.points ?? 5;
                star.innerRadius = params.innerRadius ?? 0.4;
                if (params.name)
                    star.name = params.name;
                if (params.color) {
                    star.fills = [(0, utils_1.makeSolidPaint)(params.color)];
                }
                (0, utils_1.appendToParent)(star, params.parentId);
                return { success: true, data: (0, utils_1.serializeNode)(star) };
            }
            default:
                return { success: false, error: `Unknown create action: ${action}` };
        }
    }
    catch (err) {
        return { success: false, error: err.message || String(err) };
    }
}
