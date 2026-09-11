import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateDiscountTag(price: number, originalPrice: number): string {
  if (!originalPrice || originalPrice <= price) return "";
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  return `${discount}% OFF`;
}

export function formatDate(dateVal?: any): string {
  if (!dateVal) return "N/A";
  try {
    let d: Date;
    if (typeof dateVal === "object" && typeof dateVal.toDate === "function") {
      d = dateVal.toDate();
    } else if (typeof dateVal === "object" && typeof dateVal.seconds === "number") {
      d = new Date(dateVal.seconds * 1000);
    } else if (typeof dateVal === "number") {
      d = new Date(dateVal);
    } else {
      d = new Date(dateVal);
    }
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateVal);
  }
}

export function formatAddressItem(addr: any): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  if (typeof addr === "object") {
    const parts = [
      addr.houseNo || addr.house_no || addr.flatNo || addr.building || addr.house,
      addr.address || addr.addressLine1 || addr.street || addr.location || addr.deliveryLocation || addr.fullAddress,
      addr.landmark,
      addr.area || addr.locality || addr.colony,
      addr.city,
      addr.state,
      addr.pincode || addr.zip || addr.postalCode
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(", ");
    if (addr.location && typeof addr.location === "string") return addr.location;
    if (addr.address && typeof addr.address === "string") return addr.address;
    if (addr.fullAddress && typeof addr.fullAddress === "string") return addr.fullAddress;
    
    const strValues = Object.values(addr)
      .filter((v) => v && (typeof v === "string" || typeof v === "number"))
      .map((v) => String(v).trim())
      .filter(Boolean);
    if (strValues.length > 0) return strValues.join(", ");
  }
  return String(addr);
}

export function formatStringValue(val: any): string {
  if (val === null || val === undefined) return "N/A";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") return formatAddressItem(val);
  return String(val);
}

