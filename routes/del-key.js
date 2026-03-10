import { Hono } from "hono";
import { neon } from "@neondatabase/serverless";
import { HTTPException } from "hono/http-exception";

const delkey = new Hono();

delkey.delete("/del-key/:key_id", async function (c) {
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

    return c.json({
        success: true,
        message: "Key Deleted Successfully"
    }, 200)
});

export default delkey;
