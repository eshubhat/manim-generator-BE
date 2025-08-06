import mongoose from "mongoose";

export const connectToDatabase = () => {
  try {
    mongoose
      .connect(process.env.MONGODB_URI as string)
      .then(() => console.log("DB connected!"));
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
