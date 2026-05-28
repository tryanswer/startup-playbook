export type BridgeCommand = 'codex' | 'claude' | 'shell';

export interface BridgeMessage {
  type: 'output' | 'exit' | 'error';
  data?: string;
  code?: number;
  message?: string;
}

export class BridgeClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onOutputCallback: ((data: string) => void) | null = null;
  private onExitCallback: ((code: number) => void) | null = null;
  private onErrorCallback: ((message: string) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManualDisconnect = false;

  constructor(url: string = 'ws://localhost:3001') {
    this.url = url;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isManualDisconnect = false;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('Bridge connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: BridgeMessage = JSON.parse(event.data);
            
            switch (message.type) {
              case 'output':
                if (this.onOutputCallback && message.data) {
                  this.onOutputCallback(message.data);
                }
                break;
              case 'exit':
                if (this.onExitCallback && message.code !== undefined) {
                  this.onExitCallback(message.code);
                }
                break;
              case 'error':
                if (this.onErrorCallback && message.message) {
                  this.onErrorCallback(message.message);
                }
                console.error('Bridge error:', message.message);
                break;
            }
          } catch (err) {
            console.error('Failed to parse bridge message:', err);
          }
        };

        this.ws.onclose = () => {
          console.log('Bridge disconnected');
          this.ws = null;
          
          if (!this.isManualDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect().catch(() => {}), delay);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  spawn(command: BridgeCommand, args: string[] = [], cwd: string = ''): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Bridge not connected');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'spawn',
      command,
      args,
      cwd,
    }));
  }

  sendInput(data: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Bridge not connected');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'input',
      data,
    }));
  }

  resize(cols: number, rows: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Bridge not connected');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'resize',
      cols,
      rows,
    }));
  }

  onOutput(callback: (data: string) => void): void {
    this.onOutputCallback = callback;
  }

  onExit(callback: (code: number) => void): void {
    this.onExitCallback = callback;
  }

  onError(callback: (message: string) => void): void {
    this.onErrorCallback = callback;
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
