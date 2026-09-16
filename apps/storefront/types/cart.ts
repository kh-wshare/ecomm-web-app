export type CartStatus = "ACTIVE" | "CONVERTED" | "ABANDONED" | "EXPIRED";

export type DeliveryMethodType = "PICKUP" | "DELIVERY";

export type CartLine = {
  // Documented as optional on the cart schema, but it is what identifies a line
  // for updates and removals — the UI disables those controls without it.
  id: string | null;
  productId: string;
  variantId: string | null;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  note: string | null;
};

export type Address = {
  label: string | null;
  recipientName: string;
  phone: string | null;
  email: string | null;
  line1: string;
  line2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
};

export type StorefrontAddress = Address & {
  id: string;
  customerId: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryOption = {
  methodId: string;
  code: string;
  name: string;
  description: string | null;
  type: DeliveryMethodType;
  branchId: string | null;
  isDefault: boolean;
  zoneId: string | null;
  zoneName: string | null;
  fee: string;
  estimatedMinDays: number | null;
  estimatedMaxDays: number | null;
};

export type Cart = {
  id: string;
  status: CartStatus;
  sourceChannel: "WEBSITE";
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  note: string | null;
  currency: string;
  subtotalAmount: string;
  shippingAmount: string;
  totalAmount: string;
  itemCount: number;
  items: CartLine[];
  shippingAddress: Address | null;
  billingAddress: Address | null;
  delivery: DeliveryOption | null;
  checkoutSessionId: string | null;
  expiresAt: string;
};

export type CreatedCart = Cart & {
  cartToken: string;
};

// The shape the address form binds to. Every field is a string so it can go
// straight into an input; the data layer drops the empty optional ones.
export type AddressValues = {
  label: string;
  recipientName: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  note: string;
  isDefaultShipping: boolean;
};

export const emptyAddressValues: AddressValues = {
  city: "",
  country: "KH",
  email: "",
  isDefaultShipping: false,
  label: "",
  line1: "",
  line2: "",
  note: "",
  phone: "",
  postalCode: "",
  province: "",
  recipientName: "",
};

export function toAddressValues(address: StorefrontAddress): AddressValues {
  return {
    city: address.city ?? "",
    country: address.country,
    email: address.email ?? "",
    isDefaultShipping: address.isDefaultShipping,
    label: address.label ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    note: address.note ?? "",
    phone: address.phone ?? "",
    postalCode: address.postalCode ?? "",
    province: address.province ?? "",
    recipientName: address.recipientName,
  };
}

export function formatAddress(address: Address) {
  return [
    address.line1,
    address.line2,
    address.city,
    address.province,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}
