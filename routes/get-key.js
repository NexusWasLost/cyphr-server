import { Hono } from "hono";
import { neon } from "@neondatabase/serverless";
import { decryptKey } from "../utils/encrypt.js";
import { HTTPException } from "hono/http-exception";
import { endTime, startTime } from "hono/timing";

const getkey = new Hono();

getkey.get("/get-key/:key_id", async function (c) {
    const keyId = c.req.param("key_id");
    if (!keyId)
        throw new HTTPException(400, { message: "Key Id not provided" });

    //check for encrypted key in cache
    const enc_key = await c.env.API_CACHE.get(`key_id:${keyId}`);
    if (enc_key) {
        const decryptedKey = await decryptKey(c, enc_key);
        return c.json({
            success: true,
            message: "Decryption Success",
            key: decryptedKey
        }, 200);
    }

    const sql = neon(c.env.DATABASE_URL);
    const data = await sql.query(`
        SELECT encrypted_key FROM api_keys WHERE key_id = $1`,
        [keyId]
    );

    if (data.length === 0)
        throw new HTTPException(404, { message: "No Key Found" });

    //cache encrypted key
    c.executionCtx.waitUntil(c.env.API_CACHE.put(`key_id:${keyId}`, `${data[0].encrypted_key}`, {
        expirationTtl: 600
    }));

    const decryptedKey = await decryptKey(c, data[0].encrypted_key);

    return c.json({
        success: true,
        message: "Decryption Success",
        key: decryptedKey
    }, 200);
});

getkey.get("/list-keys", async function (c) {
    const meta = c.get("meta");
    if (!meta)
        throw new HTTPException(401, { message: "User context not found (Unauthorized) !" });

    const id = meta.uid;

    // check for data in the cache
    const cachedString = await c.env.API_CACHE.get(`keys:${id}`);
    if (cachedString) {
        const data = JSON.parse(cachedString);
        return c.json({
            success: true,
            message: "Retrieve Success",
            data: data
        }, 200);
    }

    const sql = neon(c.env.DATABASE_URL);
    const data = await sql.query(`
        SELECT key_id, key_name, key_hint, service_name
        FROM api_keys WHERE user_id = $1`,
        [id]
    );

    if (data.length === 0)
        throw new HTTPException(404, { message: "No Keys Found" });

    //cache the data
    await c.env.API_CACHE.put(`keys:${id}`, JSON.stringify(data), { expirationTtl: 480 });

    return c.json({
        success: true,
        message: "Retrieve Success",
        data: data
    });

});

export default getkey;
