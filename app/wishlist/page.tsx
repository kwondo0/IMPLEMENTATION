import Link from "next/link";

export default function WishlistPage() {
  const items = [
    { name: "가을 코트", price: "189,000원", tag: "인기" },
    { name: "무선 청소기", price: "299,000원", tag: "추천" },
    { name: "스킨케어 세트", price: "49,000원", tag: "신상" },
  ];

  return (
    <div className="container page-shell">
      <span className="eyebrow">Wishlist</span>
      <h1>좋아요</h1>
      <div className="page-grid">
        {items.map((item) => (
          <div className="card product-card" key={item.name}>
            <span className="pill">{item.tag}</span>
            <h2>{item.name}</h2>
            <p className="muted">내가 찜한 아이템을 한 번에 확인하세요.</p>
            <span className="price">{item.price}</span>
            <div className="actions compact-actions">
              <Link className="button" href="/products">상품 보기</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
