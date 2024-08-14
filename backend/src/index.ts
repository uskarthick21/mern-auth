import "dotenv/config";
import express from "express";
import connectToDatabase from "./config/db";
import { NODE_ENV, PORT } from "./constants/env";

const app = express();

app.get("/", (req, res) => {
    return res.status(200).json({
        status: "healty"
    })
})

app.listen(4004, async () => {
    console.log(`server is running on port ${PORT} in ${NODE_ENV} enviroment`);
    await connectToDatabase();
})