// Create handlers — process creation commands from the MCP server

import { makeSolidPaint, serializeNode, appendToParent } from "../utils";

export async function handleCreateCommand(
  action: string,
  params: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    switch (action) {
      case "create_rectangle": {
        const rect = figma.createRectangle();
        rect.x = params.x ?? 0;
        rect.y = params.y ?? 0;
        rect.resize(params.width ?? 100, params.height ?? 100);
        if (params.name) rect.name = params.name;
        if (params.color) {
          rect.fills = [makeSolidPaint(params.color)];
        }
        if (params.cornerRadius !== undefined) {
          rect.cornerRadius = params.cornerRadius;
        }
        appendToParent(rect, params.parentId);
        return { success: true, data: serializeNode(rect) };
      }

      case "create_ellipse": {
        const ellipse = figma.createEllipse();
        ellipse.x = params.x ?? 0;
        ellipse.y = params.y ?? 0;
        ellipse.resize(params.width ?? 100, params.height ?? 100);
        if (params.name) ellipse.name = params.name;
        if (params.color) {
          ellipse.fills = [makeSolidPaint(params.color)];
        }
        appendToParent(ellipse, params.parentId);
        return { success: true, data: serializeNode(ellipse) };
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

        if (params.name) text.name = params.name;
        if (params.color) {
          text.fills = [makeSolidPaint(params.color)];
        }
        if (params.width) {
          text.resize(params.width, text.height);
          text.textAutoResize = "HEIGHT";
        }

        appendToParent(text, params.parentId);
        return { success: true, data: serializeNode(text) };
      }

      case "create_frame": {
        const frame = figma.createFrame();
        frame.x = params.x ?? 0;
        frame.y = params.y ?? 0;
        frame.resize(params.width ?? 400, params.height ?? 300);
        if (params.name) frame.name = params.name;
        if (params.color) {
          frame.fills = [makeSolidPaint(params.color)];
        }
        if (params.cornerRadius !== undefined) {
          frame.cornerRadius = params.cornerRadius;
        }
        if (params.clipContent !== undefined) {
          frame.clipsContent = params.clipContent;
        }
        appendToParent(frame, params.parentId);
        return { success: true, data: serializeNode(frame) };
      }

      case "create_component": {
        const comp = figma.createComponent();
        comp.x = params.x ?? 0;
        comp.y = params.y ?? 0;
        comp.resize(params.width ?? 200, params.height ?? 100);
        comp.name = params.name || "Component";
        if (params.color) {
          comp.fills = [makeSolidPaint(params.color)];
        }
        appendToParent(comp, params.parentId);
        return { success: true, data: serializeNode(comp) };
      }

      case "create_instance": {
        const component = figma.currentPage.findOne(
          (n) => n.id === params.componentId && n.type === "COMPONENT"
        ) as ComponentNode | null;

        if (!component) {
          return {
            success: false,
            error: `Component not found: ${params.componentId}`,
          };
        }

        const instance = component.createInstance();
        instance.x = params.x ?? 0;
        instance.y = params.y ?? 0;
        if (params.name) instance.name = params.name;
        appendToParent(instance, params.parentId);
        return { success: true, data: serializeNode(instance) };
      }

      case "create_line": {
        const line = figma.createLine();
        line.x = params.x ?? 0;
        line.y = params.y ?? 0;
        line.resize(params.length ?? 100, 0);
        if (params.rotation) {
          line.rotation = params.rotation;
        }
        if (params.name) line.name = params.name;
        line.strokeWeight = params.strokeWeight ?? 2;
        if (params.color) {
          line.strokes = [makeSolidPaint(params.color)];
        }
        appendToParent(line, params.parentId);
        return { success: true, data: serializeNode(line) };
      }

      case "create_polygon": {
        const polygon = figma.createPolygon();
        polygon.x = params.x ?? 0;
        polygon.y = params.y ?? 0;
        polygon.resize(params.size ?? 100, params.size ?? 100);
        polygon.pointCount = params.sides ?? 6;
        if (params.name) polygon.name = params.name;
        if (params.color) {
          polygon.fills = [makeSolidPaint(params.color)];
        }
        appendToParent(polygon, params.parentId);
        return { success: true, data: serializeNode(polygon) };
      }

      case "create_star": {
        const star = figma.createStar();
        star.x = params.x ?? 0;
        star.y = params.y ?? 0;
        star.resize(params.size ?? 100, params.size ?? 100);
        star.pointCount = params.points ?? 5;
        star.innerRadius = params.innerRadius ?? 0.4;
        if (params.name) star.name = params.name;
        if (params.color) {
          star.fills = [makeSolidPaint(params.color)];
        }
        appendToParent(star, params.parentId);
        return { success: true, data: serializeNode(star) };
      }

      default:
        return { success: false, error: `Unknown create action: ${action}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}
