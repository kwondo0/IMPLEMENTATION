import mongoose from "mongoose";
import type { ClientSession } from "mongoose";
import { CommerceError } from "@/lib/commerce-error";
import { useCoupon } from "@/lib/coupons";
import { connectDB } from "@/lib/mongodb";
import { Cart } from "@/models/Cart";
import { Coupon } from "@/models/Coupon";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { decreaseStock } from "@/lib/products";

const allowedTransitions: Record<string, string[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function createOrder(userId: string, couponId?: string) {
  await connectDB();
  const session = await mongoose.startSession();
  let orderId = "";

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId }).session(session);
      if (!cart || cart.items.length === 0) throw new CommerceError("장바구니가 비었습니다.");

      const items: { productId: mongoose.Types.ObjectId; name: string; price: number; qty: number }[] = [];
      for (const cartItem of cart.items) {
        const product = await Product.findById(cartItem.productId).session(session);
        if (!product) throw new CommerceError("장바구니에 없는 상품이 포함되어 있습니다.");
        if (!Number.isSafeInteger(cartItem.qty) || cartItem.qty < 1) {
          throw new CommerceError("장바구니 수량이 올바르지 않습니다.");
        }
        if (!(await decreaseStock(String(product._id), cartItem.qty, session))) {
          throw new CommerceError(`${product.name}의 재고가 부족합니다.`);
        }
        items.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          qty: cartItem.qty,
        });
      }

      let totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      if (!Number.isSafeInteger(totalAmount)) throw new CommerceError("주문 금액이 올바르지 않습니다.");
      if (couponId) totalAmount = Math.max(0, totalAmount - await useCoupon(couponId, userId, session));

      const [order] = await Order.create([{
        userId,
        items,
        couponId: couponId || null,
        totalAmount,
      }], { session });
      await Cart.updateOne({ userId }, { $set: { items: [] } }, { session });
      orderId = String(order._id);
    });
    if (!orderId) throw new Error("주문이 생성되지 않았습니다.");
    return orderId;
  } finally {
    await session.endSession();
  }
}

async function cancelOrderInSession(orderId: string, userId: string, session: ClientSession, allowedStatuses: string[]) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, userId, status: { $in: allowedStatuses } },
    { $set: { status: "CANCELLED" } },
    { new: true, session },
  );
  if (!order) throw new CommerceError("취소할 수 없는 주문입니다.");

  for (const item of order.items) {
    const result = await Product.updateOne(
      { _id: item.productId },
      { $inc: { stock: item.qty } },
      { session },
    );
    if (result.matchedCount !== 1) throw new CommerceError("상품 재고를 복구하지 못했습니다.");
  }

  if (order.couponId) {
    const result = await Coupon.updateOne(
      { _id: order.couponId, userId, used: true },
      { $set: { used: false } },
      { session },
    );
    if (result.matchedCount !== 1) throw new CommerceError("쿠폰 사용 상태를 복구하지 못했습니다.");
  }
  return order;
}

export async function cancelOrder(orderId: string, userId: string) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await cancelOrderInSession(orderId, userId, session, ["PENDING", "PAID"]);
    });
  } finally {
    await session.endSession();
  }
}

export async function payOrder(orderId: string, userId: string) {
  await connectDB();
  const session = await mongoose.startSession();
  let expired = false;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: orderId, userId }).session(session);
      if (!order) throw new CommerceError("주문을 찾을 수 없습니다.");
      if (order.status !== "PENDING") throw new CommerceError("결제할 수 없는 주문 상태입니다.");

      if (Date.now() - order.createdAt.getTime() > 15 * 60 * 1000) {
        await cancelOrderInSession(orderId, userId, session, ["PENDING"]);
        expired = true;
        return;
      }

      const updated = await Order.findOneAndUpdate(
        { _id: orderId, userId, status: "PENDING" },
        { $set: { status: "PAID" } },
        { new: true, session },
      );
      if (!updated) throw new CommerceError("주문 상태가 이미 변경되었습니다.");
    });
  } finally {
    await session.endSession();
  }
  if (expired) throw new CommerceError("결제 시간이 지나 주문이 취소되었습니다.");
}

export async function changeOrderStatus(orderId: string, from: string, to: string) {
  if (!allowedTransitions[from]?.includes(to)) throw new CommerceError("허용되지 않은 상태 변경입니다.");
  await connectDB();
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: from },
    { $set: { status: to } },
    { new: true },
  );
  if (!order) throw new CommerceError("주문 상태가 이미 변경되었거나 주문이 없습니다.");
  return order;
}

export async function getOrders(userId: string) {
  await connectDB();
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return orders.map((order) => ({
    id: String(order._id),
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      name: item.name,
      price: item.price,
      qty: item.qty,
      subtotal: item.price * item.qty,
    })),
  }));
}

export async function getOrder(orderId: string, userId: string) {
  if (!/^[a-f\d]{24}$/i.test(orderId)) return null;
  await connectDB();
  const order = await Order.findOne({ _id: orderId, userId }).lean();
  if (!order) return null;
  return {
    id: String(order._id),
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      name: item.name,
      price: item.price,
      qty: item.qty,
      subtotal: item.price * item.qty,
    })),
  };
}

export async function getRecentOrdersForAdmin() {
  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 }).limit(100).populate("userId", "name email").lean();
  return orders.map((order) => {
    const user = order.userId as unknown as { name: string; email: string };
    return {
      id: String(order._id),
      customer: user?.name ?? user?.email ?? "알 수 없음",
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    };
  });
}
