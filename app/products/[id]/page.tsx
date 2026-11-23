import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { addToCartAction } from "@/app/actions";
import { ProductImage, StoreIcon } from "@/app/storefront";
import { categoryLabel } from "@/lib/catalog";
import { getProduct } from "@/lib/products";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, session] = await Promise.all([getProduct(id), auth()]);
  if (!product) notFound();

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span aria-hidden="true">/</span><Link href="/products">전체 상품</Link>{product.category && <><span aria-hidden="true">/</span><Link href={"/category/" + product.category}>{categoryLabel(product.category)}</Link></>}</nav>
      <section className="product-detail">
        <div className="product-media detail-media"><ProductImage product={product} sizes="(max-width: 740px) 100vw, 52vw" /></div>
        <div className="detail-copy">
          <p className="product-category">{categoryLabel(product.category)}</p>
          <h1>{product.name}</h1>
          {product.subtitle && <p className="product-subtitle">{product.subtitle}</p>}
          <p className="detail-price">{formatWon(product.price)}</p>
          {product.description && <p className="lead">{product.description}</p>}
          <div className="buy-area">
            <p className="stock-label"><span className={product.stock ? "available" : ""} />{product.stock > 0 ? "구매 가능" : "품절"}</p>
            {product.stock > 0 && (session?.user ? (
              <form className="buy-form" action={addToCartAction}>
                <input type="hidden" name="productId" value={product.id} />
                <label>수량<input name="qty" type="number" min="1" max={product.stock} defaultValue="1" required /></label>
                <button className="button" type="submit"><StoreIcon name="bag" />장바구니 담기</button>
              </form>
            ) : (
              <Link className="button" href={"/login?product=" + product.id}><StoreIcon name="bag" />로그인하고 장바구니 담기</Link>
            ))}
          </div>
          {product.specs && <section className="product-specs"><h2>상품 사양</h2><dl>{product.specs.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></section>}
        </div>
      </section>
    </div>
  );
}
