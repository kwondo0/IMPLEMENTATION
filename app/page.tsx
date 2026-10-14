import Link from "next/link";
import { getProducts } from "@/lib/products";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Secure by design</span>
          <h1>안심할 수 있는<br />온라인 쇼핑의 기본</h1>
          <p className="lead">안전한 결제, 재고 관리, 쿠폰 적용까지 한 번에 준비된 쇼핑 경험을 제공합니다.</p>
          <div className="actions"><Link className="button" href="/products">상품 둘러보기</Link></div>
        </div>
        <aside className="hero-note">
          <div><span className="pill">안전한 주문</span><h2 style={{ marginTop: 18 }}>가격과 권한을<br />서버에서 다시 확인합니다.</h2></div>
          <p className="muted">재고 관리 · 쿠폰 적용 · 주문 처리</p>
        </aside>
      </section>
      <div className="section-head"><div><span className="eyebrow">Featured</span><h2 style={{ marginTop: 7 }}>추천 상품</h2></div><Link className="button secondary" href="/products">전체 상품</Link></div>
      {products.length === 0 ? <div className="panel muted">아직 등록된 상품이 없습니다. 관리자가 상품을 등록하면 이곳에 표시됩니다.</div> : (
        <div className="grid">{products.slice(0, 4).map((product) => (
          <Link className="card product-card" href={`/products/${product.id}`} key={product.id}>
            <span className="pill">{product.stock > 0 ? `재고 ${product.stock}개` : "품절"}</span>
            <h2>{product.name}</h2><p className="muted">가볍게 둘러보고 바로 쇼핑해보세요.</p>
            <span className="price">{product.price.toLocaleString("ko-KR")}원</span>
          </Link>
        ))}</div>
      )}
    </div>
  );
}
