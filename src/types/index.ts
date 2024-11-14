import { Document, Schema } from "mongoose";

export interface IUser extends Document {
  _id: string | Schema.Types.ObjectId;
  address: string;
  email: string;
  password?: string;
  createdAt: Date;
}

export interface IProduct extends Document {
  _id: string | Schema.Types.ObjectId;
  owner: IUser["_id"];
  name: string;
  price: number;
  quantity: number;
  createdAt: Date;
}

export interface Context {
  user?: IUser;
}
