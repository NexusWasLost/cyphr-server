import { Hono } from "hono";
import { neon } from "@neondatabase/serverless";
import { HTTPException } from "hono/http-exception";

const delkey = new Hono();

delkey.delete("/del-key/:key_id", async function (c) {
    const meta = c.get("meta");
    if(!meta)
        throw new HTTPException(401, { message: "User context not found (Unauthorized) !"});

    const keyId = c.req.param("key_id");
    if (!keyId)
        throw new HTTPException(400, { message: "Key Id not provided" });

    const sql = neon(c.env.DATABASE_URL);
    const res = await sql.query(`
        DELETE FROM api_keys WHERE key_id = $1`,
        [keyId]
    );

    if (res.rowCount === 0) {
        throw new HTTPException(404, { message: "Key not found" });
    }

    //remove all the cached key data
    c.executionCtx.waitUntil(c.env.API_CACHE.delete(`keys:${meta.uid}`));
    //remove all the cached encryted keys
    c.executionCtx.waitUntil(c.env.API_CACHE.delete(`key_id:${keyId}`));

    return c.json({
        success: true,
        message: "Key Deleted Successfully"
    }, 200)
});

export default delkey;
