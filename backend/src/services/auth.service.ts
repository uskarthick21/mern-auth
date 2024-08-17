import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import { CONFLICT, UNAUTHORIZED } from "../constants/http";
import VerificationCodeType from "../constants/verificationCodeType";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.models";
import VerificationCodeModel from "../models/verificationCode.model";
import appAssert from "../utils/appAssert";
import { oneYearFromNow } from "../utils/date";
import jwt from 'jsonwebtoken';
import { refreshTokenSignOptions, signToken } from "../utils/jwt";

export type CreateAccountParams = {
    email: string;
    password: string;
    userAgent?: string;
}

export const createAccount = async (data: CreateAccountParams) => {

    // Verify existing user doesnt exist. This exists method work based on the
    // creteria we passed.
    const existingUser = await UserModel.exists({
        email: data.email
    });

    appAssert(!existingUser, CONFLICT, "email already in use");

    // if(existingUser) {
    //     throw new Error("User already exists")
    // }

    // create user
    const user = await UserModel.create({
        email: data.email,
        password: data.password,
    })

    const userId = user._id

    // create verification code
    const verificationCode = await VerificationCodeModel.create({
        userId,
        type: VerificationCodeType.EmailVerification,
        expiresAt: oneYearFromNow()
    })
    // send verification email


    // create session
    const session = await SessionModel.create({
        userId,
        userAgent: data.userAgent
    });


    // sign access token & refresh token
    const refreshToken = signToken(
        {
        sessionId: session._id
    }, refreshTokenSignOptions);

    // const accessToken = jwt.sign(
    //     {
    //     userId: user._id,
    //     sessionId: session._id
    // }, JWT_SECRET,
    // {
    //     audience: ["user"],
    //     expiresIn: "15m"
    // });

    const accessToken = signToken({
        userId,
        sessionId: session._id
    })

    // return user & tokens

    return {
        user: user.omitPassword(), accessToken, refreshToken
    }
}

type LoginParams = {
    email: string;
    password: string;
    userAgent?:string;
};

export const loginUser = async ({email, password, userAgent}: LoginParams) => {

    // get the user by email
    const user = await UserModel.findOne({email});
    appAssert(user, UNAUTHORIZED, "Invalid email or password");

    // validate password from the request
    const isValid = await user.comparePassword(password);
    appAssert(isValid, UNAUTHORIZED, "Invalid email or password");

    const userId = user._id;
    // create a session
    const session = await SessionModel.create({
        userId,
        userAgent,
    });

    const sessionInfo = {
        sessionId: session._id
    }

    // sign access token & refresh token

    // const refreshToken = jwt.sign(
    //     {
    //         sessionInfo
    // }, JWT_REFRESH_SECRET,
    // {
    //     audience: ["user"],
    //     expiresIn: "30d"
    // });

const refreshToken = signToken(sessionInfo, refreshTokenSignOptions)

    // const accessToken = jwt.sign(
    //     {
    //         ...sessionInfo,
    //     userId: user._id,

    // }, JWT_SECRET,
    // {
    //     audience: ["user"],
    //     expiresIn: "15m"
    // });

    const accessToken = signToken({
        ...sessionInfo,
        userId: user._id
    })

    // return user & tokens
    return {
        user: user.omitPassword(),
        accessToken,
        refreshToken
    }

}