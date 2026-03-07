import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middlewares/auth.js";

import addkey from "./routes/addkey.js";

const app = new Hono();

app.use("*", cors({
    origin: [
        "https://keevlt.pages.dev",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use("*", authMiddleware);

app.route("/api", addkey);

export default app;
