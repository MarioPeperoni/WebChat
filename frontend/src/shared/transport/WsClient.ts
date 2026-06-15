import { RECONNECT_BASE_MS, RECONNECT_MAX_MS } from '@/shared/config';
import {
  ServerEventSchema,
  type ClientAction,
  type ServerEvent,
  type ServerEventOf,
  type ServerEventType,
  type Unsubscribe,
  type WsStatus,
} from '@/shared/transport/types';

type EventListener<T extends ServerEventType> = (event: ServerEventOf<T>) => void;
type AnyEventListener = (event: ServerEvent) => void;
type StatusListener = (status: WsStatus) => void;

export class WsClient {
  private socket: WebSocket | null = null;
  private url: string | null = null;
  private userId: string | null = null;
  private cancelled = false;
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private status: WsStatus = 'disconnected';

  private readonly eventListeners = new Map<ServerEventType, Set<AnyEventListener>>();
  private readonly statusListeners = new Set<StatusListener>();

  connect(url: string, userId: string): Unsubscribe {
    this.url = url;
    this.userId = userId;
    this.cancelled = false;
    this.attempt = 0;
    this.open();
    return () => this.disconnect();
  }

  disconnect(): void {
    this.cancelled = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.setStatus('disconnected');
  }

  send(action: ClientAction): void {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(action));
  }

  on<T extends ServerEventType>(type: T, handler: EventListener<T>): Unsubscribe {
    const bucket = this.eventListeners.get(type) ?? new Set<AnyEventListener>();
    bucket.add(handler as AnyEventListener);
    this.eventListeners.set(type, bucket);
    return () => {
      bucket.delete(handler as AnyEventListener);
    };
  }

  onStatus(handler: StatusListener): Unsubscribe {
    this.statusListeners.add(handler);
    handler(this.status);
    return () => {
      this.statusListeners.delete(handler);
    };
  }

  getStatus(): WsStatus {
    return this.status;
  }

  private open(): void {
    if (this.cancelled || !this.url || !this.userId) return;
    this.setStatus('connecting');

    const socket = new WebSocket(`${this.url}?userId=${this.userId}`);
    this.socket = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.setStatus('connected');
      this.send({ action: 'hello' });
    };

    socket.onmessage = (event) => {
      const parsed = this.parseEvent(event.data);
      if (parsed) this.emit(parsed);
    };

    socket.onclose = () => {
      this.socket = null;
      this.setStatus('disconnected');
      if (this.cancelled) return;
      const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** this.attempt);
      this.attempt += 1;
      this.reconnectTimer = setTimeout(() => this.open(), delay);
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  private parseEvent(raw: unknown): ServerEvent | null {
    if (typeof raw !== 'string') return null;
    try {
      const json = JSON.parse(raw);
      const result = ServerEventSchema.safeParse(json);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  private emit(event: ServerEvent): void {
    const bucket = this.eventListeners.get(event.type);
    if (!bucket) return;
    for (const listener of bucket) listener(event);
  }

  private setStatus(status: WsStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const listener of this.statusListeners) listener(status);
  }
}

export const wsClient = new WsClient();
