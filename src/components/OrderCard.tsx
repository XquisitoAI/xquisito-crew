import type { Order, DishStatus } from "../types";
import DishItem from "./DishItem";

const ORDER_TYPE_LABELS: Record<string, string> = {
  tap: "Tap Order & Pay",
  pick_and_go: "Pick & Go",
  room: "Room Service",
  tap_pay: "Tap & Pay",
  flex_bill: "Flex Bill",
};

const ORDER_TYPE_COLORS: Record<string, string> = {
  tap: "bg-blue-500/20 text-blue-300",
  pick_and_go: "bg-orange-500/20 text-orange-300",
  room: "bg-pink-500/20 text-pink-300",
  tap_pay: "bg-cyan-500/20 text-cyan-300",
  flex_bill: "bg-purple-500/20 text-purple-300",
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
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.07)" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${ORDER_TYPE_COLORS[order.orderType] ?? "bg-white/10 text-white/70"}`}
          >
            {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
          </span>
          <span className="text-xs text-white/40">
            {formatTime(order.createdAt)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
            <h2 className="text-xl font-bold text-white">{order.identifier}</h2>
            {order.customerName && (
              <span className="text-base text-white/80">
                — {order.customerName}
              </span>
            )}
          </div>
          {order.folio != null && order.folio !== "" && (
            <span className="shrink-0 text-sm font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/60">
              #{String(order.folio).padStart(5, "0")}
            </span>
          )}
        </div>
        <p className="text-sm text-white/50 mt-0.5">
          {delivered}/{total} entregados
        </p>
        {order.orderNotes && (
          <p className="text-sm text-white/80 mt-1.5">
            Comentarios: {order.orderNotes}
          </p>
        )}
      </div>

      {/* Dishes */}
      <div className="px-5 py-4 flex flex-col gap-4">
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
