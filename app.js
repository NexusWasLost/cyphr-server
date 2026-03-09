import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware } from "./middlewares/auth.js";
import { errorHandler } from "./middlewares/error-handler.js";

import addkey from "./routes/add-key.js";
import getkey from "./routes/get-key.js";

const app = new Hono();
app.onError(errorHandler);
// app.use("*", cors({
//     origin: [
//         "https://keevlt.pages.dev",
//         "http://localhost:5501"
//     ],
//     allowMethods: ["GET", "POST", "PUT", "DELETE"]
// }));

app.use("*", authMiddleware);

app.route("/api", addkey);
app.route("/api", getkey);

export default app;
