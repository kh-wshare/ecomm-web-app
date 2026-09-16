export type DeliveryMethodType = "PICKUP" | "DELIVERY";
export type DeliveryMethodStatus = "ACTIVE" | "INACTIVE";

// Fees arrive and are sent as decimal strings ("2.50"), never numbers.
export type DeliveryZone = {
  id: string;
  name: string;
  countries: string[];
  provinces: string[];
  cities: string[];
  postalCodes: string[];
  baseFee: string;
  perItemFee: string;
  freeOverSubtotal: string | null;
  minSubtotal: string | null;
  maxSubtotal: string | null;
  estimatedMinDays: number | null;
  estimatedMaxDays: number | null;
  isFallback: boolean;
  sortOrder: number;
};

export type DeliveryMethod = {
  id: string;
  merchantId: string;
  branchId: string | null;
  name: string;
  code: string;
  description: string | null;
  type: DeliveryMethodType;
  status: DeliveryMethodStatus;
  isDefault: boolean;
  sortOrder: number;
  zones: DeliveryZone[];
};

export type DeliveryMethodValues = {
  name: string;
  code: string;
  description: string;
  type: DeliveryMethodType;
  branchId: string;
  status: DeliveryMethodStatus;
  isDefault: boolean;
  sortOrder: number;
};

// Every field is a string because these bind straight to text inputs; the data
// layer is what turns them into the numbers and decimal strings the API wants.
export type DeliveryZoneValues = {
  name: string;
  countries: string;
  provinces: string;
  cities: string;
  postalCodes: string;
  baseFee: string;
  perItemFee: string;
  freeOverSubtotal: string;
  minSubtotal: string;
  maxSubtotal: string;
  estimatedMinDays: string;
  estimatedMaxDays: string;
  isFallback: boolean;
  sortOrder: string;
};

export type DeliveryMethodFilters = {
  status?: DeliveryMethodStatus;
  type?: DeliveryMethodType;
};
