"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/utils.ts
  function parseColor(color) {
    return {
      rgb: { r: color.r, g: color.g, b: color.b },
      opacity: color.a !== void 0 ? color.a : 1
    };
  }
  function makeSolidPaint(color) {
    const { rgb, opacity } = parseColor(color);
    return {
      type: "SOLID",
      color: rgb,
      opacity
    };
  }
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
      opacity: "opacity" in node ? node.opacity : 1
    };
    if (depth > 0 && "children" in node) {
      info.children = node.children.map(
        (c) => serializeNode(c, depth - 1)
      );
    }
    return info;
  }
  function serializeNodeDetail(node) {
    const detail = serializeNode(node, 0);
    if ("fills" in node && node.fills !== figma.mixed) {
      detail.fills = JSON.parse(JSON.stringify(node.fills));
    }
    if ("strokes" in node) {
      detail.strokes = JSON.parse(JSON.stringify(node.strokes));
      if ("strokeWeight" in node) {
        detail.strokeWeight = node.strokeWeight;
      }
      if ("strokeAlign" in node) {
        detail.strokeAlign = node.strokeAlign;
      }
    }
    if ("effects" in node) {
      detail.effects = JSON.parse(JSON.stringify(node.effects));
    }
    if ("cornerRadius" in node) {
      detail.cornerRadius = node.cornerRadius;
    }
    if ("topLeftRadius" in node) {
      detail.topLeftRadius = node.topLeftRadius;
      detail.topRightRadius = node.topRightRadius;
      detail.bottomRightRadius = node.bottomRightRadius;
      detail.bottomLeftRadius = node.bottomLeftRadius;
    }
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
        counterAxisSizingMode: frame.counterAxisSizingMode
      };
    }
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
    if ("constraints" in node) {
      detail.constraints = node.constraints;
    }
    if ("blendMode" in node) {
      detail.blendMode = node.blendMode;
    }
    return detail;
  }
  function findNodeById(nodeId) {
    return figma.currentPage.findOne((n) => n.id === nodeId);
  }
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
  var init_utils = __esm({
    "src/utils.ts"() {
      "use strict";
    }
  });

  // src/handlers/read-handlers.ts
  function handleReadCommand(action, params) {
    return __async(this, null, function* () {
      var _a;
      switch (action) {
        case "get_selection": {
          const selection = figma.currentPage.selection;
          const nodes = selection.map((n) => serializeNode(n, 1));
          return { success: true, data: nodes };
        }
        case "get_page_nodes": {
          const depth = (_a = params.depth) != null ? _a : 1;
          const nodes = figma.currentPage.children.map(
            (n) => serializeNode(n, depth)
          );
          return { success: true, data: nodes };
        }
        case "get_node_properties": {
          const node = findNodeById(params.nodeId);
          if (!node) {
            return { success: false, error: `Node not found: ${params.nodeId}` };
          }
          return { success: true, data: serializeNodeDetail(node) };
        }
        case "get_current_page": {
          return {
            success: true,
            data: {
              id: figma.currentPage.id,
              name: figma.currentPage.name,
              childCount: figma.currentPage.children.length
            }
          };
        }
        case "get_local_styles": {
          const paintStyles = figma.getLocalPaintStyles().map((s) => ({
            id: s.id,
            name: s.name,
            type: "PAINT",
            paints: JSON.parse(JSON.stringify(s.paints))
          }));
          const textStyles = figma.getLocalTextStyles().map((s) => ({
            id: s.id,
            name: s.name,
            type: "TEXT",
            fontName: s.fontName,
            fontSize: s.fontSize
          }));
          const effectStyles = figma.getLocalEffectStyles().map((s) => ({
            id: s.id,
            name: s.name,
            type: "EFFECT",
            effects: JSON.parse(JSON.stringify(s.effects))
          }));
          const gridStyles = figma.getLocalGridStyles().map((s) => ({
            id: s.id,
            name: s.name,
            type: "GRID"
          }));
          return {
            success: true,
            data: { paintStyles, textStyles, effectStyles, gridStyles }
          };
        }
        default:
          return { success: false, error: `Unknown read action: ${action}` };
      }
    });
  }
  var init_read_handlers = __esm({
    "src/handlers/read-handlers.ts"() {
      "use strict";
      init_utils();
    }
  });

  // src/handlers/create-handlers.ts
  function handleCreateCommand(action, params) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J;
      try {
        switch (action) {
          case "create_rectangle": {
            const rect = figma.createRectangle();
            rect.x = (_a = params.x) != null ? _a : 0;
            rect.y = (_b = params.y) != null ? _b : 0;
            rect.resize((_c = params.width) != null ? _c : 100, (_d = params.height) != null ? _d : 100);
            if (params.name) rect.name = params.name;
            if (params.color) {
              rect.fills = [makeSolidPaint(params.color)];
            }
            if (params.cornerRadius !== void 0) {
              rect.cornerRadius = params.cornerRadius;
            }
            appendToParent(rect, params.parentId);
            return { success: true, data: serializeNode(rect) };
          }
          case "create_ellipse": {
            const ellipse = figma.createEllipse();
            ellipse.x = (_e = params.x) != null ? _e : 0;
            ellipse.y = (_f = params.y) != null ? _f : 0;
            ellipse.resize((_g = params.width) != null ? _g : 100, (_h = params.height) != null ? _h : 100);
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
            yield figma.loadFontAsync({ family: fontFamily, style: fontStyle });
            text.x = (_i = params.x) != null ? _i : 0;
            text.y = (_j = params.y) != null ? _j : 0;
            text.fontName = { family: fontFamily, style: fontStyle };
            text.fontSize = (_k = params.fontSize) != null ? _k : 16;
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
            frame.x = (_l = params.x) != null ? _l : 0;
            frame.y = (_m = params.y) != null ? _m : 0;
            frame.resize((_n = params.width) != null ? _n : 400, (_o = params.height) != null ? _o : 300);
            if (params.name) frame.name = params.name;
            if (params.color) {
              frame.fills = [makeSolidPaint(params.color)];
            }
            if (params.cornerRadius !== void 0) {
              frame.cornerRadius = params.cornerRadius;
            }
            if (params.clipContent !== void 0) {
              frame.clipsContent = params.clipContent;
            }
            appendToParent(frame, params.parentId);
            return { success: true, data: serializeNode(frame) };
          }
          case "create_component": {
            const comp = figma.createComponent();
            comp.x = (_p = params.x) != null ? _p : 0;
            comp.y = (_q = params.y) != null ? _q : 0;
            comp.resize((_r = params.width) != null ? _r : 200, (_s = params.height) != null ? _s : 100);
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
            );
            if (!component) {
              return {
                success: false,
                error: `Component not found: ${params.componentId}`
              };
            }
            const instance = component.createInstance();
            instance.x = (_t = params.x) != null ? _t : 0;
            instance.y = (_u = params.y) != null ? _u : 0;
            if (params.name) instance.name = params.name;
            appendToParent(instance, params.parentId);
            return { success: true, data: serializeNode(instance) };
          }
          case "create_line": {
            const line = figma.createLine();
            line.x = (_v = params.x) != null ? _v : 0;
            line.y = (_w = params.y) != null ? _w : 0;
            line.resize((_x = params.length) != null ? _x : 100, 0);
            if (params.rotation) {
              line.rotation = params.rotation;
            }
            if (params.name) line.name = params.name;
            line.strokeWeight = (_y = params.strokeWeight) != null ? _y : 2;
            if (params.color) {
              line.strokes = [makeSolidPaint(params.color)];
            }
            appendToParent(line, params.parentId);
            return { success: true, data: serializeNode(line) };
          }
          case "create_polygon": {
            const polygon = figma.createPolygon();
            polygon.x = (_z = params.x) != null ? _z : 0;
            polygon.y = (_A = params.y) != null ? _A : 0;
            polygon.resize((_B = params.size) != null ? _B : 100, (_C = params.size) != null ? _C : 100);
            polygon.pointCount = (_D = params.sides) != null ? _D : 6;
            if (params.name) polygon.name = params.name;
            if (params.color) {
              polygon.fills = [makeSolidPaint(params.color)];
            }
            appendToParent(polygon, params.parentId);
            return { success: true, data: serializeNode(polygon) };
          }
          case "create_star": {
            const star = figma.createStar();
            star.x = (_E = params.x) != null ? _E : 0;
            star.y = (_F = params.y) != null ? _F : 0;
            star.resize((_G = params.size) != null ? _G : 100, (_H = params.size) != null ? _H : 100);
            star.pointCount = (_I = params.points) != null ? _I : 5;
            star.innerRadius = (_J = params.innerRadius) != null ? _J : 0.4;
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
      } catch (err) {
        return { success: false, error: err.message || String(err) };
      }
    });
  }
  var init_create_handlers = __esm({
    "src/handlers/create-handlers.ts"() {
      "use strict";
      init_utils();
    }
  });

  // src/handlers/modify-handlers.ts
  function handleModifyCommand(action, params) {
    return __async(this, null, function* () {
      var _a, _b, _c;
      try {
        switch (action) {
          case "move_node": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            node.x = params.x;
            node.y = params.y;
            return { success: true };
          }
          case "resize_node": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            if ("resize" in node) {
              node.resize(params.width, params.height);
            }
            return { success: true };
          }
          case "rename_node": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            node.name = params.name;
            return { success: true };
          }
          case "set_fills": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            if (!("fills" in node)) return { success: false, error: "Node does not support fills" };
            const fills = params.fills.map((f) => {
              if (f.type === "SOLID") {
                return makeSolidPaint(f.color);
              }
              return {
                type: f.type,
                gradientStops: f.gradientStops.map((stop) => {
                  var _a2;
                  return {
                    position: stop.position,
                    color: {
                      r: stop.color.r,
                      g: stop.color.g,
                      b: stop.color.b,
                      a: (_a2 = stop.color.a) != null ? _a2 : 1
                    }
                  };
                }),
                gradientTransform: [
                  [1, 0, 0],
                  [0, 1, 0]
                ]
              };
            });
            node.fills = fills;
            return { success: true };
          }
          case "set_strokes": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            if (!("strokes" in node)) return { success: false, error: "Node does not support strokes" };
            const strokeNode = node;
            strokeNode.strokes = [makeSolidPaint(params.color)];
            if ("strokeWeight" in node) {
              node.strokeWeight = (_a = params.weight) != null ? _a : 1;
            }
            if ("strokeAlign" in node && params.align) {
              node.strokeAlign = params.align;
            }
            return { success: true };
          }
          case "set_effects": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            if (!("effects" in node)) return { success: false, error: "Node does not support effects" };
            const effects = params.effects.map((e) => {
              var _a2, _b2;
              if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
                return {
                  type: e.type,
                  color: {
                    r: e.color.r,
                    g: e.color.g,
                    b: e.color.b,
                    a: (_a2 = e.color.a) != null ? _a2 : 0.25
                  },
                  offset: { x: e.offset.x, y: e.offset.y },
                  radius: e.radius,
                  spread: (_b2 = e.spread) != null ? _b2 : 0,
                  visible: e.visible !== false,
                  blendMode: "NORMAL"
                };
              }
              return {
                type: e.type,
                radius: e.radius,
                visible: e.visible !== false
              };
            });
            node.effects = effects;
            return { success: true };
          }
          case "set_corner_radius": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            if (!("cornerRadius" in node)) return { success: false, error: "Node does not support corner radius" };
            const rectNode = node;
            if (params.radius !== void 0) {
              rectNode.cornerRadius = params.radius;
            } else {
              if (params.topLeft !== void 0) rectNode.topLeftRadius = params.topLeft;
              if (params.topRight !== void 0) rectNode.topRightRadius = params.topRight;
              if (params.bottomRight !== void 0) rectNode.bottomRightRadius = params.bottomRight;
              if (params.bottomLeft !== void 0) rectNode.bottomLeftRadius = params.bottomLeft;
            }
            return { success: true };
          }
          case "set_opacity": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            if ("opacity" in node) {
              node.opacity = params.opacity;
            }
            return { success: true };
          }
          case "delete_node": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            node.remove();
            return { success: true };
          }
          case "duplicate_node": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            const clone = node.clone();
            clone.x += (_b = params.offsetX) != null ? _b : 20;
            clone.y += (_c = params.offsetY) != null ? _c : 20;
            return { success: true, data: serializeNode(clone) };
          }
          case "set_text_content": {
            const node = findNodeById(params.nodeId);
            if (!node || node.type !== "TEXT") {
              return { success: false, error: `Text node not found: ${params.nodeId}` };
            }
            const textNode = node;
            const fontName = textNode.fontName;
            if (fontName === figma.mixed) {
              const len = textNode.characters.length;
              const fontsToLoad = /* @__PURE__ */ new Set();
              for (let i = 0; i < len; i++) {
                const fn = textNode.getRangeFontName(i, i + 1);
                fontsToLoad.add(`${fn.family}::${fn.style}`);
              }
              for (const key of fontsToLoad) {
                const [family, style] = key.split("::");
                yield figma.loadFontAsync({ family, style });
              }
            } else {
              yield figma.loadFontAsync(fontName);
            }
            textNode.characters = params.content;
            return { success: true };
          }
          case "set_text_style": {
            const node = findNodeById(params.nodeId);
            if (!node || node.type !== "TEXT") {
              return { success: false, error: `Text node not found: ${params.nodeId}` };
            }
            const textNode = node;
            const family = params.fontFamily || (textNode.fontName !== figma.mixed ? textNode.fontName.family : "Inter");
            const style = params.fontStyle || (textNode.fontName !== figma.mixed ? textNode.fontName.style : "Regular");
            yield figma.loadFontAsync({ family, style });
            if (params.fontFamily || params.fontStyle) {
              textNode.fontName = { family, style };
            }
            if (params.fontSize !== void 0) textNode.fontSize = params.fontSize;
            if (params.letterSpacing !== void 0) {
              textNode.letterSpacing = { value: params.letterSpacing, unit: "PIXELS" };
            }
            if (params.lineHeight !== void 0) {
              if (params.lineHeight === "AUTO") {
                textNode.lineHeight = { unit: "AUTO" };
              } else {
                textNode.lineHeight = { value: params.lineHeight, unit: "PIXELS" };
              }
            }
            if (params.textAlignHorizontal) textNode.textAlignHorizontal = params.textAlignHorizontal;
            if (params.textAlignVertical) textNode.textAlignVertical = params.textAlignVertical;
            if (params.textDecoration) textNode.textDecoration = params.textDecoration;
            if (params.textCase) textNode.textCase = params.textCase;
            if (params.color) {
              textNode.fills = [makeSolidPaint(params.color)];
            }
            return { success: true };
          }
          case "set_visibility": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            node.visible = params.visible;
            return { success: true };
          }
          case "set_rotation": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            if ("rotation" in node) {
              node.rotation = params.rotation;
            }
            return { success: true };
          }
          case "set_blend_mode": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            if ("blendMode" in node) {
              node.blendMode = params.blendMode;
            }
            return { success: true };
          }
          default:
            return { success: false, error: `Unknown modify action: ${action}` };
        }
      } catch (err) {
        return { success: false, error: err.message || String(err) };
      }
    });
  }
  var init_modify_handlers = __esm({
    "src/handlers/modify-handlers.ts"() {
      "use strict";
      init_utils();
    }
  });

  // src/handlers/layout-handlers.ts
  function handleLayoutCommand(action, params) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d;
      try {
        switch (action) {
          case "set_auto_layout": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            if (node.type !== "FRAME" && node.type !== "COMPONENT") {
              return { success: false, error: "Auto layout can only be applied to frames or components" };
            }
            const frame = node;
            frame.layoutMode = params.mode;
            if (params.padding !== void 0) {
              if (typeof params.padding === "number") {
                frame.paddingTop = params.padding;
                frame.paddingRight = params.padding;
                frame.paddingBottom = params.padding;
                frame.paddingLeft = params.padding;
              } else {
                frame.paddingTop = (_a = params.padding.top) != null ? _a : 0;
                frame.paddingRight = (_b = params.padding.right) != null ? _b : 0;
                frame.paddingBottom = (_c = params.padding.bottom) != null ? _c : 0;
                frame.paddingLeft = (_d = params.padding.left) != null ? _d : 0;
              }
            }
            if (params.itemSpacing !== void 0) frame.itemSpacing = params.itemSpacing;
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
            node.layoutMode = "NONE";
            return { success: true };
          }
          case "set_constraints": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            if (!("constraints" in node)) return { success: false, error: "Node does not support constraints" };
            node.constraints = {
              horizontal: params.horizontal,
              vertical: params.vertical
            };
            return { success: true };
          }
          case "group_nodes": {
            const nodes = [];
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
            const group = node;
            const parent = group.parent;
            if (!parent) return { success: false, error: "Group has no parent" };
            const children = [...group.children];
            for (const child of children) {
              parent.appendChild(child);
            }
            group.remove();
            return { success: true, data: children.map((c) => serializeNode(c)) };
          }
          case "set_layout_sizing": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            if (params.horizontal) {
              if (params.horizontal === "FILL") {
                node.layoutSizingHorizontal = "FILL";
              } else if (params.horizontal === "HUG") {
                node.layoutSizingHorizontal = "HUG";
              } else {
                node.layoutSizingHorizontal = "FIXED";
              }
            }
            if (params.vertical) {
              if (params.vertical === "FILL") {
                node.layoutSizingVertical = "FILL";
              } else if (params.vertical === "HUG") {
                node.layoutSizingVertical = "HUG";
              } else {
                node.layoutSizingVertical = "FIXED";
              }
            }
            return { success: true };
          }
          default:
            return { success: false, error: `Unknown layout action: ${action}` };
        }
      } catch (err) {
        return { success: false, error: err.message || String(err) };
      }
    });
  }
  var init_layout_handlers = __esm({
    "src/handlers/layout-handlers.ts"() {
      "use strict";
      init_utils();
    }
  });

  // src/handlers/export-handlers.ts
  function handleExportCommand(action, params) {
    return __async(this, null, function* () {
      try {
        switch (action) {
          case "export_node": {
            const node = findNodeById(params.nodeId);
            if (!node) return { success: false, error: `Node not found: ${params.nodeId}` };
            const format = params.format || "PNG";
            const scale = params.scale || 2;
            const settings = format === "SVG" ? { format: "SVG" } : format === "PDF" ? { format: "PDF" } : { format, constraint: { type: "SCALE", value: scale } };
            const bytes = yield node.exportAsync(settings);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = uint8ArrayToBase64(bytes);
            return {
              success: true,
              data: {
                format,
                base64,
                size: bytes.length
              }
            };
          }
          default:
            return { success: false, error: `Unknown export action: ${action}` };
        }
      } catch (err) {
        return { success: false, error: err.message || String(err) };
      }
    });
  }
  function uint8ArrayToBase64(bytes) {
    const CHUNK_SIZE = 8192;
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    return btoa(binary);
  }
  var init_export_handlers = __esm({
    "src/handlers/export-handlers.ts"() {
      "use strict";
      init_utils();
    }
  });

  // src/code.ts
  var require_code = __commonJS({
    "src/code.ts"(exports) {
      init_read_handlers();
      init_create_handlers();
      init_modify_handlers();
      init_layout_handlers();
      init_export_handlers();
      figma.showUI(__html__, {
        width: 320,
        height: 240,
        visible: true
      });
      var READ_ACTIONS = /* @__PURE__ */ new Set([
        "get_selection",
        "get_page_nodes",
        "get_node_properties",
        "get_current_page",
        "get_local_styles"
      ]);
      var CREATE_ACTIONS = /* @__PURE__ */ new Set([
        "create_rectangle",
        "create_ellipse",
        "create_text",
        "create_frame",
        "create_component",
        "create_instance",
        "create_line",
        "create_polygon",
        "create_star"
      ]);
      var MODIFY_ACTIONS = /* @__PURE__ */ new Set([
        "move_node",
        "resize_node",
        "rename_node",
        "set_fills",
        "set_strokes",
        "set_effects",
        "set_corner_radius",
        "set_opacity",
        "delete_node",
        "duplicate_node",
        "set_text_content",
        "set_text_style",
        "set_visibility",
        "set_rotation",
        "set_blend_mode"
      ]);
      var LAYOUT_ACTIONS = /* @__PURE__ */ new Set([
        "set_auto_layout",
        "remove_auto_layout",
        "set_constraints",
        "group_nodes",
        "ungroup_nodes",
        "set_layout_sizing"
      ]);
      var EXPORT_ACTIONS = /* @__PURE__ */ new Set([
        "export_node"
      ]);
      function routeCommand(action, params) {
        return __async(this, null, function* () {
          if (READ_ACTIONS.has(action)) {
            return handleReadCommand(action, params);
          }
          if (CREATE_ACTIONS.has(action)) {
            return handleCreateCommand(action, params);
          }
          if (MODIFY_ACTIONS.has(action)) {
            return handleModifyCommand(action, params);
          }
          if (LAYOUT_ACTIONS.has(action)) {
            return handleLayoutCommand(action, params);
          }
          if (EXPORT_ACTIONS.has(action)) {
            return handleExportCommand(action, params);
          }
          return { success: false, error: `Unknown action: ${action}` };
        });
      }
      figma.ui.onmessage = (msg) => __async(null, null, function* () {
        if (msg.type === "bridge_command") {
          const { id, action, params } = msg;
          console.log(`[MCP Bridge] Executing: ${action}`);
          try {
            const result = yield routeCommand(action, params || {});
            figma.ui.postMessage({
              type: "bridge_response",
              id,
              success: result.success,
              data: result.data,
              error: result.error
            });
          } catch (err) {
            figma.ui.postMessage({
              type: "bridge_response",
              id,
              success: false,
              error: err.message || String(err)
            });
          }
        }
      });
      figma.ui.postMessage({ type: "sandbox_ready" });
      console.log("[MCP Bridge] Plugin sandbox started. Waiting for UI connection...");
    }
  });
  require_code();
})();
