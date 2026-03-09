import { decodeBase64, encodeBase64 } from "hono/utils/encode";

async function createKey(keyByteArray) {
    //create key for encryption
    const crypto_key = await crypto.subtle.importKey(
        "raw", //format
        keyByteArray, //key bytes
        {
            name: "AES-GCM" //algorithm
        },
        false, //export key - false
        ["encrypt", "decrypt"] //key use
    );

    return crypto_key;
}

export const encryptKey = async function (c, key) {

    try {
        const encodedAPIKey = new TextEncoder().encode(key);

        //decoded base64 string to uint8 array
        const keyByteArray = decodeBase64(c.env.MASTER_KEY);
        //create key for encryption
        const crypto_key = await createKey(keyByteArray);

        const IV = crypto.getRandomValues(new Uint8Array(12));
        const encryptedBuffer = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: IV
            },
            crypto_key,
            encodedAPIKey
        );

        const cypherBytes = new Uint8Array(encryptedBuffer);
        const finalBytes = new Uint8Array(IV.length + cypherBytes.length);
        finalBytes.set(IV, 0);
        finalBytes.set(cypherBytes, IV.length);

        return encodeBase64(finalBytes);
    }
    catch (error) {
        throw new Error(`Encryption Error: ${ error.message }`);
    }
}

export const decryptKey = async function (c, encryptedKey) {
    try {
        const decoded = decodeBase64(encryptedKey);
        const keyByteArray = decodeBase64(c.env.MASTER_KEY);

        //extract iv
        const IV = decoded.slice(0, 12);
        //extract ciphertext
        const cypherText = decoded.slice(12);

        const crypto_key = await createKey(keyByteArray);
        //decrypt the key
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: IV
            },
            crypto_key,
            cypherText
        );

        const APIKey = new TextDecoder().decode(decryptedBuffer);

        return APIKey;
    }
    catch (error) {
        throw new Error(`Decryption Error: ${ error.message }`);
    }
}
