import { notFound } from "next/navigation";
import { addToCartAction } from "@/app/actions";
import { getProduct } from "@/lib/products";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="container">
      <section className="panel" style={{ maxWidth: 720 }}>
        <span className="pill">{product.stock > 0 ? `재고 ${product.stock}개` : "품절"}</span>
        <h1 style={{ marginTop: 18 }}>{product.name}</h1>
        <p className="lead">결제 금액은 상품 화면의 값을 신뢰하지 않고 서버에서 다시 계산합니다.</p>
        <p className="price">{formatWon(product.price)}</p>
        {product.stock > 0 ? (
          <form className="actions" action={addToCartAction}>
            <input type="hidden" name="productId" value={product.id} />
            <label style={{ width: 110 }}>수량<input name="qty" type="number" min="1" max={product.stock} defaultValue="1" required /></label>
            <button className="button" type="submit">장바구니 담기</button>
          </form>
        ) : <p className="muted">현재 품절된 상품입니다.</p>}
      </section>
    </div>
  );
}
