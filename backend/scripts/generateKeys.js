import crypto from "crypto"; 
import fs from "fs"; 


const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },        // public key format
  privateKeyEncoding: { type: "pkcs8", format: "pem" },      // private key format
});

fs.mkdirSync("keys", { recursive: true });                        // keys folder 
fs.writeFileSync("keys/private.pem", privateKey);                   //  for sign 
fs.writeFileSync("keys/public.pem", publicKey);                     // for verify 
console.log("Keys created in keys/ folder");