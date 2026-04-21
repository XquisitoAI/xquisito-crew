export type DishStatus = "preparing" | "ready" | "delivered";

export type OrderType = "tap" | "pick_and_go" | "room" | "tap_pay" | "flex_bill";

export interface CustomFieldOption {
  optionId: string;
  optionName: string;
  price: number;
  quantity: number;
}

export interface CustomField {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  selectedOptions?: CustomFieldOption[];
}

export interface Dish {
  id: string;
  item: string;
  quantity: number;
  status: DishStatus;
  images: string[];
  orderedBy?: string | null;
  customFields?: CustomField[] | null;
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
