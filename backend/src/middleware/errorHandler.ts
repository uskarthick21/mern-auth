import { ErrorRequestHandler, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constants/http";
import { z } from "zod";


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

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {

// we are going to check the error is the validation error and pass the error 
// message approtie

    //console.log(`PATH: ${req.path}`, error);

    if(error instanceof z.ZodError) {
        return handleZodError(res, error);
    }

    return res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error")
}

export default errorHandler;