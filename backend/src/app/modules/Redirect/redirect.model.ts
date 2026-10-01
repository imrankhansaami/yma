import mongoose, { Document, Schema } from "mongoose";
import { IRedirect } from "./redirect.interface";

export interface IRedirectModel extends Omit<IRedirect, "_id">, Document {}

const redirectSchema: Schema = new Schema(
  {
    fromPath: {
      type: String,
      required: [true, "A redirect must have a source path"],
      unique: true,
      trim: true,
      index: true,
    },
    toPath: {
      type: String,
      required: [true, "A redirect must have a destination path"],
      trim: true,
    },
    statusCode: {
      type: Number,
      enum: [301, 302],
      default: 301,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better performance
redirectSchema.index({ isActive: 1 });
redirectSchema.index({ createdAt: -1 });

const Redirect = mongoose.model<IRedirectModel>("Redirect", redirectSchema);

export default Redirect;
