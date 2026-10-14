import { model, models, Schema, type Model, type Types } from "mongoose";

const cartSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  }],
}, { timestamps: true });

type CartFields = {
  userId: Types.ObjectId;
  items: { productId: Types.ObjectId; qty: number }[];
};

export const Cart = (models.Cart as Model<CartFields> | undefined) ?? model<CartFields>("Cart", cartSchema);
