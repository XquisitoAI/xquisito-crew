export type DishStatus = "preparing" | "ready" | "delivered";

export type OrderType = "tap" | "pick_and_go" | "room" | "tap_pay" | "flex_bill";

export interface Dish {
  id: string;
  item: string;
  quantity: number;
  status: DishStatus;
  images: string[];
  orderedBy?: string | null;
}

export interface Order {
  id: string;
  orderType: OrderType;
  identifier: string;
  customerName?: string | null;
  createdAt: string;
  folio?: string | number | null;
  dishes: Dish[];
}
