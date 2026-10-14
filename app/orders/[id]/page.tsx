import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { cancelOrderAction, payOrderAction } from "@/app/actions";
import { getOrder } from "@/lib/orders";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusNames: Record<string, string> = {
  PENDING: "결제 대기", PAID: "결제 완료", SHIPPING: "배송 중", DELIVERED: "배송 완료", CANCELLED: "취소",
};

export default async function OrderDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const [{ id }, { message }] = await Promise.all([params, searchParams]);
  const order = await getOrder(id, session.user.id);
  if (!order) notFound();

  return (
    <div className="container">
      <span className="eyebrow">Order detail</span><h1>주문 상세</h1>
      {message && <p className="notice success" role="status">{message}</p>}
      <section className="panel">
        <div className="row"><div><strong>주문 번호</strong><p className="muted">{order.id}</p></div><span className="pill">{statusNames[order.status] ?? order.status}</span></div>
        <p className="muted">주문 일시: {new Date(order.createdAt).toLocaleString("ko-KR")}</p>
        {order.items.map((item, index) => <div className="row" key={`${item.name}-${index}`}><span>{item.name} × {item.qty}</span><strong>{formatWon(item.subtotal)}</strong></div>)}
        <div className="row"><strong>최종 결제 금액</strong><strong className="price">{formatWon(order.totalAmount)}</strong></div>
        <p className="muted">이 화면의 결제는 실제 결제가 아닌 상태 전환 테스트입니다.</p>
        <div className="actions">
          {order.status === "PENDING" && <form action={payOrderAction}><input type="hidden" name="orderId" value={order.id} /><button className="button" type="submit">가짜 결제하기</button></form>}
          {(order.status === "PENDING" || order.status === "PAID") && <form action={cancelOrderAction}><input type="hidden" name="orderId" value={order.id} /><button className="button danger" type="submit">주문 취소</button></form>}
        </div>
      </section>
    </div>
  );
}
