import mongoose from "mongoose";

type MongoCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongo = globalThis as typeof globalThis & { mongooseCache?: MongoCache };
const cache = globalWithMongo.mongooseCache ?? { connection: null, promise: null };
globalWithMongo.mongooseCache = cache;

export async function connectDB() {
  if (cache.connection) return cache.connection;
  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI 환경 변수를 설정해 주세요.");
    cache.promise = mongoose.connect(uri).catch((error: unknown) => {
      cache.promise = null;
      throw error;
    });
  }
  cache.connection = await cache.promise;
  return cache.connection;
}
