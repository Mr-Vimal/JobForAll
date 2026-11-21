
import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            return;
        }

        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error("MONGODB_URI is missing");
        }

        console.log("Connecting to MongoDB...");

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000
        });

        console.log("MongoDB Connected");
        console.log("Database Name:", mongoose.connection.name);

    } catch (error) {
        console.error("MongoDB Connection Error:", error);
        throw error;
    }
};

export default connectDB;
