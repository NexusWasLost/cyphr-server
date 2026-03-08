import { Hono } from "hono";
import { neon } from "@neondatabase/serverless";
import { encryptKey } from "../utils/encrypt.js";
import { createKeyHint } from "../utils/createHint.js";

const addkey = new Hono();

addkey.post("/add-key", async function(c){
    try{
        const { serviceName, apiKeyName, apiKeyValue } = await c.req.json();

        console.log(serviceName, apiKeyName, apiKeyValue);
        if(!serviceName || !apiKeyName || !apiKeyValue){
            return c.json({message: "All fields must be provided"}, 400);
        }

        const meta = c.get("meta");
        const sql = neon(c.env.DATABASE_URL);

        //create key hint
        const key_hint = createKeyHint(apiKeyValue);
        //encrypt key before insert
        const encryptedAPIKeyValue = await encryptKey(c, apiKeyValue);

        //insert user data
        await sql.query(`
            INSERT INTO users(user_id, user_email)
            VALUES('${meta.uid}', '${meta.email || null}')
            ON CONFLICT (user_id) DO NOTHING;
        `);
        //insert api key data
        await sql.query(`
            INSERT INTO api_keys(user_id, key_name, encrypted_key, key_hint, service_name)
            VALUES('${meta.uid}', '${apiKeyName}', '${encryptedAPIKeyValue}', '${key_hint}', '${serviceName}');
        `);

        return c.json({message: "Message Got"}, 200);
    }
    catch(error){
        console.log(error);
        return c.json({message: "Internal Server Error"}, 500);
    }
});

export default addkey;
