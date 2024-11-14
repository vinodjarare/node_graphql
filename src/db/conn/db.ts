import mongoose from "mongoose";

const connectDB = async ():Promise<void> => {
  mongoose
    .connect(process.env.MONGO_URI as string, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      
    })
    .then((db) => {
      console.log(
        `:: database connected :: ${db.connection.host} on port ${db.connection.port}`
      );
    })
    .catch((err) => {
      console.log(`:: database connection error :: ${err}`);
    });
};

export default connectDB;