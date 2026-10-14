import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function MyPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container page-shell">
      <span className="eyebrow">My page</span>
      <h1>{session.user.name ?? "회원"}님</h1>
      <div className="page-grid two-col">
        <div className="panel">
          <h2>회원 정보</h2>
          <p className="muted">이메일: {session.user.email}</p>
          <p className="muted">등급: {session.user.role === "admin" ? "관리자" : "일반 회원"}</p>
        </div>
        <div className="panel stack-card">
          <h2>바로가기</h2>
          <Link className="button secondary" href="/orders">주문 내역</Link>
          <Link className="button secondary" href="/cart">장바구니</Link>
          <Link className="button secondary" href="/wishlist">좋아요 목록</Link>
        </div>
      </div>
    </div>
  );
}
