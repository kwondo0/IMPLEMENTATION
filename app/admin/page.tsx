import { requireAdmin } from "@/lib/authz";
import { changeOrderStatusAction, createCouponAction, createProductAction, deleteProductAction, updateProductImageAction } from "@/app/actions";
import { ProductImageInput } from "@/app/admin/product-image-input";
import { ProductImage } from "@/app/storefront";
import { maxProductImageBytes } from "@/lib/product-image";
import { getProducts } from "@/lib/products";
import { getRecentOrdersForAdmin } from "@/lib/orders";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusNames: Record<string, string> = {
  PENDING: "결제 대기", PAID: "결제 완료", SHIPPING: "배송 중", DELIVERED: "배송 완료", CANCELLED: "취소",
};
const successMessages = new Set(["상품을 등록했습니다.", "상품을 삭제했습니다.", "상품 이미지를 수정했습니다.", "쿠폰을 발급했습니다.", "주문 상태를 변경했습니다."]);

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  await requireAdmin();
  const [{ message }, products, orders] = await Promise.all([
    searchParams,
    getProducts(),
    getRecentOrdersForAdmin(),
  ]);
  const success = typeof message === "string" && successMessages.has(message);

  return (
    <div className="container">
      <span className="eyebrow">Management</span><h1>관리자</h1>
      <p className="lead">상품·쿠폰을 관리하고 주문의 허용된 배송 상태를 변경합니다.</p>
      {typeof message === "string" && <p className={success ? "notice success" : "notice"} role={success ? "status" : "alert"}>{message}</p>}
      <div className="grid" style={{ alignItems: "start", marginTop: 24 }}>
        <section className="panel">
          <h2>상품 등록</h2>
          <form className="form-grid" action={createProductAction}>
            <label>상품명<input name="name" maxLength={120} required /></label>
            <label>가격 (원)<input name="price" type="number" min="0" step="1" required /></label>
            <label>재고<input name="stock" type="number" min="0" step="1" required /></label>
            <ProductImageInput maxBytes={maxProductImageBytes} />
            <button className="button" type="submit">상품 등록</button>
          </form>
        </section>
        <section className="panel">
          <h2>정액 쿠폰 발급</h2>
          <form className="form-grid" action={createCouponAction}>
            <label>회원 이메일<input name="email" type="email" required /></label>
            <label>쿠폰 코드<input name="code" minLength={3} maxLength={32} pattern="[A-Za-z0-9-]+" required /></label>
            <label>할인 금액 (원)<input name="discount" type="number" min="1" step="1" required /></label>
            <button className="button" type="submit">쿠폰 발급</button>
          </form>
        </section>
      </div>

      <div className="section-head"><div><span className="eyebrow">Inventory</span><h2 style={{ marginTop: 7 }}>등록 상품</h2></div></div>
      <section className="panel table-wrap">
        {products.length === 0 ? <p className="muted">등록된 상품이 없습니다.</p> : (
          <table><thead><tr><th>상품</th><th>가격</th><th>재고</th><th>관리</th></tr></thead><tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="inventory-product">
                    {product.image && <div className="product-media inventory-thumb"><ProductImage product={product} sizes="48px" decorative /></div>}
                    <strong>{product.name}</strong>
                  </div>
                </td>
                <td>{formatWon(product.price)}</td>
                <td>{product.stock}</td>
                <td>
                  <details className="inventory-action" name="inventory-action">
                    <summary className="button secondary" aria-label={product.name + (product.image ? " 이미지 수정" : " 이미지 추가")}>{product.image ? "이미지 수정" : "이미지 추가"}</summary>
                    <form className="form-grid" action={updateProductImageAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <ProductImageInput maxBytes={maxProductImageBytes} required />
                      <button className="button" type="submit">이미지 저장</button>
                    </form>
                  </details>
                  <details className="inventory-action" name="inventory-action">
                    <summary className="button secondary" aria-label={product.name + " 삭제"}>삭제</summary>
                    <form className="form-grid" action={deleteProductAction}>
                      <input type="hidden" name="productId" value={product.id} />
                      <p>매장에서 상품을 내립니다. 기존 주문 내역은 보존됩니다.</p>
                      <button className="button danger" type="submit">삭제 확인</button>
                    </form>
                  </details>
                </td>
              </tr>
            ))}
          </tbody></table>
        )}
      </section>

      <div className="section-head"><div><span className="eyebrow">Orders</span><h2 style={{ marginTop: 7 }}>최근 주문</h2></div></div>
      <section className="panel table-wrap">
        {orders.length === 0 ? <p className="muted">주문 내역이 없습니다.</p> : (
          <table><thead><tr><th>주문</th><th>회원</th><th>금액</th><th>현재 상태</th><th>상태 변경</th></tr></thead><tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id.slice(-8).toUpperCase()}</td><td>{order.customer}</td><td>{formatWon(order.totalAmount)}</td><td>{statusNames[order.status] ?? order.status}</td>
                <td>
                  {(order.status === "PAID" || order.status === "SHIPPING") ? (
                    <form className="inline-form" action={changeOrderStatusAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="from" value={order.status} />
                      <input type="hidden" name="to" value={order.status === "PAID" ? "SHIPPING" : "DELIVERED"} />
                      <button className="button secondary" type="submit">{order.status === "PAID" ? "배송 시작" : "배송 완료"}</button>
                    </form>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody></table>
        )}
      </section>
    </div>
  );
}
