import { ErrorRequestHandler, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constants/http";
import { z } from "zod";
import AppError from "../utils/AppError";
import { clearAuthCookies, REFRESH_PATH } from "../utils/cookies";


const handleZodError = (res: Response, error: z.ZodError) => {

    const errors = error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message
    }))

    return res.status(BAD_REQUEST).json({
        message: error.message,
        errors
    })
}

const handleAppError = (res: Response, error: AppError) => {
    return res.status(error.statusCode).json({
        message: error.message,
        errorCode: error.errorCode,
    });
};

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {

// we are going to check the error is the validation error and pass the error 
// message approtie

    console.log(`PATH: ${req.path}`, error);

    // just clear the cookies if error refresh tooken or acceidently remove session form DB or any error occur while calling this REFRESH_PATH
    // edge case checking - video: 2.07.00
    // https://www.youtube.com/watch?v=NR2MJk9C1Js&t=6615s
    
    if(req.path === REFRESH_PATH ){
        clearAuthCookies(res)
    }

    if(error instanceof z.ZodError) {
        return handleZodError(res, error);
    }

    if(error instanceof AppError) {
        return handleAppError(res,error);
    }

    return res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error")
}

export default errorHandler;