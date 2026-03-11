import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middlewares/auth.js";
import { errorHandler } from "./middlewares/error-handler.js";

import addkey from "./routes/add-key.js";
import getkey from "./routes/get-key.js";
import updatekey from "./routes/update-key.js";
import delkey from "./routes/del-key.js";

const app = new Hono();
app.onError(errorHandler);

app.use("*", cors({
    origin: [
        "https://cyphr.pages.dev"
    ],
    allowMethods: ["GET", "POST", "PATCH","DELETE"]
}));

app.use("*", authMiddleware);

app.route("/api", addkey);
app.route("/api", getkey);
app.route("/api", updatekey);
app.route("/api", delkey);

export default app;
