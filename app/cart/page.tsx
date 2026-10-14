import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createOrderAction, removeCartItemAction, updateCartItemAction } from "@/app/actions";
import { getAvailableCoupons } from "@/lib/coupons";
import { getCartDetails } from "@/lib/cart";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [{ message }, items, coupons] = await Promise.all([
    searchParams,
    getCartDetails(session.user.id),
    getAvailableCoupons(session.user.id),
  ]);
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="container">
      <span className="eyebrow">Your basket</span><h1>장바구니</h1>
      {message && <p className="notice success" role="status">{message}</p>}
      {items.length === 0 ? (
        <section className="panel"><p className="muted">장바구니가 비어 있습니다.</p><Link className="button" href="/products">상품 보러 가기</Link></section>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1.5fr) minmax(260px, .8fr)", alignItems: "start" }}>
          <section className="panel">
            {items.map((item) => (
              <div className="row" key={item.productId}>
                <div className="row-main"><strong>{item.name}</strong><span className="muted">{formatWon(item.unitPrice)} × {item.qty} = {formatWon(item.subtotal)}</span>{!item.available && <p className="notice">삭제된 상품입니다. 장바구니에서 제거해 주세요.</p>}</div>
                {item.available && <div className="actions" style={{ marginTop: 0 }}>
                  <form className="inline-form" action={updateCartItemAction}>
                    <input type="hidden" name="productId" value={item.productId} />
                    <input aria-label={`${item.name} 수량`} name="qty" type="number" min="1" max={item.availableStock} defaultValue={item.qty} required />
                    <button className="button secondary" type="submit">변경</button>
                  </form>
                  <form action={removeCartItemAction}><input type="hidden" name="productId" value={item.productId} /><button className="button danger" type="submit">삭제</button></form>
                </div>}
              </div>
            ))}
          </section>
          <aside className="panel">
            <h2>주문 요약</h2>
            <div className="row"><span>상품 금액</span><strong>{formatWon(total)}</strong></div>
            <p className="muted">쿠폰 할인과 최종 금액은 주문 시 서버에서 계산됩니다.</p>
            <form className="form-grid" action={createOrderAction}>
              <label>쿠폰
                <select name="couponId" defaultValue="">
                  <option value="">쿠폰 사용 안 함</option>
                  {coupons.map((coupon) => <option value={coupon.id} key={coupon.id}>{coupon.code} · {formatWon(coupon.discount)} 할인</option>)}
                </select>
              </label>
              <button className="button" type="submit">주문하기</button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
