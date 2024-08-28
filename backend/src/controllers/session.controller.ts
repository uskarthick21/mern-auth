import { z } from "zod";
import { NOT_FOUND, OK } from "../constants/http";
import SessionModel from "../models/session.model";
import catchErrors from "../utils/catchErrors";
import appAssert from "../utils/appAssert";

export const getSessionsHandler = catchErrors(async (req, res) => {
    // return the session with greater expire date and sort with recent session
    const sessions = await SessionModel.find(
        {
            userId: req.userId,
            expiresAt: {$gt: new Date()}
        },
        {
        _id: 1,
        userAgent: 1,
        createdAt: 1
        },
        {
            sort: {createdAt: -1}
        }
    );

    // we are not only return the session. we are adding additional properties 'isCurrent' based on the  session.id === req.sessionId.
    return res.status(OK).json(
        sessions.map((session) => ({
            ...session.toObject(),
            ...(session.id === req.sessionId && {
                isCurrent: true
            }),
        }))
    )
})

export const deleteSessionHandler = catchErrors(async (req, res) => {
    const sessionId = z.string().parse(req.params.id);
    // userId: req.userId, only the user deleted thier session.
    const deleted = await SessionModel.findOneAndDelete({
        _id: sessionId,
        userId: req.userId,
    });
    appAssert(deleted, NOT_FOUND, "Session not found");
    return res.status(OK).json({
        message: "Session removed"
    })
})