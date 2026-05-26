import { BridgeResponse } from "./types.js";
/**
 * WebSocket Bridge — manages the connection between the MCP Server
 * and the Figma Desktop Bridge Plugin.
 *
 * The MCP Server creates a WebSocket server that the Figma Plugin connects to.
 * Commands are sent as JSON, each with a unique ID for request/response correlation.
 */
export declare class WebSocketBridge {
    private wss;
    private client;
    private pendingCommands;
    private commandCounter;
    private port;
    constructor(port?: number);
    /**
     * Start the WebSocket server and wait for Figma plugin connection
     */
    start(): Promise<void>;
    /**
     * Check if the Figma plugin is connected
     */
    isConnected(): boolean;
    /**
     * Send a command to the Figma plugin and wait for the response
     */
    sendCommand(action: string, params?: Record<string, unknown>): Promise<BridgeResponse>;
    /**
     * Handle a response from the Figma plugin
     */
    private handleResponse;
    /**
     * Stop the WebSocket server
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=websocket-bridge.d.ts.map