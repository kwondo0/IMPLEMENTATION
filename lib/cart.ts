import mongoose, { type Types } from "mongoose";
import { CommerceError } from "@/lib/commerce-error";
import { connectDB } from "@/lib/mongodb";
import { findActiveProduct, productImageSource } from "@/lib/products";
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
    const activeProduct = product?.deletedAt ? undefined : product;
    return {
      productId: String(item.productId),
      name: product?.name ?? "삭제된 상품",
      unitPrice: activeProduct?.price ?? 0,
      availableStock: activeProduct?.stock ?? 0,
      qty: item.qty,
      subtotal: (activeProduct?.price ?? 0) * item.qty,
      available: Boolean(activeProduct),
      image: activeProduct && productImageSource(String(item.productId), activeProduct.imageVersion),
    };
  });
}

export async function addCartItem(userId: string, productId: Types.ObjectId, qty: number) {
  await Cart.updateOne({ userId }, { $setOnInsert: { items: [] } }, { upsert: true });
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId }).session(session);
      const product = await findActiveProduct(productId).session(session);
      if (!cart || !product) throw new CommerceError("장바구니에 상품을 담을 수 없습니다.");
      const existing = cart.items.find((item) => item.productId.equals(productId));
      const nextQty = (existing?.qty ?? 0) + qty;
      if (nextQty > product.stock) throw new CommerceError("요청한 수량이 현재 재고보다 많습니다.");
      if (existing) existing.qty = nextQty;
      else cart.items.push({ productId, qty });
      await cart.save({ session });
    });
  } finally {
    await session.endSession();
  }
}
