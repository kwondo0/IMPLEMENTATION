import Link from "next/link";
import { getProducts } from "@/lib/products";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <div className="container">
      <span className="eyebrow">Catalog</span><h1>상품</h1>
      <p className="lead">상품 가격과 재고는 서버 데이터베이스 기준으로 확인합니다.</p>
      {products.length === 0 ? <div className="panel muted">등록된 상품이 없습니다.</div> : (
        <div className="grid" style={{ marginTop: 24 }}>
          {products.map((product) => (
            <Link className="card product-card" href={`/products/${product.id}`} key={product.id}>
              <span className="pill">{product.stock > 0 ? `재고 ${product.stock}개` : "품절"}</span>
              <h2>{product.name}</h2><p className="muted">상품 상세와 구매 옵션을 확인하세요.</p>
              <span className="price">{formatWon(product.price)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
