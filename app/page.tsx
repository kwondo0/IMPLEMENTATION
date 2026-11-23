import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/app/storefront";
import { categories, collection } from "@/lib/catalog";
import { getProducts } from "@/lib/products";

export default async function HomePage() {
  const products = (await getProducts()).slice(0, collection.length);
  return (
    <div className="container home">
      <section className="store-hero" aria-labelledby="collection-title">
        <div className="store-hero-copy">
          <p className="hero-kicker">THE DESK EDIT</p>
          <h1 id="collection-title">일하는 자리,<br />머무는 공간.</h1>
          <p>아침을 여는 머그부터 저녁을 밝히는 조명까지.<br className="desktop-break" /> 곁에 오래 두고 싶은 물건을 모았습니다.</p>
          <Link className="hero-cta" href="/category/desk">데스크 컬렉션 보기 <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="hero-media">
          <Image src="/store/hero.webp" alt="월넛 책상 위 크롬 조명과 키보드, 세라믹 머그" fill preload sizes="(max-width: 740px) 100vw, 58vw" />
        </div>
      </section>
      <nav className="collection-nav" aria-label="컬렉션 둘러보기">
        {categories.map((category) => (
          <Link href={"/category/" + category.id} key={category.id}>
            <span><strong>{category.label}</strong><small>{category.description}</small></span>
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>
      <section className="home-products" aria-labelledby="featured-title">
        <div className="section-head">
          <h2 id="featured-title">추천 상품</h2>
          <Link className="text-link" href="/products">전체 상품 <span aria-hidden="true">→</span></Link>
        </div>
        <ProductGrid products={products} />
      </section>
    </div>
  );
}
