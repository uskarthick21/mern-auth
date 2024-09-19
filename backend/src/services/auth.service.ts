import { APP_ORIGIN, JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import { CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND, TOO_MANY_REQUESTS, UNAUTHORIZED } from "../constants/http";
import VerificationCodeType from "../constants/verificationCodeType";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.models";
import VerificationCodeModel from "../models/verificationCode.model";
import appAssert from "../utils/appAssert";
import { fiveMinutesAgo, ONE_DAY_MS, oneHourFromNow, oneYearFromNow, thirtyDaysFromNow } from "../utils/date";
import jwt from 'jsonwebtoken';
import { RefreshTokenPayload, refreshTokenSignOptions, signToken, verifyToken } from "../utils/jwt";
import { sendMail } from "../utils/sendMail";
import { getPasswordResetTemplate, getVerifyEmailTemplate } from "../utils/emailTemplates";
import { hashValue } from "../utils/bcrypt";

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
    const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;
    const {error} = await sendMail({
        to: user.email,
        ...getVerifyEmailTemplate(url)
    })

    if(error) {
        console.log(error)
    }

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

export const refreshUserAccessToken = async(refreshToken: string) => {

    const {payload} = verifyToken<RefreshTokenPayload> (refreshToken, {
        secret: refreshTokenSignOptions.secret,
    })
    appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

    // below chceck is for if our seesion is deleted in data base and still trying for refresh token. video: 1.56.00
    // https://www.youtube.com/watch?v=NR2MJk9C1Js&t=6615s
    const session = await SessionModel.findById(payload.sessionId)
    const now = Date.now();
    appAssert(session && session.expiresAt.getTime() > now, UNAUTHORIZED,  "Session expired")

    // refresh the session if it expires in the next 24 hours:
    const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS;
    if(sessionNeedsRefresh) {
        session.expiresAt = thirtyDaysFromNow();
        await session.save();
    }

    const newRefreshToken = sessionNeedsRefresh ? signToken({
        sessionId: session._id
    }, 
    refreshTokenSignOptions) : undefined;

    const accessToken = signToken({
        userId: session.userId,
        sessionId: session._id, 
    })

    return {
        accessToken,
        newRefreshToken
    }
}

export const verifyEmail = async(code: string) => {
    // get the verification code
    const validCode = await VerificationCodeModel.findOne({
        _id: code,
        type: VerificationCodeType.EmailVerification,
        expiresAt: {$gt: new Date()},
    })
    appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

    // Update user to verified true
    const updatedUser = await UserModel.findByIdAndUpdate(
        validCode.userId, 
        {
        verified: true,
        },
        {new: true}
    );
    appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Falied to verify email");

    // delete verification code
    await validCode.deleteOne();
    
    return{
        user: updatedUser.omitPassword(),
    }
}

export const sendPasswordResetEmail = async (email: string) => {
  // Catch any errors that were thrown and log them (but always return a success)
  // This will prevent leaking sensitive data back to the client (e.g. user not found, email not sent).
  try {
    // get the user by email
    const user = await UserModel.findOne({email});
    appAssert(user, NOT_FOUND, "User not found");

    // check email rate limit
    const fiveMinAgo = fiveMinutesAgo();
    const count = await VerificationCodeModel.countDocuments({
        userId: user._id,
        type: VerificationCodeType.PasswordReset,
        createdAt: {$gt: fiveMinAgo},
    })
    appAssert(count <= 1, TOO_MANY_REQUESTS, "Too many requests, Please try again later")

    // create verification code
    const expiresAt = oneHourFromNow();
    const verificationCode = await VerificationCodeModel.create({
        userId: user._id,
        type: VerificationCodeType.PasswordReset,
        expiresAt,
    });

    // send verification email
    const url = `${APP_ORIGIN}/password/reset?code=${verificationCode._id}&exp=${expiresAt.getTime()}`;

    const {data, error} = await sendMail({
        to: user.email,
        ...getPasswordResetTemplate(url)
    });
    appAssert(data?.id, INTERNAL_SERVER_ERROR, `${error?.name} - ${error?.message}`);

    // return success
    return {
        url, 
        emailId: data.id
    }
} catch (error: any) {
    console.log("SendPasswordResetError:", error.message);
    return {};
  }
}

type ResetPasswordParams = {
    password: string;
    verificationCode: string;
}


export const resetPassword = async({password, verificationCode}: ResetPasswordParams) => {

    console.log("verificationCode:", verificationCode)

    // check verification code if exist:
    const validCode = await VerificationCodeModel.findOne({
        _id: verificationCode,
        type: VerificationCodeType.PasswordReset,
        expiresAt: {$gt: new Date()}
    })

    console.log("validCode:", validCode)
    appAssert(validCode,NOT_FOUND, "Verification code not Found" )

    // Check user with this Verification code and update password
    const updatedUser = await UserModel.findByIdAndUpdate(
        validCode.userId,
        {
            password: await hashValue(password)
        },
        { new: true}
    )
    appAssert(updatedUser, NOT_FOUND, "User not found for this verification id")

    // delete the verification code:
    await validCode.deleteOne();

    // delete all sessions
    await SessionModel.deleteMany({
        userId: updatedUser.id
    })

    // Return user:
    return {
        user: updatedUser.omitPassword()
    }

}