import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logoutAction } from "@/app/actions";

export default async function MyPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <div className="container">
      <h1>마이페이지</h1>
      <div className="account-grid">
        <section className="panel"><h2>{session.user.name ?? "회원"}님</h2><p className="muted">{session.user.email}</p><form className="actions" action={logoutAction}><button className="button secondary" type="submit">로그아웃</button></form></section>
        <nav className="panel account-links" aria-label="계정 메뉴">
          <Link href="/orders">주문 내역 <span aria-hidden="true">→</span></Link>
          <Link href="/cart">장바구니 <span aria-hidden="true">→</span></Link>
          {session.user.role === "admin" && <Link href="/admin">관리자 <span aria-hidden="true">→</span></Link>}
        </nav>
      </div>
    </div>
  );
}
