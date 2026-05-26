/**
 * Command sent from MCP Server to Figma Plugin via WebSocket
 */
export interface BridgeCommand {
    id: string;
    action: string;
    params: Record<string, unknown>;
}
/**
 * Response sent from Figma Plugin to MCP Server via WebSocket
 */
export interface BridgeResponse {
    id: string;
    success: boolean;
    data?: unknown;
    error?: string;
}
/**
 * Connection status of the Figma Plugin bridge
 */
export type BridgeStatus = "disconnected" | "connected" | "waiting";
export interface RGBAColor {
    r: number;
    g: number;
    b: number;
    a?: number;
}
export interface SolidFill {
    type: "SOLID";
    color: RGBAColor;
    opacity?: number;
}
export interface GradientStop {
    position: number;
    color: RGBAColor;
}
export interface GradientFill {
    type: "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND";
    gradientStops: GradientStop[];
}
export type FillPaint = SolidFill | GradientFill;
export interface StrokeConfig {
    color: RGBAColor;
    weight: number;
    align?: "INSIDE" | "OUTSIDE" | "CENTER";
    opacity?: number;
}
export interface ShadowEffect {
    type: "DROP_SHADOW" | "INNER_SHADOW";
    color: RGBAColor;
    offset: {
        x: number;
        y: number;
    };
    radius: number;
    spread?: number;
    visible?: boolean;
}
export interface BlurEffect {
    type: "LAYER_BLUR" | "BACKGROUND_BLUR";
    radius: number;
    visible?: boolean;
}
export type EffectConfig = ShadowEffect | BlurEffect;
export interface AutoLayoutConfig {
    mode: "HORIZONTAL" | "VERTICAL";
    padding?: number | {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    itemSpacing?: number;
    primaryAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN";
    counterAxisAlignItems?: "MIN" | "MAX" | "CENTER";
    primaryAxisSizingMode?: "FIXED" | "AUTO";
    counterAxisSizingMode?: "FIXED" | "AUTO";
}
export interface TextStyleConfig {
    fontFamily?: string;
    fontStyle?: string;
    fontSize?: number;
    letterSpacing?: number;
    lineHeight?: number | "AUTO";
    textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
    textAlignVertical?: "TOP" | "CENTER" | "BOTTOM";
    textDecoration?: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
    textCase?: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE";
}
export interface ConstraintsConfig {
    horizontal: "MIN" | "MAX" | "CENTER" | "STRETCH" | "SCALE";
    vertical: "MIN" | "MAX" | "CENTER" | "STRETCH" | "SCALE";
}
export interface NodeInfo {
    id: string;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    opacity: number;
    children?: NodeInfo[];
}
export interface NodeDetail extends NodeInfo {
    fills?: unknown[];
    strokes?: unknown[];
    effects?: unknown[];
    cornerRadius?: number | unknown;
    constraints?: unknown;
    autoLayout?: unknown;
    characters?: string;
    fontName?: unknown;
    fontSize?: number;
}
//# sourceMappingURL=types.d.ts.map