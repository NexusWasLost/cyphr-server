import { HTTPException } from "hono/http-exception";
import { jwtVerify, createLocalJWKSet } from "jose";

//verify token and return custom payload
async function verifyToken(c, token, JWKS) {
    //create a local JWK set from JWKS JSON
    const jsonWebKeySet = createLocalJWKSet(JWKS);

    const content = await jwtVerify(token, jsonWebKeySet, {
        issuer: `https://${c.env.SUPABASE_PROJECT_ID}.supabase.co/auth/v1`,
        audience: "authenticated"
    });

    const customPayload = {
        uid: content.payload.sub,
        email: content.payload.email
    }

    return customPayload;
}

export const authMiddleware = async function (c, next) {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new HTTPException(401, {
            message: "Missing Auth Header or invalid auth header"
        }
        );
    }

    const token = authHeader.split(" ")[1];

    try {
        //check for JWKS in cache
        const cachedJWKS = await c.env.API_CACHE.get("JWKS");
        if (cachedJWKS) {
            let KeySet = JSON.parse(cachedJWKS);
            const customPayload = await verifyToken(c, token, KeySet);
            c.set("meta", customPayload);
            return await next();
        }

        //fetch keys from this URL
        // const JWKS_URL = `https://${c.env.SUPABASE_PROJECT_ID}.supabase.co/auth/v1/.well-known/jwks.json`;
        // const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
        // console.log(JWKS);

        //fetch JSON Web Key Set
        const JWKS_response = await fetch(`https://${c.env.SUPABASE_PROJECT_ID}.supabase.co/auth/v1/.well-known/jwks.json`,{
            method: "GET"
        });
        if(!JWKS_response.ok)
            throw new Error("Failed to fetch JWKS...");

        const JWKS = await JWKS_response.json();
        console.log(JWKS);
        // return c.json({"message": "end"}, 200); //this is for testing purpose !

        //cache the JWKS
        c.executionCtx.waitUntil(c.env.API_CACHE.put("JWKS", JSON.stringify(JWKS), {
            expirationTtl: 600
        }));

        const customPayload = await verifyToken(c, token, JWKS);
        c.set("meta", customPayload);
        await next();
    }
    catch (error) {
        throw new HTTPException(401, {
            message: "Authentication failed",
            cause: error
        });
    }
}
