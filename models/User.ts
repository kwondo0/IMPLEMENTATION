import { model, models, Schema, type Model } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user", required: true },
}, { timestamps: true });

type UserFields = {
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
};

export const User = (models.User as Model<UserFields> | undefined) ?? model<UserFields>("User", userSchema);
