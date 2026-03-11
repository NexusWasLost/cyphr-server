import { Hono } from "hono";
import { neon } from "@neondatabase/serverless";
import { HTTPException } from "hono/http-exception";

const deluser = new Hono();

deluser.delete("/del-user/:user_id", async function (c){
    const userId = c.req.param("user_id");
    if(!userId)
        throw new HTTPException(400, {message: "User Id must be provided !"});

    //find the user in supabase
    const resp = await fetch(`https://${c.env.SUPABASE_PROJECT_ID}.supabase.co/auth/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
            "apikey": c.env.SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${c.env.SERVICE_ROLE_KEY}`
        }
    });
    if(!resp.ok)
        throw new HTTPException(500, {message: "Failed to Delete user"});

    //now delete the user and data from database
    const sql = neon(c.env.DATABASE_URL);
    const data = await sql.query(
        `DELETE FROM users
        WHERE user_id = $1`,
        [userId]
    );

    if(data.rowCount === 0)
        //there can be a valid user without any API Keys so return status 200
        return c.json({message: "User does not have any API Key"}, 200);

    return c.json({
        success: true,
        message: "User Deleted Successfully"
    }, 200);
});

export default deluser;
