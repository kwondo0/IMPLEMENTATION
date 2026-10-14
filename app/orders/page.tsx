import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOrders } from "@/lib/orders";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusNames: Record<string, string> = {
  PENDING: "결제 대기", PAID: "결제 완료", SHIPPING: "배송 중", DELIVERED: "배송 완료", CANCELLED: "취소",
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [{ message }, orders] = await Promise.all([searchParams, getOrders(session.user.id)]);

  return (
    <div className="container">
      <span className="eyebrow">Order history</span><h1>내 주문</h1>
      {message && <p className="notice success" role="status">{message}</p>}
      {orders.length === 0 ? <section className="panel"><p className="muted">아직 주문 내역이 없습니다.</p><Link className="button" href="/products">상품 둘러보기</Link></section> : (
        <section className="panel">
          {orders.map((order) => (
            <Link className="row" href={`/orders/${order.id}`} key={order.id}>
              <div className="row-main"><strong>주문 {order.id.slice(-8).toUpperCase()}</strong><span className="muted">{new Date(order.createdAt).toLocaleString("ko-KR")} · {order.items.length}개 품목</span></div>
              <div><span className="pill">{statusNames[order.status] ?? order.status}</span><strong style={{ display: "block", marginTop: 8 }}>{formatWon(order.totalAmount)}</strong></div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
