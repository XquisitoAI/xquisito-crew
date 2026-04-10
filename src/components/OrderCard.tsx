import type { Order, DishStatus } from "../types";
import DishItem from "./DishItem";

const ORDER_TYPE_LABELS: Record<string, string> = {
  tap: "Tap Order",
  pick_and_go: "Pick & Go",
  room: "Room Service",
  tap_pay: "Tap & Pay",
  flex_bill: "FlexBill",
};

const ORDER_TYPE_COLORS: Record<string, string> = {
  tap: "bg-blue-100 text-blue-700",
  pick_and_go: "bg-orange-100 text-orange-700",
  room: "bg-pink-100 text-pink-700",
  tap_pay: "bg-cyan-100 text-cyan-700",
  flex_bill: "bg-purple-100 text-purple-700",
};

interface OrderCardProps {
  order: Order;
  onDishStatusChange: (dishId: string, status: DishStatus) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderCard({
  order,
  onDishStatusChange,
}: OrderCardProps) {
  const delivered = order.dishes.filter((d) => d.status === "delivered").length;
  const total = order.dishes.length;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${ORDER_TYPE_COLORS[order.orderType]}`}
          >
            {ORDER_TYPE_LABELS[order.orderType]}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(order.createdAt)}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">{order.identifier}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {delivered}/{total} entregados
        </p>
      </div>

      {/* Dishes */}
      <div className="flex-1 overflow-y-auto p-4">
        {order.dishes.map((dish) => (
          <DishItem
            key={dish.id}
            dish={dish}
            onStatusChange={onDishStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
