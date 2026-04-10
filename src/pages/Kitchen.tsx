import { useCallback, useEffect } from "react";
import { useClerk } from "@clerk/clerk-react";
import { LogOut } from "lucide-react";
import { useKitchenOrders } from "../hooks/useKitchenOrders";
import { useSocket } from "../hooks/useSocket";
import OrderCarousel from "../components/OrderCarousel";
import type { DishStatus } from "../types";

// Muestra la ventana Tauri (si estamos en desktop)
async function showWindow() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    await win.show();
    await win.setFocus();
    await win.unminimize();
  } catch {
    // Browser — ignorar
  }
}

// Notifica a Rust si hay órdenes (bloquea cierre desde cualquier lugar)
async function syncHasOrders(hasOrders: boolean) {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_has_orders", { hasOrders });
  } catch {
    // Browser — ignorar
  }
}

// Envía notificación nativa y registra handler para click → abrir ventana
async function sendDesktopNotification(title: string, body: string) {
  try {
    const {
      isPermissionGranted,
      requestPermission,
      sendNotification,
      onAction,
    } = await import("@tauri-apps/plugin-notification");

    let permission = await isPermissionGranted();
    if (!permission) {
      const result = await requestPermission();
      permission = result === "granted";
    }
    if (!permission) return;

    // Al hacer click en la notificación → mostrar ventana
    await onAction(() => showWindow());

    sendNotification({ title, body });
  } catch {
    // Fallback: Web Notifications API (browser / desarrollo)
    if ("Notification" in window) {
      const permission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();
      if (permission === "granted") new Notification(title, { body });
    }
  }
}

export default function Kitchen() {
  const { signOut } = useClerk();

  const {
    orders,
    loading,
    error,
    fetchOrders,
    updateDish,
    removeOrder,
    updateDishFromSocket,
  } = useKitchenOrders();

  // Sincronizar con Rust si hay órdenes (bloquea cierre desde cualquier lugar)
  useEffect(() => {
    syncHasOrders(orders.length > 0);
  }, [orders.length]);

  const handleOrderClosed = useCallback(
    (orderId: string) => removeOrder(orderId),
    [removeOrder],
  );

  const handleDishStatusChanged = useCallback(
    (dishId: string, status: DishStatus) =>
      updateDishFromSocket(dishId, status),
    [updateDishFromSocket],
  );

  const handleRefetch = useCallback(() => {
    fetchOrders();
    showWindow(); // Abre la ventana automáticamente si estaba minimizada
    sendDesktopNotification("Xquisito Crew", "Nueva orden recibida");
  }, [fetchOrders]);

  useSocket({
    onOrderClosed: handleOrderClosed,
    onDishStatusChanged: handleDishStatusChanged,
    onRefetch: handleRefetch,
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">XC</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-800 leading-tight">
              Xquisito Crew
            </h1>
            <p className="text-xs text-gray-500">
              {orders.length} orden(es) pendiente(s)
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Contenido */}
      <main className="flex-1 flex flex-col p-4 min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-red-500">
            <p className="font-medium">Error al cargar órdenes</p>
            <p className="text-sm text-gray-400">{error}</p>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <OrderCarousel orders={orders} onDishStatusChange={updateDish} />
        )}
      </main>
    </div>
  );
}
