import Link from "next/link";
import Form from "next/form";
import { ProductGrid, StoreIcon } from "@/app/storefront";
import { categories, type Category } from "@/lib/catalog";
import { getProducts } from "@/lib/products";

export type CatalogParams = { q?: string | string[]; sort?: string | string[] };

export async function CatalogView({ category, pathname, search }: {
  category?: Category;
  pathname: string;
  search: CatalogParams;
}) {
  const current = categories.find((item) => item.id === category);
  const query = typeof search.q === "string" ? search.q.trim().slice(0, 80) : "";
  const sort = search.sort === "price-low" || search.sort === "price-high" ? search.sort : "";
  const terms = query.toLocaleLowerCase("ko-KR").split(/\s+/);
  const products = (await getProducts()).filter((item) => {
    if (category && item.category !== category) return false;
    const text = [item.name, item.subtitle, item.description].join(" ").toLocaleLowerCase("ko-KR");
    return terms.every((term) => text.includes(term));
  });
  if (sort) products.sort((a, b) => sort === "price-low" ? a.price - b.price : b.price - a.price);

  const tabs = [{ id: "", label: "전체 상품" }, ...categories];
  const filters = new URLSearchParams();
  if (query) filters.set("q", query);
  if (sort) filters.set("sort", sort);
  const suffix = filters.size ? "?" + filters.toString() : "";

  return (
    <div className="container catalog">
      <nav className="breadcrumb" aria-label="현재 위치"><Link href="/">홈</Link><span aria-hidden="true">/</span><span>{current?.label ?? "전체 상품"}</span></nav>
      <header className="catalog-head"><h1>{current?.label ?? "전체 상품"}</h1>{current && <p className="muted">{current.description}</p>}</header>
      <nav className="catalog-tabs" aria-label="카테고리 필터">
        {tabs.map((tab) => (
          <Link key={tab.id} href={(tab.id ? "/category/" + tab.id : "/products") + suffix} aria-current={tab.id === (category ?? "") ? "page" : undefined}>{tab.label}</Link>
        ))}
      </nav>
      <Form className="catalog-tools" action={pathname} id="shop-search" key={query + "\u0000" + sort}>
        <label><span>상품 검색</span><input type="search" name="q" defaultValue={query} maxLength={80} placeholder="상품명 또는 특징" /></label>
        <label><span>정렬</span><select name="sort" defaultValue={sort}><option value="">추천순</option><option value="price-low">낮은 가격순</option><option value="price-high">높은 가격순</option></select></label>
        <button className="button" type="submit"><StoreIcon name="search" />검색</button>
      </Form>
      <div className="catalog-results">
        <p className="result-count" role="status">{query && <strong>‘{query}’ 검색 결과 · </strong>}{products.length}개 상품</p>
        {(query || sort) && <Link className="section-link" href={pathname}>초기화 <span aria-hidden="true">↺</span></Link>}
      </div>
      {products.length > 0 ? <ProductGrid products={products} heading="h2" /> : (
        <section className="panel empty-state">
          <StoreIcon name="search" /><h2>조건에 맞는 상품이 없습니다</h2><p className="muted">검색어를 바꾸거나 전체 상품을 둘러보세요.</p>
          <Link className="button secondary" href="/products">전체 상품 보기</Link>
        </section>
      )}
    </div>
  );
}
