import type { ClientSession } from "mongoose";
import { CommerceError } from "@/lib/commerce-error";
import { connectDB } from "@/lib/mongodb";
import { Coupon } from "@/models/Coupon";

export async function useCoupon(couponId: string, userId: string, session?: ClientSession) {
  const coupon = await Coupon.findOneAndUpdate(
    { _id: couponId, userId, used: false },
    { $set: { used: true } },
    { new: true, session },
  );
  if (!coupon) throw new CommerceError("사용할 수 없는 쿠폰입니다.");
  return coupon.discount;
}

export async function getAvailableCoupons(userId: string) {
  await connectDB();
  return Coupon.find({ userId, used: false }).sort({ createdAt: -1 }).lean().then((coupons) =>
    coupons.map((coupon) => ({
      id: String(coupon._id),
      code: coupon.code,
      discount: coupon.discount,
    })),
  );
}
