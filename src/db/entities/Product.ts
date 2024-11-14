import mongoose, { AggregatePaginateModel } from "mongoose";
import { IProduct } from "../../types";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

productSchema.plugin(aggregatePaginate);

export default mongoose.model<IProduct, AggregatePaginateModel<IProduct>>(
  "Product",
  productSchema
);
