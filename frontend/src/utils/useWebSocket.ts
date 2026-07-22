import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "@/src/api/client";

export type WebSocketStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";

interface UseWebSocketOptions {
  path: string; // e.g. "/ws/hack/s123"
  onMessage?: (data: any) => void;
  autoReconnect?: boolean;
  heartbeatIntervalMs?: number;
}

export function useWebSocket({
  path,
  onMessage,
  autoReconnect = true,
  heartbeatIntervalMs = 15000,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<WebSocketStatus>("DISCONNECTED");
  const [lastMessage, setLastMessage] = useState<any>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setStatus("ERROR");
      return;
    }

    setStatus("CONNECTING");

    // Compute ws host URL (ws:// or wss://)
    const host = "localhost:8001";
    const wsUrl = `ws://${host}${path}?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus("CONNECTED");
        reconnectCount.current = 0;

        // Start heartbeat ping
        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, heartbeatIntervalMs);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (onMessage) onMessage(data);
        } catch {
          /* noop */
        }
      };

      ws.onerror = () => {
        setStatus("ERROR");
      };

      ws.onclose = () => {
        setStatus("DISCONNECTED");
        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);

        if (autoReconnect && reconnectCount.current < 5) {
          const delay = Math.min(1000 * 2 ** reconnectCount.current, 10000);
          reconnectCount.current += 1;
          setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch {
      setStatus("ERROR");
    }
  }, [path, autoReconnect, heartbeatIntervalMs, onMessage]);

  const sendMessage = useCallback((payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus("DISCONNECTED");
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { status, lastMessage, sendMessage, reconnect: connect, disconnect };
}
