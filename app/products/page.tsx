import { CatalogView, type CatalogParams } from "@/app/catalog-view";

export const metadata = { title: "전체 상품" };
export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<CatalogParams> }) {
  return <CatalogView pathname="/products" search={await searchParams} />;
}
