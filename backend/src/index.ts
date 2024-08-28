import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectToDatabase from "./config/db";
import { APP_ORIGIN, NODE_ENV, PORT } from "./constants/env";
import errorHandler from "./middleware/errorHandler";
import catchErrors from "./utils/catchErrors";
import { OK } from "./constants/http";
import authRoutes from "./routes/auth.route";
import authenticate from "./middleware/authenticate";
import userRoutes from "./routes/user.route";
import sessionRoutes from "./routes/session.route";

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(
    cors({
        origin: APP_ORIGIN,
        credentials: true,
    })
)
app.use(cookieParser());

app.get("/", (req, res, next) => {
    return res.status(OK).json({
        status: "healty"
    })
})

// auth routes
app.use("/auth", authRoutes);

// protected routes
// we create middleware called authenticate and authenticate the route for user and return the userid along with response.
app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);

app.use(errorHandler);

app.listen(PORT, async () => {
    console.log(`server is running on port ${PORT} in ${NODE_ENV} enviroment`);
    await connectToDatabase();
})