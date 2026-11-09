import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/app/storefront";
import { categories, type Category } from "@/lib/catalog";
import { getFeaturedProducts } from "@/lib/products";

const categoryImages: Record<Category, string> = {
  desk: "/store/keyboard.webp",
  living: "/store/mug.webp",
  stationery: "/store/notebook.webp",
};

export default async function HomePage() {
  const products = await getFeaturedProducts();
  return (
    <div className="container home">
      <section className="store-hero" aria-labelledby="collection-title">
        <div className="store-hero-copy">
          <h1 id="collection-title">일하는 자리,<br />머무는 공간.</h1>
          <p>매일 쓰는 키보드부터 저녁을 밝히는 조명까지.<br /> 일상에 오래 두고 싶은 물건을 모았습니다.</p>
          <div className="hero-actions">
            <Link className="button hero-primary" href="/category/desk">데스크 컬렉션 보기 <span aria-hidden="true">↗</span></Link>
            <Link className="button hero-secondary" href="/products">전체 상품</Link>
          </div>
        </div>
        <div className="hero-media">
          <Image src="/store/hero.webp" alt="월넛 책상 위 크롬 조명과 키보드, 세라믹 머그" fill preload sizes="(max-width: 680px) 100vw, (max-width: 1300px) 95vw, 1240px" />
        </div>
      </section>

      <section className="home-products" aria-labelledby="featured-title">
        <div className="section-head">
          <h2 id="featured-title">추천 상품</h2>
          <Link className="section-link" href="/products">전체 보기 <span aria-hidden="true">→</span></Link>
        </div>
        <ProductGrid products={products} />
      </section>

      <section className="home-collections" aria-labelledby="collections-title">
        <div className="section-head"><h2 id="collections-title">카테고리별로 둘러보기</h2></div>
        <div className="collection-grid">
          {categories.map((category) => (
            <Link className={"collection-tile collection-" + category.id} href={"/category/" + category.id} key={category.id}>
              <span className="collection-copy"><strong>{category.label}</strong><span>{category.description}</span></span>
              <span className="collection-arrow" aria-hidden="true">↗</span>
              <span className="collection-photo"><Image src={categoryImages[category.id]} alt="" fill sizes="(max-width: 680px) 145px, 33vw" /></span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
