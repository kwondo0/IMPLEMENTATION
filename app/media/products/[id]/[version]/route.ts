import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; version: string }> }) {
  const { id, version } = await params;
  const productId = /^[a-f\d]{24}$/i;
  const imageVersion = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
  if (!productId.test(id) || !imageVersion.test(version)) return new Response(null, { status: 404 });

  await connectDB();
  const product = await Product.findOne({ _id: id, imageVersion: version, deletedAt: null }).select("+imageBytes");
  if (!product?.imageBytes?.length) return new Response(null, { status: 404 });

  return new Response(Uint8Array.from(product.imageBytes), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
