import { model, models, Schema, type Model } from "mongoose";

const productSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  price: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  stock: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  deletedAt: { type: Date },
  imageBytes: { type: Buffer, select: false },
  imageVersion: { type: String },
}, { timestamps: true });

type ProductFields = {
  name: string;
  price: number;
  stock: number;
  deletedAt?: Date;
  imageBytes?: Buffer;
  imageVersion?: string;
};

export const Product = (models.Product as Model<ProductFields> | undefined) ?? model<ProductFields>("Product", productSchema);
