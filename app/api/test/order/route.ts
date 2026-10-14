import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { decreaseStock, decreaseStockBad } from "@/lib/products";

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development" || process.env.ENABLE_TEST !== "true") {
    return new Response("Not found", { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "올바른 JSON 요청이 필요합니다." }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null || !("productId" in payload) || !("mode" in payload)) {
    return NextResponse.json({ error: "productId와 mode를 입력해 주세요." }, { status: 400 });
  }
  const { productId, mode } = payload;
  if (typeof productId !== "string" || !/^[a-f\d]{24}$/i.test(productId)) {
    return NextResponse.json({ error: "올바르지 않은 상품 ID입니다." }, { status: 400 });
  }
  if (mode !== "bad" && mode !== "good") {
    return NextResponse.json({ error: "mode는 bad 또는 good이어야 합니다." }, { status: 400 });
  }

  await connectDB();
  const ok = mode === "bad"
    ? await decreaseStockBad(productId, 1)
    : await decreaseStock(productId, 1);
  return NextResponse.json({ ok });
}
