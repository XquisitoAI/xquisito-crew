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
