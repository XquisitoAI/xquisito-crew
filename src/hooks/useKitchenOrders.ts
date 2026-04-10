import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import type { Order, DishStatus } from "../types";
import { getActiveOrders, updateDishStatus } from "../services/api";

export function useKitchenOrders() {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getActiveOrders(token);
      setOrders(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateDish = useCallback(
    async (
      orderId: string,
      orderType: string,
      dishId: string,
      status: DishStatus,
    ) => {
      // Optimistic update
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            dishes: order.dishes.map((d) =>
              d.id === dishId ? { ...d, status } : d,
            ),
          };
        }),
      );

      try {
        const token = await getToken();
        if (!token) return;
        await updateDishStatus(dishId, orderType, status, token);
      } catch (e) {
        // Revertir en caso de error
        fetchOrders();
      }

      // Si todos los dishes están entregados, remover la orden
      setOrders((prev) =>
        prev.filter((order) => {
          if (order.id !== orderId) return true;
          const updated = order.dishes.map((d) =>
            d.id === dishId ? { ...d, status } : d,
          );
          return updated.some((d) => d.status !== "delivered");
        }),
      );
    },
    [getToken, fetchOrders],
  );

  // Agregar nueva orden (desde socket)
  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => {
      if (prev.find((o) => o.id === order.id)) return prev;
      return [...prev, order];
    });
  }, []);

  // Remover orden (desde socket - cerrada desde otro lado)
  const removeOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  // Actualizar status de dish desde socket
  const updateDishFromSocket = useCallback(
    (dishId: string, status: DishStatus) => {
      setOrders((prev) =>
        prev
          .map((order) => ({
            ...order,
            dishes: order.dishes.map((d) =>
              d.id === dishId ? { ...d, status } : d,
            ),
          }))
          .filter((order) =>
            order.dishes.some((d) => d.status !== "delivered"),
          ),
      );
    },
    [],
  );

  return {
    orders,
    loading,
    error,
    fetchOrders,
    updateDish,
    addOrder,
    removeOrder,
    updateDishFromSocket,
  };
}
