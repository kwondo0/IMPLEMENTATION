import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/app/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureCommerce",
  description: "안전한 주문과 재고 관리를 위한 학습용 커머스",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/">SecureCommerce</Link>
            <nav className="nav" aria-label="주 메뉴">
              <Link href="/products">상품</Link>
              {session?.user ? (
                <>
                  <Link href="/cart">장바구니</Link>
                  <Link href="/orders">주문</Link>
                  {session.user.role === "admin" && <Link href="/admin">관리자</Link>}
                  <span>{session.user.name ?? session.user.email}</span>
                  <form action={logoutAction}>
                    <button type="submit">로그아웃</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login">로그인</Link>
                  <Link href="/register">회원가입</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="container" style={{ paddingTop: 0, paddingBottom: 0 }}>
            SecureCommerce · 수업 프로젝트용 데모 결제
          </div>
        </footer>
      </body>
    </html>
  );
}
