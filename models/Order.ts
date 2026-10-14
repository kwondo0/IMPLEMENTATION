import { model, models, Schema, type Model, type Types } from "mongoose";

const orderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  }],
  couponId: { type: Schema.Types.ObjectId, ref: "Coupon", default: null },
  totalAmount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["PENDING", "PAID", "SHIPPING", "DELIVERED", "CANCELLED"],
    default: "PENDING",
    required: true,
  },
}, { timestamps: true });

type OrderFields = {
  userId: Types.ObjectId;
  items: { productId: Types.ObjectId; name: string; price: number; qty: number }[];
  couponId: Types.ObjectId | null;
  totalAmount: number;
  status: "PENDING" | "PAID" | "SHIPPING" | "DELIVERED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
};

export const Order = (models.Order as Model<OrderFields> | undefined) ?? model<OrderFields>("Order", orderSchema);
