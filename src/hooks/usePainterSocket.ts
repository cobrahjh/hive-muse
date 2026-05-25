import { useEffect, useRef, useCallback } from "react";

export type WsMessage =
  | { type: "connected"; overlayClients: number; drawing?: { prompt: string; job_id: string } | null }
  | { type: "generating"; prompt: string; requester: string; job_id: string }
  | { type: "draw"; image: string; imageUrl: string; prompt: string; requester: string; job_id: string; duration: number }
  | { type: "error"; prompt?: string; reason?: string }
  | { type: "abort" };

export function usePainterSocket(onMessage: (msg: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  const connect = useCallback(() => {
    const host = import.meta.env.DEV ? "localhost:8799" : location.host;
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${host}`);

    ws.onmessage = (e) => {
      try {
        cbRef.current(JSON.parse(e.data));
      } catch {}
    };
    ws.onclose = () => {
      setTimeout(connect, 5000);
    };
    ws.onerror = () => {};
    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);
}
