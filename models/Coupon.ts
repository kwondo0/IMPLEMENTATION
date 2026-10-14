import { model, models, Schema, type Model, type Types } from "mongoose";

const couponSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
  discount: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  used: { type: Boolean, default: false, required: true },
}, { timestamps: true });

couponSchema.index({ userId: 1, code: 1 }, { unique: true });

type CouponFields = { userId: Types.ObjectId; code: string; discount: number; used: boolean };

export const Coupon = (models.Coupon as Model<CouponFields> | undefined) ?? model<CouponFields>("Coupon", couponSchema);
