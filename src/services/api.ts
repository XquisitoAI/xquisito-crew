import type { Order } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function authFetch(
  url: string,
  token: string,
  options: RequestInit = {},
) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getActiveOrders(token: string): Promise<Order[]> {
  const data = await authFetch("/api/kitchen/orders", token);
  return data.orders ?? [];
}

export async function updateDishStatus(
  dishId: string,
  orderType: string,
  status: string,
  token: string,
) {
  if (orderType === "tap_pay") {
    return authFetch(`/api/tap-pay/dishes/${dishId}/status`, token, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }
  if (orderType === "pick_and_go") {
    return authFetch(`/api/pick-and-go/dishes/${dishId}/status`, token, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }
  // tap, room, flex_bill → dish-orders endpoint
  return authFetch(`/api/dish-orders/${dishId}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function saveFcmToken(
  token: string,
  fcmToken: string,
  platform: string,
) {
  return authFetch("/api/kitchen/fcm-token", token, {
    method: "POST",
    body: JSON.stringify({ token: fcmToken, platform }),
  });
}

export async function deleteFcmToken(token: string, fcmToken: string) {
  return authFetch("/api/kitchen/fcm-token", token, {
    method: "DELETE",
    body: JSON.stringify({ token: fcmToken }),
  });
}

export interface Branch {
  id: string;
  name: string;
  branch_number: number;
}

export async function getBranches(token: string): Promise<Branch[]> {
  const data = await authFetch("/api/kitchen/branches", token);
  return data.branches ?? [];
}

export interface PrinterRecord {
  id: string;
  branch_id: string;
  ip: string | null;
  port: number | null;
  name: string | null;
  role: "bar" | "kitchen" | "other" | "all" | null;
  is_active: boolean;
  last_seen_at: string | null;
  connection_type: "wifi" | "usb";
  usb_device_name: string | null;
}

export async function getPrinters(branchId: string): Promise<PrinterRecord[]> {
  const res = await fetch(`${BASE_URL}/api/pos/branch/${branchId}/printers`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.printers ?? [];
}

export async function syncPrinters(
  token: string,
  branchId: string,
  printers: (
    | { ip: string; port: number; connection_type?: "wifi" }
    | { usb_device_name: string; vendor_id?: number; product_id?: number; connection_type: "usb" }
  )[],
): Promise<PrinterRecord[]> {
  const data = await authFetch("/api/kitchen/printers/sync", token, {
    method: "POST",
    body: JSON.stringify({ branchId, printers }),
  });
  return data.printers ?? [];
}

export async function updatePrinter(
  token: string,
  printerId: string,
  updates: { name?: string; role?: string; is_active?: boolean },
): Promise<PrinterRecord> {
  const data = await authFetch(`/api/kitchen/printers/${printerId}`, token, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return data.printer;
}
