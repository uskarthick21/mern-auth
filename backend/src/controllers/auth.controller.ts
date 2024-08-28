import {z} from "zod";
import catchErrors from "../utils/catchErrors";
import { createAccount, loginUser, refreshUserAccessToken, resetPassword, sendPasswordResetEmail, verifyEmail } from "../services/auth.service";
import { clearAuthCookies, getRefreshTokenCookieOptions, setAuthCookies } from "../utils/cookies";
import { CREATED, OK, UNAUTHORIZED } from "../constants/http";
import { emailSchema, loginSchema, passwordSchema, registerSchema, resetPasswordSchema, verificationCodeSchema } from "./auth.schemas";
import { verifyToken } from "../utils/jwt";
import SessionModel from "../models/session.model";
import appAssert from "../utils/appAssert";


export const registerHandler = catchErrors(async(req, res) => {

    // validate request
    const request = registerSchema.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
    })

    // call service
    const {user, accessToken, refreshToken} = await createAccount(request);
    
    // return response
    return setAuthCookies({res, accessToken, refreshToken}).status(CREATED).json(user)
});

export const loginHandler = catchErrors(async(req, res) => {

    // validate request
    const request = loginSchema.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
    });

    // call service
    const {accessToken, refreshToken} = await loginUser(request);

    // Setting in SetAuthCookies will created new session after login.
    return setAuthCookies({
        res, accessToken, refreshToken
    }).status(OK).json({
        message: "Login successful"
    });
})

export const logoutHandler = catchErrors(async (req, res) => {
    const accessToken = req.cookies.accessToken as string|undefined;
    const {payload} = verifyToken(accessToken || "");

    if(payload) {
        await SessionModel.findByIdAndDelete(payload.sessionId);
    }

    return clearAuthCookies(res).status(OK).json({
        message: "Logout successful"
    })
})

export const refreshHandler = catchErrors(async(req, res) => {

console.log("REFRESH TOKEN IS CALLING")

    const refreshToken = req.cookies.refreshToken as string|undefined;
    appAssert(refreshToken, UNAUTHORIZED, "Missing refresh token");

    const {accessToken, newRefreshToken} = await refreshUserAccessToken(refreshToken);

    if(newRefreshToken) {
        res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());
    }

    return res.status(OK).cookie("accessToken", accessToken, getRefreshTokenCookieOptions()).json({
        message: "Access token refreshed"
    })

})

export const verifyEmailHandler = catchErrors(async (req,res) => {
    const verficationCode = verificationCodeSchema.parse(req.params.code);

    const {user} = await verifyEmail(verficationCode);

    return res.status(OK).json({
        user: user,
        message: "Email was verified"
    });
})

export const sendPasswordResetHandler = catchErrors(async(req,res) => {
    const email = emailSchema.parse(req.body.email);

    await sendPasswordResetEmail(email);

    return res.status(OK).json({
        message: "Password reset email sent"
    })
})

export const resetPasswordHandler = catchErrors(async(req, res) => {

    const request = resetPasswordSchema.parse(req.body);

    console.log("REQUEST:", request)

    await resetPassword(request)

    console.log("RESET PASSWORD RESPONSE:", res);

    return clearAuthCookies(res).status(OK).json({
        message: "Password reset successful"
    })
})