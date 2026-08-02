import mongoose from "mongoose";
import dotenv from "dotenv";
import { generateStudentRegistrationNumber } from "./utils/generateStudentRegistrationNumber.js";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected");

        const number = await generateStudentRegistrationNumber();

        console.log("Generated Number:", number);

        await mongoose.disconnect();

    } catch (error) {
        console.log(error.message);
    }
};

test();