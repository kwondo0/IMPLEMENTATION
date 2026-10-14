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
  if (!Number.isSafeInteger(number) || number < 1) {
    throw new Error(`${fieldName}은(는) 1 이상의 정수여야 합니다.`);
  }
  return number;
}
