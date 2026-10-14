import { connectDB } from "@/lib/mongodb";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Product";

export async function getCartDetails(userId: string) {
  await connectDB();
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart) return [];

  const products = await Product.find({ _id: { $in: cart.items.map((item) => item.productId) } }).lean();
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  return cart.items.map((item) => {
    const product = productMap.get(String(item.productId));
    return {
      productId: String(item.productId),
      name: product?.name ?? "삭제된 상품",
      unitPrice: product?.price ?? 0,
      availableStock: product?.stock ?? 0,
      qty: item.qty,
      subtotal: (product?.price ?? 0) * item.qty,
      available: Boolean(product),
    };
  });
}
