import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";

export type ProductSummary = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

function toProductSummary(product: { _id: unknown; name: string; price: number; stock: number }): ProductSummary {
  return { id: String(product._id), name: product.name, price: product.price, stock: product.stock };
}

export async function getProducts() {
  await connectDB();
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return products.map(toProductSummary);
}

export async function getProduct(id: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  const product = await Product.findById(id).lean();
  return product ? toProductSummary(product) : null;
}

export async function decreaseStockBad(productId: string, qty: number) {
  const product = await Product.findById(productId);
  if (!product || product.stock < qty) return false;
  product.stock -= qty;
  await product.save();
  return true;
}

export async function decreaseStock(productId: string, qty: number, session?: import("mongoose").ClientSession) {
  const result = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true, session },
  );
  return result !== null;
}
