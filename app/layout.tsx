import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { categories } from "@/lib/catalog";
import { StoreIcon } from "@/app/storefront";
import { SearchDialog } from "@/app/search-dialog";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SecureCommerce | 데스크와 일상을 위한 셀렉트숍", template: "%s | SecureCommerce" },
  description: "키보드, 조명, 생활용품과 문구까지. 데스크와 일상을 위한 물건을 모았습니다.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main">본문 바로가기</a>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/"><i className="brand-mark" aria-hidden="true" />Secure<span>Commerce</span></Link>
            <nav className="nav store-nav" aria-label="상품 카테고리">
              <Link href="/products">전체 상품</Link>
              {categories.map((category) => <Link href={"/category/" + category.id} key={category.id}>{category.label}</Link>)}
            </nav>
            <nav className="nav header-tools" aria-label="쇼핑 메뉴">
              <SearchDialog />
              <Link href={session?.user ? "/mypage" : "/login"} aria-label={session?.user ? "마이페이지" : "로그인"} title={session?.user ? "마이페이지" : "로그인"}><StoreIcon name="user" /></Link>
              <Link href="/cart" aria-label="장바구니" title="장바구니"><StoreIcon name="bag" /></Link>
            </nav>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="footer">
          <div className="footer-inner">
            <div><Link className="brand" href="/"><i className="brand-mark" aria-hidden="true" />Secure<span>Commerce</span></Link><p>데스크와 일상을 위한 셀렉트숍</p></div>
            <nav aria-label="하단 메뉴"><Link href="/products">전체 상품</Link><Link href="/orders">주문 내역</Link><Link href="/cart">장바구니</Link></nav>
            <p className="footer-disclosure">멋사CP 팀 프로젝트 · 결제와 배송은 시뮬레이션입니다.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
