// Layout handlers — process layout commands from the MCP server

import { findNodeById, serializeNode } from "../utils";

export async function handleLayoutCommand(
  action: string,
  params: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    switch (action) {
      case "set_auto_layout": {
        const node = findNodeById(params.nodeId);
        if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
        if (node.type !== "FRAME" && node.type !== "COMPONENT") {
          return { success: false, error: "Auto layout can only be applied to frames or components" };
        }

        const frame = node as FrameNode;
        frame.layoutMode = params.mode;

        // Padding
        if (params.padding !== undefined) {
          if (typeof params.padding === "number") {
            frame.paddingTop = params.padding;
            frame.paddingRight = params.padding;
            frame.paddingBottom = params.padding;
            frame.paddingLeft = params.padding;
          } else {
            frame.paddingTop = params.padding.top ?? 0;
            frame.paddingRight = params.padding.right ?? 0;
            frame.paddingBottom = params.padding.bottom ?? 0;
            frame.paddingLeft = params.padding.left ?? 0;
          }
        }

        if (params.itemSpacing !== undefined) frame.itemSpacing = params.itemSpacing;
        if (params.primaryAxisAlignItems) frame.primaryAxisAlignItems = params.primaryAxisAlignItems;
        if (params.counterAxisAlignItems) frame.counterAxisAlignItems = params.counterAxisAlignItems;
        if (params.primaryAxisSizingMode) frame.primaryAxisSizingMode = params.primaryAxisSizingMode;
        if (params.counterAxisSizingMode) frame.counterAxisSizingMode = params.counterAxisSizingMode;

        return { success: true };
      }

      case "remove_auto_layout": {
        const node = findNodeById(params.nodeId);
        if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
        if (node.type !== "FRAME" && node.type !== "COMPONENT") {
          return { success: false, error: "Not a frame or component" };
        }
        (node as FrameNode).layoutMode = "NONE";
        return { success: true };
      }

      case "set_constraints": {
        const node = findNodeById(params.nodeId);
        if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
        if (!("constraints" in node)) return { success: false, error: "Node does not support constraints" };

        (node as ConstraintMixin).constraints = {
          horizontal: params.horizontal,
          vertical: params.vertical,
        };
        return { success: true };
      }

      case "group_nodes": {
        const nodes: SceneNode[] = [];
        for (const id of params.nodeIds) {
          const node = findNodeById(id);
          if (!node) return { success: false, error: `Node not found: ${id}` };
          nodes.push(node);
        }

        if (nodes.length < 2) {
          return { success: false, error: "Need at least 2 nodes to group" };
        }

        const group = figma.group(nodes, figma.currentPage);
        if (params.name) group.name = params.name;

        return { success: true, data: serializeNode(group) };
      }

      case "ungroup_nodes": {
        const node = findNodeById(params.nodeId);
        if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
        if (node.type !== "GROUP") {
          return { success: false, error: "Node is not a group" };
        }

        const group = node as GroupNode;
        const parent = group.parent;
        if (!parent) return { success: false, error: "Group has no parent" };

        // Move children out of the group
        const children = [...group.children];
        for (const child of children) {
          (parent as ChildrenMixin).appendChild(child);
        }
        group.remove();

        return { success: true, data: children.map((c) => serializeNode(c)) };
      }

      case "set_layout_sizing": {
        const node = findNodeById(params.nodeId);
        if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };

        if (params.horizontal) {
          if (params.horizontal === "FILL") {
            (node as any).layoutSizingHorizontal = "FILL";
          } else if (params.horizontal === "HUG") {
            (node as any).layoutSizingHorizontal = "HUG";
          } else {
            (node as any).layoutSizingHorizontal = "FIXED";
          }
        }

        if (params.vertical) {
          if (params.vertical === "FILL") {
            (node as any).layoutSizingVertical = "FILL";
          } else if (params.vertical === "HUG") {
            (node as any).layoutSizingVertical = "HUG";
          } else {
            (node as any).layoutSizingVertical = "FIXED";
          }
        }

        return { success: true };
      }

      default:
        return { success: false, error: `Unknown layout action: ${action}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}
