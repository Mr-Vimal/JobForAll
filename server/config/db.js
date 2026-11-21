
import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error("MONGODB_URI is missing from .env");
        }

        console.log("Connecting to MongoDB...");

        await mongoose.connect(uri);

        console.log("Database Connected");
        console.log("Database Name:", mongoose.connection.name);

    } catch (error) {
        console.error("MongoDB Error:", error.message);
        process.exit(1);
    }
};

export default connectDB;
