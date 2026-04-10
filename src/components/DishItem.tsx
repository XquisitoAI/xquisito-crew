import type { Dish, DishStatus } from "../types";

const STATUS_LABELS: Record<DishStatus, string> = {
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
};

const STATUS_COLORS: Record<DishStatus, string> = {
  preparing: "bg-amber-100 text-amber-800 border-amber-300",
  ready: "bg-blue-100 text-blue-800 border-blue-300",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const BUTTON_ACTIVE: Record<DishStatus, string> = {
  preparing: "bg-amber-500 text-white",
  ready: "bg-blue-500 text-white",
  delivered: "bg-emerald-500 text-white",
};

interface DishItemProps {
  dish: Dish;
  onStatusChange: (dishId: string, status: DishStatus) => void;
}

const STATUSES: DishStatus[] = ["preparing", "ready", "delivered"];

export default function DishItem({ dish, onStatusChange }: DishItemProps) {
  return (
    <div className="flex flex-col gap-2 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {dish.images?.[0] && (
            <img
              src={dish.images[0]}
              alt={dish.item}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="font-medium text-gray-800 truncate">{dish.item}</p>
            <p className="text-sm text-gray-500">x{dish.quantity}</p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full border font-medium flex-shrink-0 ${STATUS_COLORS[dish.status]}`}
        >
          {STATUS_LABELS[dish.status]}
        </span>
      </div>

      <div className="flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(dish.id, s)}
            disabled={dish.status === s}
            className={`flex-1 py-1.5 text-sm rounded-lg font-medium border transition-all ${
              dish.status === s
                ? BUTTON_ACTIVE[s]
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  );
}
