import { ApolloServer, BaseContext } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express, { Application } from "express";
import { IUser } from "./types";
import cors from "cors";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import connectDB from "./db/conn/db";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { Context } from "./types";
import resolvers from "./resolvers";
import User from "./db/entities/User";
import mongoose from "mongoose";
dotenv.config({ path: path.join(__dirname, "../.env.production") });

const app: Application = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome to Server");
});

interface AppolloContext extends Context {}

const init = async (): Promise<void> => {
  await connectDB();
  const httpServer = createServer(app);
  const typeDefs = fs.readFileSync(
    path.join(__dirname, "schema/schema.graphql"),
    "utf-8"
  );
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();
  app.use(
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : null;

        if (!token || token === "null" || token === "undefined") {
          return { user: null };
        }

        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
          const userId = new mongoose.Types.ObjectId(decoded.sub as string);
          const user = await User.findById(userId);
          return { user: user as IUser };
        } catch (error) {
          console.error("JWT verification error:", error);
          return { user: null };
        }
      },
    })
  );

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: process.env.PORT || 4000 }, resolve)
  );
  console.log(`:: server started on port ${process.env.PORT || 4000} ::`);
};

init().catch((err) => {
  console.log(err);
  process.exit(1);
});
