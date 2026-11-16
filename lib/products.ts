import { connectDB } from "@/lib/mongodb";
import { collection, type ProductInfo } from "@/lib/catalog";
import { Product } from "@/models/Product";
import type { Types } from "mongoose";

export type ProductSummary = {
  id: string;
  name: string;
  price: number;
  stock: number;
} & Partial<ProductInfo>;

type StoredProduct = { _id: unknown; name: string; price: number; stock: number; deletedAt?: Date; imageVersion?: string };

const featuredIds = collection.map((item) => item.id);

export function productImageSource(id: string, version?: string) {
  if (version) return "/media/products/" + id + "/" + version;
  return collection.find((item) => item.id === id)?.image;
}

function toProductSummary(product: StoredProduct): ProductSummary {
  const id = String(product._id);
  const catalog = collection.find((item) => item.id === id);
  return {
    ...catalog, id, name: product.name, price: product.price, stock: product.stock,
    image: productImageSource(id, product.imageVersion),
  };
}

export async function getProducts(): Promise<ProductSummary[]> {
  await connectDB();
  const documents = await Product.find().sort({ createdAt: -1, _id: -1 }).lean();
  const stored = new Map(documents.map((product) => [String(product._id), product]));
  const featured = summarizeCollection(stored);
  const otherProducts = documents.filter((product) => !product.deletedAt && !featuredIds.includes(String(product._id)));
  return [...featured, ...otherProducts.map(toProductSummary)];
}

function summarizeCollection(stored: Map<string, StoredProduct>): ProductSummary[] {
  return collection.flatMap((item): ProductSummary[] => {
    const product = stored.get(item.id);
    if (product?.deletedAt) return [];
    return [product ? toProductSummary(product) : item];
  });
}

export async function getFeaturedProducts(): Promise<ProductSummary[]> {
  await connectDB();
  const documents = await Product.find({ _id: { $in: featuredIds } }).lean();
  return summarizeCollection(new Map(documents.map((product) => [String(product._id), product])));
}

export async function getProduct(id: string): Promise<ProductSummary | null> {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectDB();
  const product = await Product.findById(id).lean();
  if (product?.deletedAt) return null;
  return product ? toProductSummary(product) : collection.find((item) => item.id === id.toLowerCase()) ?? null;
}

// Create the inventory record on first use. Never overwrite stock, price or order references.
async function ensureCatalogProduct(id: string) {
  const item = collection.find((product) => product.id === id);
  if (item) {
    await Product.updateOne(
      { _id: item.id },
      { $setOnInsert: { name: item.name, price: item.price, stock: item.stock, createdAt: new Date() } },
      { upsert: true, timestamps: false },
    );
  }
}

export function findActiveProduct(id: string | Types.ObjectId) {
  return Product.findOne({ _id: id, deletedAt: null });
}

export async function getProductForCart(id: string) {
  await ensureCatalogProduct(id);
  return findActiveProduct(id);
}

export async function deleteProduct(id: string) {
  await connectDB();
  await ensureCatalogProduct(id);
  const result = await Product.updateOne({ _id: id, deletedAt: null }, { $set: { deletedAt: new Date() } });
  return result.modifiedCount === 1;
}

export async function updateProductImage(id: string, image: { imageBytes: Buffer; imageVersion: string }) {
  await connectDB();
  await ensureCatalogProduct(id);
  const result = await Product.updateOne({ _id: id, deletedAt: null }, { $set: image });
  return result.matchedCount === 1;
}

export async function decreaseStockBad(productId: string, qty: number) {
  const product = await findActiveProduct(productId);
  if (!product || product.stock < qty) return false;
  product.stock -= qty;
  await product.save();
  return true;
}

export async function decreaseStock(productId: string, qty: number, session?: import("mongoose").ClientSession) {
  const result = await Product.findOneAndUpdate(
    { _id: productId, deletedAt: null, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true, session },
  );
  return result !== null;
}
