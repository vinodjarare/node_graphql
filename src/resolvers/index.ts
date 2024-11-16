import bcrypt from "bcrypt";
import User from "../db/entities/User";
import jwt from "jsonwebtoken";
import Product from "../db/entities/Product";
import { IUser } from "@/types";
const resolvers = {
  Mutation: {
    createUser: async (
      _: any,
      {
        address,
        email,
        password,
      }: { address: string; email: string; password: string }
    ) => {
      try {
        let existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error("User already exists");
        }

        let hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ address, email, password: hashedPassword });

        const savedUser = await user.save();

        return savedUser;
      } catch (error) {
        console.error("Error creating user:", error);
        if (error instanceof Error) throw new Error(error.message);
      }
    },
    login: async (
      _: any,
      { email, password }: { email: string; password: string }
    ) => {
      try {
        let user = await User.findOne({ email }).select("+password");
        if (!user) {
          throw new Error("Invalid email or password");
        }

        let validPassword = await bcrypt.compare(
          password,
          user.password as string
        );
        if (!validPassword) {
          throw new Error("Invalid email or password");
        }

        let token = jwt.sign(
          { sub: user.id, email: user.email },
          process.env.JWT_SECRET as string,
          { expiresIn: "7d" }
        );
        return { token, user };
      } catch (error) {
        console.error("Error logging in:", error);
        if (error instanceof Error) throw new Error(error.message);
      }
    },
    addProduct: async (
      _: any,
      {
        name,
        price,
        quantity,
      }: {
        name: string;
        price: number;
        quantity: number;
      },
      { user }: { user: IUser | null }
    ) => {
      try {
        if (!user) {
          throw new Error("You dont have permission to add a product");
        }
        let existingProduct = await Product.findOne({ name });
        if (existingProduct) {
          throw new Error("Product already exists");
        }

        const product = new Product({
          name,
          price,
          quantity,
          owner: user._id,
        });

        const savedProduct = await product.save();
        return {
          ...savedProduct.toObject({
            transform: (doc, ret) => {
              ret.id = ret._id;
              return ret;
            },
          }),
          owner: user,
        };
      } catch (error) {
        console.error("Error adding product:", error);
        if (error instanceof Error) throw new Error(error.message);
      }
    },
    updateProduct: async (
      _: any,
      {
        id,
        name,
        price,
        quantity,
      }: {
        id: string;
        name: string;
        price: number;
        quantity: number;
      },
      { user }: { user: IUser | null }
    ) => {
      try {
        if (!user) {
          throw new Error("You dont have permission to update a product");
        }
        let product = await Product.findById(id);
        if (!product) {
          throw new Error("Product not found");
        }

        product.name = name;
        product.price = price;
        product.quantity = quantity;

        const updatedProduct = (await product.save()).populate("owner");
        return updatedProduct;
      } catch (error) {
        console.error("Error updating product:", error);
        if (error instanceof Error) throw new Error(error.message);
      }
    },
  },
  Query: {
    product: async (
      _: any,
      { id }: { id: string },
      { user }: { user: IUser | null }
    ) => {
      try {
        if (!user) {
          throw new Error("You dont have permission to view this resource");
        }
        let product = await Product.findById(id).populate("owner");
        if (!product) {
          throw new Error("Product not found");
        }

        return product;
      } catch (error) {
        console.error("Error fetching product:", error);
        if (error instanceof Error) throw new Error(error.message);
      }
    },
    productCount: async () => {
      try {
        let count = await Product.countDocuments();
        return count;
      } catch (error) {
        console.error("Error fetching product count:", error);
        if (error instanceof Error) throw new Error(error.message);
      }
    },
    users: async () => {
      try {
        let users = await User.find();
        return users;
      } catch (error) {
        console.error("Error fetching users:", error);
        if (error instanceof Error) throw new Error(error.message);
      }
    },
    user: async (
      _: any,
      { id }: { id: string },
      { user }: { user: IUser | null }
    ) => {
      try {
        if (!user) {
          throw new Error("You dont have permission to view this resource");
        }
        let userData = await User.findById(user._id);
        if (!userData) {
          throw new Error("User not found");
        }

        return userData;
      } catch (error) {
        console.error("Error fetching user:", error);
        if (error instanceof Error) throw new Error(error.message);
      }
    },
    productsByUser: async (
      _: any,
      { userId }: { userId: string },
      { user }: { user: IUser | null }
    ) => {
      try {
        if (!user) {
          throw new Error("You dont have permission to view this resource");
        }
        let products = await Product.find({ owner: user._id }).populate(
          "owner"
        );
        return products;
      } catch (error) {
        console.error("Error fetching products by user:", error);
        if (error instanceof Error) throw new Error(error.message);
      }
    },
    products: async (
      _: any,
      { limit, page, search }: { limit: number; page: number; search: string },
      { user }: { user: IUser | null }
    ) => {
      try {
        if (!user) {
          throw new Error("You dont have permission to view this resource");
        }
        let name = new RegExp(search, "i");
        const aggregate = Product.aggregate([
          {
            $match: {
              name,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
          {
            $unwind: "$owner",
          },
          {
            $addFields: {
              id: "$_id", // Map product _id to id
              "owner.id": "$owner._id", // Map owner's _id to id
            },
          },
          {
            $project: {
              _id: 0, // Optionally remove _id if you don't need it
              "owner._id": 0, // Remove _id from owner to avoid confusion
            },
          },
          {
            $sort: { createdAt: -1 },
          },
        ]);

        let aggregatePaginate = await Product.aggregatePaginate(aggregate, {
          page,
          limit,
        });

        console.log(aggregatePaginate.docs);
        return {
          products: aggregatePaginate.docs,
          total: aggregatePaginate.totalDocs,
          totalPages: aggregatePaginate.totalPages,
          page: aggregatePaginate.page,
          limit: aggregatePaginate.limit,
          hasPrevPage: aggregatePaginate.hasPrevPage,
          hasNextPage: aggregatePaginate.hasNextPage,
          nextPage: aggregatePaginate.nextPage,
          prevPage: aggregatePaginate.prevPage,
        };
      } catch (error) {
        console.error("Error fetching products:", error);
        if (error instanceof Error) throw new Error(error.message);
      }
    },
  },
};

export default resolvers;
