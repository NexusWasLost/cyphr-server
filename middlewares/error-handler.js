import { HTTPException } from "hono/http-exception";

export const errorHandler = function (error, c) {
    if (error instanceof HTTPException) {
        console.error("[HTTP ERROR]: ", error);

        return c.json({
            success: false,
            message: error.message || "A resource error has occured"
        }, error.status);

        return error.getResponse();
    }

    console.error("[CRITICAL ERROR]: ", error);

    return c.json({
        success: false,
        message: "An unexpected Error has occured"
    }, 500);
}
