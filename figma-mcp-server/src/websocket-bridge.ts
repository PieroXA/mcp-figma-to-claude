import { WebSocketServer, WebSocket } from "ws";
import { BridgeCommand, BridgeResponse } from "./types.js";

const DEFAULT_PORT = 9001;
const COMMAND_TIMEOUT_MS = 30000; // 30 seconds

/**
 * WebSocket Bridge — manages the connection between the MCP Server
 * and the Figma Desktop Bridge Plugin.
 * 
 * The MCP Server creates a WebSocket server that the Figma Plugin connects to.
 * Commands are sent as JSON, each with a unique ID for request/response correlation.
 */
export class WebSocketBridge {
  private wss: WebSocketServer | null = null;
  private client: WebSocket | null = null;
  private pendingCommands: Map<string, {
    resolve: (value: BridgeResponse) => void;
    reject: (reason: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }> = new Map();
  private commandCounter = 0;
  private port: number;

  constructor(port: number = DEFAULT_PORT) {
    this.port = port;
  }

  /**
   * Start the WebSocket server and wait for Figma plugin connection
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ port: this.port });

        this.wss.on("listening", () => {
          console.error(`[FigmaMCP] WebSocket server listening on port ${this.port}`);
          resolve();
        });

        this.wss.on("connection", (ws: WebSocket) => {
          console.error("[FigmaMCP] Figma plugin connected!");

          // Only allow one client at a time
          if (this.client) {
            console.error("[FigmaMCP] Replacing existing connection");
            this.client.close();
          }

          this.client = ws;

          ws.on("message", (data: Buffer) => {
            try {
              const response: BridgeResponse = JSON.parse(data.toString());
              this.handleResponse(response);
            } catch (e) {
              console.error("[FigmaMCP] Failed to parse message:", e);
            }
          });

          ws.on("close", () => {
            console.error("[FigmaMCP] Figma plugin disconnected");
            if (this.client === ws) {
              this.client = null;
            }
            // Reject all pending commands
            for (const [id, pending] of this.pendingCommands) {
              clearTimeout(pending.timer);
              pending.reject(new Error("Figma plugin disconnected"));
              this.pendingCommands.delete(id);
            }
          });

          ws.on("error", (err) => {
            console.error("[FigmaMCP] WebSocket error:", err.message);
          });
        });

        this.wss.on("error", (err) => {
          console.error("[FigmaMCP] Server error:", err.message);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Check if the Figma plugin is connected
   */
  isConnected(): boolean {
    return this.client !== null && this.client.readyState === WebSocket.OPEN;
  }

  /**
   * Send a command to the Figma plugin and wait for the response
   */
  async sendCommand(action: string, params: Record<string, unknown> = {}): Promise<BridgeResponse> {
    if (!this.isConnected()) {
      throw new Error(
        "Figma plugin is not connected. Please open Figma Desktop, " +
        "go to Plugins > Development > Import plugin from manifest, " +
        "import the figma-bridge-plugin, and run it."
      );
    }

    const id = `cmd_${++this.commandCounter}_${Date.now()}`;
    const command: BridgeCommand = { id, action, params };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCommands.delete(id);
        reject(new Error(`Command '${action}' timed out after ${COMMAND_TIMEOUT_MS}ms`));
      }, COMMAND_TIMEOUT_MS);

      this.pendingCommands.set(id, { resolve, reject, timer });

      try {
        this.client!.send(JSON.stringify(command));
      } catch (err) {
        clearTimeout(timer);
        this.pendingCommands.delete(id);
        reject(new Error(`Failed to send command: ${(err as Error).message}`));
      }
    });
  }

  /**
   * Handle a response from the Figma plugin
   */
  private handleResponse(response: BridgeResponse): void {
    const pending = this.pendingCommands.get(response.id);
    if (!pending) {
      console.error(`[FigmaMCP] Received response for unknown command: ${response.id}`);
      return;
    }

    clearTimeout(pending.timer);
    this.pendingCommands.delete(response.id);
    pending.resolve(response);
  }

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      // Clear all pending commands
      for (const [id, pending] of this.pendingCommands) {
        clearTimeout(pending.timer);
        pending.reject(new Error("Server shutting down"));
        this.pendingCommands.delete(id);
      }

      if (this.client) {
        this.client.close();
        this.client = null;
      }

      if (this.wss) {
        this.wss.close(() => {
          console.error("[FigmaMCP] WebSocket server stopped");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
