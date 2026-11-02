import { connectDB } from "@/lib/mongodb";
import { collection, type ProductInfo } from "@/lib/catalog";
import { Product } from "@/models/Product";

export type ProductSummary = {
  id: string;
  name: string;
  price: number;
  stock: number;
} & Partial<ProductInfo>;

type StoredProduct = { _id: unknown; name: string; price: number; stock: number };

function toProductSummary(product: StoredProduct): ProductSummary {
  const id = String(product._id);
  const catalog = collection.find((item) => item.id === id);
  return { ...catalog, id, name: product.name, price: product.price, stock: product.stock };
}

export async function getProducts(): Promise<ProductSummary[]> {
  await connectDB();
  const documents = await Product.find().sort({ createdAt: -1, _id: -1 }).lean();
  const stored = new Map(documents.map((product) => [String(product._id), product]));
  const featured: ProductSummary[] = collection.map((item) => {
    const product = stored.get(item.id);
    stored.delete(item.id);
    return product ? toProductSummary(product) : item;
  });
  return [...featured, ...Array.from(stored.values(), toProductSummary)];
}

export async function getProduct(id: string): Promise<ProductSummary | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  const product = await Product.findById(id).lean();
  return product ? toProductSummary(product) : collection.find((item) => item.id === id.toLowerCase()) ?? null;
}

// Create the inventory record on first use. Never overwrite stock, price or order references.
export async function getProductForCart(id: string) {
  const item = collection.find((product) => product.id === id);
  if (item) {
    await Product.updateOne(
      { _id: item.id },
      { $setOnInsert: { name: item.name, price: item.price, stock: item.stock, createdAt: new Date() } },
      { upsert: true, timestamps: false },
    );
  }
  return Product.findById(id);
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
