import Link from "next/link";
import { getProducts } from "@/lib/products";

const categoryMap: Record<string, { title: string; description: string }> = {
  "fall-fashion": { title: "가을 패션", description: "가볍고 편안한 가을 분위기의 패션 아이템을 추천합니다." },
  deals: { title: "쇼핑특가", description: "한정 특가 상품을 빠르게 만나보세요." },
  beauty: { title: "뷰티", description: "건강한 스킨케어와 메이크업 제품을 만나보세요." },
  electronics: { title: "가전", description: "생활을 더 편하게 만드는 스마트 가전 제품." },
  food: { title: "식품", description: "신선하고 맛있는 상품을 지금 바로 만나보세요." },
  home: { title: "홈", description: "집안 분위기를 바꾸는 생활 필수 아이템." },
  best: { title: "베스트", description: "고객들이 가장 많이 선택한 인기 상품." },
};

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categoryMap[slug] ?? { title: "카테고리", description: "다양한 상품을 둘러보세요." };
  const products = await getProducts();

  return (
    <div className="container page-shell">
      <span className="eyebrow">Category</span>
      <h1>{category.title}</h1>
      <p className="lead">{category.description}</p>
      <div className="page-grid">
        {products.length === 0 ? (
          <div className="panel muted">아직 등록된 상품이 없습니다.</div>
        ) : (
          products.slice(0, 6).map((product) => (
            <Link className="card product-card" href={`/products/${product.id}`} key={product.id}>
              <span className="pill">{product.stock > 0 ? `재고 ${product.stock}개` : "품절"}</span>
              <h2>{product.name}</h2>
              <p className="muted">{category.title} 추천 상품입니다.</p>
              <span className="price">{product.price.toLocaleString("ko-KR")}원</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
