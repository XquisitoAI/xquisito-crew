import { useCallback, useEffect } from "react";
import { useClerk, useAuth } from "@clerk/clerk-react";
import { LogOut } from "lucide-react";
import { useKitchenOrders } from "../hooks/useKitchenOrders";
import { useSocket } from "../hooks/useSocket";
import OrderCarousel from "../components/OrderCarousel";
import type { DishStatus } from "../types";

async function showWindow() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    await win.show();
    await win.setFocus();
    await win.unminimize();
  } catch {}
}

async function syncHasOrders(hasOrders: boolean) {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_has_orders", { hasOrders });
  } catch {}
}

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
    await onAction(() => showWindow());
    sendNotification({ title, body, icon: "ic_notification" });
  } catch {
    if ("Notification" in window) {
      const p =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();
      if (p === "granted") new Notification(title, { body });
    }
  }
}

async function registerFcmToken(authToken: string) {
  const MAX_ATTEMPTS = 6;
  const DELAY_MS = 3000;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const token = await invoke<string | null>("get_fcm_token");
      if (token) {
        const { saveFcmToken } = await import("../services/api");
        await saveFcmToken(authToken, token, "android");
        return;
      }
    } catch {
      return; // No es Android
    }
    // Token aún no disponible, esperar antes de reintentar
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
}

async function requestNotificationPermission() {
  try {
    const { isPermissionGranted, requestPermission } = await import(
      "@tauri-apps/plugin-notification"
    );
    const granted = await isPermissionGranted();
    if (!granted) await requestPermission();
  } catch {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }
}

export default function Kitchen() {
  const { signOut } = useClerk();
  const { getToken } = useAuth();

  useEffect(() => {
    requestNotificationPermission();
    getToken().then((t) => { if (t) registerFcmToken(t); });
  }, [getToken]);

  const {
    orders,
    loading,
    error,
    fetchOrders,
    updateDish,
    removeOrder,
    updateDishFromSocket,
  } = useKitchenOrders();

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
    showWindow();
    sendDesktopNotification("Xquisito Crew", "Nueva orden recibida");
  }, [fetchOrders]);

  useSocket({
    onOrderClosed: handleOrderClosed,
    onDishStatusChanged: handleDishStatusChanged,
    onRefetch: handleRefetch,
  });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(to bottom right, #0a8b9b, #0d3d43)",
      }}
    >
      {/* Header */}
      <header className="px-5 pt-5 pb-2 flex items-center justify-between">
        <img src="/logo-short-green.webp" className="w-8 h-8" alt="Xquisito" />
        <button
          onClick={() => signOut()}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Logo central */}
      <div className="flex flex-col items-center pb-6 gap-2">
        {/*<div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-1">
          <img
            src="/logo-short-green.webp"
            alt="Xquisito"
            className="w-14 h-14"
          />
        </div>*/}
        <h1 className="text-white font-semibold text-xl">Xquisito Crew</h1>
        <p className="text-white/50 text-sm">
          {orders.length} orden(es) pendiente(s)
        </p>
      </div>

      {/* Panel oscuro inferior */}
      <div
        className="flex-1 rounded-t-4xl px-5 pt-6 pb-6 flex flex-col min-h-0"
        style={{
          background: "rgba(10, 50, 56, 0.85)",
          backdropFilter: "blur(10px)",
        }}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/70">
            <p className="font-medium text-white">Error al cargar órdenes</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium hover:bg-white/30"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <OrderCarousel orders={orders} onDishStatusChange={updateDish} />
        )}
      </div>
    </div>
  );
}
