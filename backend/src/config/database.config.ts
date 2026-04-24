import mongoose from "mongoose";
import logger from "./logger.config.js";


const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL as string,{
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger.info("✅ MongoDB connected");
    } catch (error) {
        logger.error("MongoDB error:", error);
        process.exit(1);
    }
}

export default connectDatabase;