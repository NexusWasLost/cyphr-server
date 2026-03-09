import { Hono } from "hono";
import { neon } from "@neondatabase/serverless";
import { decryptKey } from "../utils/encrypt.js";
import { HTTPException } from "hono/http-exception";

const getkey = new Hono();

getkey.get("/get-key", async function (c) {
    const { keyId } = await c.req.json();
    if (!keyId)
        throw new HTTPException(400, { message: "Key Id not provided" });

    const sql = neon(c.env.DATABASE_URL);
    const data = await sql.query(`
        SELECT encrypted_key FROM api_keys WHERE key_id = $1`,
        [keyId]
    );

    if (data.length === 0)
        throw new HTTPException(404, { message: "No Key Found" });

    const decryptedKey = await decryptKey(c, data[0].encrypted_key);

    return c.json({
        message: "Decryption Success",
        key: decryptedKey
    }, 200);
});

export default getkey;
