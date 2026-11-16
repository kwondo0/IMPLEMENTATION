"use client";

export function ProductImageInput({ maxBytes, required = false }: { maxBytes: number; required?: boolean }) {
  return (
    <label>
      상품 이미지 {required ? "" : "(선택)"}
      <input
        type="file"
        name="image"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        required={required}
        onChange={(event) => {
          const input = event.currentTarget;
          const size = input.files?.[0]?.size ?? 0;
          input.setCustomValidity(size > maxBytes ? "이미지는 3MB 이하로 올려 주세요." : "");
        }}
      />
      <small className="muted">JPG, PNG, WebP · 최대 3MB</small>
    </label>
  );
}
