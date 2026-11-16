import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { removeCartItemAction, updateCartItemAction } from "@/app/actions";
import { CheckoutSummary } from "@/app/checkout-summary";
import { ProductImage, StoreIcon } from "@/app/storefront";
import { getAvailableCoupons } from "@/lib/coupons";
import { getCartDetails } from "@/lib/cart";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";
const successMessages = ["장바구니에 담았습니다.", "수량을 변경했습니다.", "상품을 장바구니에서 삭제했습니다."];

export default async function CartPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?destination=cart");
  const [{ message }, items, coupons] = await Promise.all([
    searchParams,
    getCartDetails(session.user.id),
    getAvailableCoupons(session.user.id),
  ]);
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const success = typeof message === "string" && successMessages.includes(message);

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span aria-hidden="true">/</span><span>장바구니</span></nav>
      <div className="cart-heading"><h1>장바구니</h1><Link href="/products" className="text-link">쇼핑 계속하기 <span aria-hidden="true">→</span></Link></div>
      {typeof message === "string" && <p className={success ? "notice success" : "notice"} role={success ? "status" : "alert"}>{message}</p>}
      {items.length === 0 ? (
        <section className="panel empty-state"><StoreIcon name="bag" /><h2>장바구니가 비어 있습니다</h2><Link className="button" href="/products">상품 둘러보기</Link></section>
      ) : (
        <div className="cart-layout">
          <section className="panel cart-items" aria-label="담은 상품">
            {items.map((item) => (
              <article className="cart-item" key={item.productId}>
                <div className="product-media cart-media"><ProductImage product={item} sizes="100px" /></div>
                <div className="cart-item-copy">
                  {item.available ? <Link className="text-link" href={"/products/" + item.productId}>{item.name}</Link> : <strong>{item.name}</strong>}
                  <p className="muted">{item.available && formatWon(item.unitPrice) + " · "}{item.qty}개</p>
                  {item.qty > item.availableStock && <p className="item-warning">{item.availableStock ? "현재 최대 " + item.availableStock + "개 구매 가능" : item.available ? "품절" : "판매 종료"}</p>}
                  <div className="cart-item-controls">
                    {item.availableStock > 0 && <form className="inline-form" action={updateCartItemAction}>
                      <input type="hidden" name="productId" value={item.productId} />
                      <input aria-label={item.name + " 수량"} name="qty" type="number" min="1" max={item.availableStock} defaultValue={Math.min(item.qty, item.availableStock)} required />
                      <button className="button secondary" type="submit">변경</button>
                    </form>}
                    <form action={removeCartItemAction}><input type="hidden" name="productId" value={item.productId} /><button className="remove-button" type="submit" aria-label={item.name + " 삭제"}>삭제</button></form>
                  </div>
                </div>
                {item.available && <strong className="cart-item-price">{formatWon(item.subtotal)}</strong>}
              </article>
            ))}
          </section>
          <CheckoutSummary total={total} coupons={coupons} unavailable={items.some((item) => item.qty > item.availableStock)} />
        </div>
      )}
    </div>
  );
}
