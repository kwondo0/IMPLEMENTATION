import { CommerceError } from "@/lib/commerce-error";

export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getRawString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function parsePositiveInteger(value: string, fieldName: string) {
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < 1) {
    throw new CommerceError(fieldName + "은(는) 1 이상의 정수여야 합니다.");
  }
  return number;
}


export function shoppingReturnPath(product: unknown, destination: unknown = "") {
  if (typeof product === "string" && /^[a-f\d]{24}$/i.test(product)) return "/products/" + product;
  if (destination === "cart") return "/cart";
  if (destination === "orders") return "/orders";
  return "/products";
}
