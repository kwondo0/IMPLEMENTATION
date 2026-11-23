import Image from "next/image";
import Link from "next/link";
import { categoryLabel } from "@/lib/catalog";
import { formatWon } from "@/lib/format";
import type { ProductSummary } from "@/lib/products";

export function StoreIcon({ name }: { name: "bag" | "user" | "search" | "box" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      {name === "bag" && <><path d="M4 8h16l1 13H3L4 8Z" /><path d="M8 9V7a4 4 0 0 1 8 0v2" /></>}
      {name === "user" && <><circle cx="12" cy="7.5" r="3.5" /><path d="M4.5 21v-2a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5v2" /></>}
      {name === "search" && <><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 4.5 4.5" /></>}
      {name === "box" && <><path d="M3 7l9-4 9 4v10l-9 4-9-4V7Z" /><path d="m3 7 9 4 9-4m-9 4v10" /></>}
    </svg>
  );
}

export function ProductImage({ product, sizes, decorative = false }: { product: Pick<ProductSummary, "image" | "name">; sizes: string; decorative?: boolean }) {
  return product.image
    ? <Image src={product.image} alt={decorative ? "" : product.name} fill sizes={sizes} />
    : <div className="product-placeholder"><StoreIcon name="box" /><span>이미지 준비 중</span></div>;
}

export function ProductGrid({ products, heading: Heading = "h3" }: { products: ProductSummary[]; heading?: "h2" | "h3" }) {
  return (
    <ul className="product-grid">
      {products.map((product) => (
        <li key={product.id}>
          <Link className="store-product" href={"/products/" + product.id}>
            <div className="product-media">
              <ProductImage product={product} sizes="(max-width: 680px) 48vw, (max-width: 1020px) 33vw, 295px" decorative />
              {product.stock === 0 && <span className="stock-overlay">품절</span>}
            </div>
            <div className="product-copy">
              <p className="product-category">{categoryLabel(product.category)}</p>
              <Heading>{product.name}</Heading>
              {product.subtitle && <p className="product-subtitle">{product.subtitle}</p>}
              <strong>{formatWon(product.price)}</strong>
              <span className="product-arrow" aria-hidden="true">↗</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
