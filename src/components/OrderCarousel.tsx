import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Order, DishStatus } from "../types";
import OrderCard from "./OrderCard";

interface OrderCarouselProps {
  orders: Order[];
  onDishStatusChange: (
    orderId: string,
    orderType: string,
    dishId: string,
    status: DishStatus,
  ) => void;
}

export default function OrderCarousel({
  orders,
  onDishStatusChange,
}: OrderCarouselProps) {
  const [index, setIndex] = useState(0);

  // Ajustar índice si se eliminaron órdenes
  const safeIndex = Math.min(index, Math.max(0, orders.length - 1));

  if (orders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
        <div className="text-6xl">✅</div>
        <p className="text-xl font-medium">No hay órdenes pendientes</p>
        <p className="text-sm">Todas las órdenes han sido entregadas</p>
      </div>
    );
  }

  const order = orders[safeIndex];

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(orders.length - 1, i + 1));

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      {/* Contador y navegación */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={prev}
          disabled={safeIndex === 0}
          className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">
            {safeIndex + 1} / {orders.length}
          </span>
          <div className="flex gap-1">
            {orders.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === safeIndex ? "bg-green-600 w-4" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={next}
          disabled={safeIndex === orders.length - 1}
          className="p-2 rounded-xl bg-white border border-gray-200 shadow-sm disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Orden actual */}
      <div className="flex-1 min-h-0">
        <OrderCard
          order={order}
          onDishStatusChange={(dishId, status) =>
            onDishStatusChange(order.id, order.orderType, dishId, status)
          }
        />
      </div>
    </div>
  );
}
