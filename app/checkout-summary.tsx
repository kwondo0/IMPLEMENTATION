"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createOrderAction } from "@/app/actions";
import { formatWon } from "@/lib/format";

function CheckoutButton({ unavailable }: { unavailable: boolean }) {
  const { pending } = useFormStatus();
  return <button className="button" type="submit" disabled={pending || unavailable}>{pending ? "주문 생성 중…" : "주문서 생성"}</button>;
}

export function CheckoutSummary({ total, coupons, unavailable }: {
  total: number;
  coupons: { id: string; code: string; discount: number }[];
  unavailable: boolean;
}) {
  const [couponId, setCouponId] = useState("");
  const discount = Math.min(total, coupons.find((coupon) => coupon.id === couponId)?.discount ?? 0);
  return (
    <aside className="panel checkout-summary">
      <h2>주문 요약</h2>
      <form className="form-grid" action={createOrderAction}>
        <label>할인 쿠폰
          <select name="couponId" value={couponId} onChange={(event) => setCouponId(event.target.value)}>
            <option value="">사용 안 함</option>
            {coupons.map((coupon) => <option key={coupon.id} value={coupon.id}>{coupon.code} · {formatWon(coupon.discount)} 할인</option>)}
          </select>
        </label>
        <dl className="checkout-totals">
          <div><dt>상품 금액</dt><dd>{formatWon(total)}</dd></div>
          <div><dt>쿠폰 할인</dt><dd>{discount ? "−" : ""}{formatWon(discount)}</dd></div>
          <div className="checkout-total"><dt>예상 결제 금액</dt><dd aria-live="polite">{formatWon(total - discount)}</dd></div>
        </dl>
        <CheckoutButton unavailable={unavailable} />
        <p className="muted checkout-note">{unavailable ? "구매할 수 없는 상품의 수량을 조정하거나 삭제해 주세요." : "다음 단계에서 주문을 확인하고 모의 결제를 진행합니다."}</p>
      </form>
    </aside>
  );
}
