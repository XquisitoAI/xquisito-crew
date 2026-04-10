import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { io, Socket } from "socket.io-client";
import type { DishStatus, Order } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UseSocketProps {
  onOrderClosed: (orderId: string) => void;
  onDishStatusChanged: (dishId: string, status: DishStatus) => void;
  onRefetch: () => void;
}

export function useSocket({
  onOrderClosed,
  onDishStatusChanged,
  onRefetch,
}: UseSocketProps) {
  const { getToken } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let socket: Socket;

    const connect = async () => {
      const token = await getToken();
      if (!token) return;

      socket = io(BASE_URL, {
        auth: { token, clientType: "admin-portal" },
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("[CREW] Socket conectado");
        // El servidor auto-une al usuario a su sala en dashboardEvents.js
      });

      socket.on("room:joined", () => {
        console.log("[CREW] Sala del restaurante unida");
      });

      // Nueva orden → refetch para obtener datos completos del backend
      socket.on("dashboard:new-transaction", () => {
        onRefetch();
      });

      // Orden cerrada desde otro lugar
      socket.on(
        "dashboard:order-update",
        (data: { order: Order; action: string }) => {
          if (data.action === "closed") {
            onOrderClosed(data.order.id);
          }
        },
      );

      // Dish status cambiado desde otro lugar (FlexBill/Tap)
      socket.on(
        "table:dish-status",
        (data: { dishId: string; status: DishStatus }) => {
          onDishStatusChanged(data.dishId, data.status);
        },
      );

      socket.on(
        "tappay:dish-status-changed",
        (data: { dishId: string; status: DishStatus }) => {
          onDishStatusChanged(data.dishId, data.status);
        },
      );

      socket.on("disconnect", (reason) => {
        console.log("[CREW] Socket desconectado:", reason);
      });
    };

    connect();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [getToken, onOrderClosed, onDishStatusChanged, onRefetch]);
}
