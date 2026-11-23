import { notFound, redirect } from "next/navigation";
import { CatalogView, type CatalogParams } from "@/app/catalog-view";
import { categories } from "@/lib/catalog";

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogParams>;
}) {
  const { slug } = await params;
  const category = categories.find((item) => item.id === slug);
  if (category) return <CatalogView category={category.id} pathname={"/category/" + slug} search={await searchParams} />;
  if (slug === "electronics") redirect("/category/desk");
  if (slug === "home") redirect("/category/living");
  if (["fall-fashion", "deals", "beauty", "food", "best"].includes(slug)) redirect("/products");
  notFound();
}
