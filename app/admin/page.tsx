import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { changeOrderStatusAction, createCouponAction, createProductAction } from "@/app/actions";
import { getProducts } from "@/lib/products";
import { getRecentOrdersForAdmin } from "@/lib/orders";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusNames: Record<string, string> = {
  PENDING: "결제 대기", PAID: "결제 완료", SHIPPING: "배송 중", DELIVERED: "배송 완료", CANCELLED: "취소",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/");
  const [{ message }, products, orders] = await Promise.all([
    searchParams,
    getProducts(),
    getRecentOrdersForAdmin(),
  ]);

  return (
    <div className="container">
      <span className="eyebrow">Management</span><h1>관리자</h1>
      <p className="lead">상품·쿠폰을 관리하고 주문의 허용된 배송 상태를 변경합니다.</p>
      {message && <p className="notice success" role="status">{message}</p>}
      <div className="grid" style={{ alignItems: "start", marginTop: 24 }}>
        <section className="panel">
          <h2>상품 등록</h2>
          <form className="form-grid" action={createProductAction}>
            <label>상품명<input name="name" maxLength={120} required /></label>
            <label>가격 (원)<input name="price" type="number" min="0" step="1" required /></label>
            <label>재고<input name="stock" type="number" min="0" step="1" required /></label>
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
          <table><thead><tr><th>상품명</th><th>가격</th><th>재고</th></tr></thead><tbody>
            {products.map((product) => <tr key={product.id}><td>{product.name}</td><td>{formatWon(product.price)}</td><td>{product.stock}</td></tr>)}
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
