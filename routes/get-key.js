import { Hono } from "hono";
import { neon } from "@neondatabase/serverless";
import { decryptKey } from "../utils/encrypt.js";

const getkey = new Hono();

getkey.get("/get-key", async function(c){
    try{
        return c.json({message: "Get success"}, 200);
    }
    catch(error){
        console.log(error);
        return c.json({message: "Internal Server Error"}, 500);
    }
})

export default getkey;
