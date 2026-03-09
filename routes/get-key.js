import { Hono } from "hono";
import { neon } from "@neondatabase/serverless";
import { decryptKey } from "../utils/encrypt.js";

const getkey = new Hono();

getkey.get("/get-key", async function(c){
    try{

        const { keyId } = await c.req.json();
        if(!keyId)
            return c.json({message: "Key Id not provided"}, 400);

        const sql = neon(c.env.DATABASE_URL);
        const data = await sql.query(`
            SELECT * FROM api_keys WHERE key_id = $1`,
            [keyId]
        );

        if(data.length === 0)
            return c.json({message: "No Key Found"}, 404);

        const decryptedKey = await decryptKey(c, data[0].encrypted_key);
        // const decryptedKey = await decryptKey(data[0].);
        return c.json({
            message: "Decryption Success",
            key: decryptedKey
        }, 200);
    }
    catch(error){
        console.log(error);
        return c.json({message: "Internal Server Error"}, 500);
    }
})

export default getkey;
