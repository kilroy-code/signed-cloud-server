# Signed Cloud Server

Basic cloud storage in which contents are cryptographically signed, using distributed-storage as a co-dependency.

[ki1r0y](https://github.com/kilroy-code/ki1r0y) [distributed-security](https://github.com/kilroy-code/distributed-security) securely stores public keys and encrypted private keys in the cloud. This package provides that cloud.

To run stand-alone:

```
npm install
npm run background # or npm start. To stop, npm stop
```

Example of using distributed-security in the [node REPL](https://nodejs.org/en/learn/command-line/how-to-use-the-nodejs-repl) (run `node` in shell):

```
const { default: Security } = await import("@ki1r0y/distributed-security");
let device = await Security.create();
let me = await Security.create(device);

let encrypted = await Security.encrypt("A secret message", me);
let decrypted = await Security.decrypt(encrypted);
console.log(encrypted, decrypted);

let simpleSignature = await Security.sign("I did it my way.", me);
let simpleVerification = await Security.verify(simpleSignature);
console.log(simpleSignature, simpleVerification);

let auditableSignature = await Security.sign("I did it my way.", {team: me});
let auditableVerification = await Security.verify(auditableSignature);
console.log(auditableSignature, auditableVerification);

```


To include as middleware within another express-like server, see [app.mjs](./app.mjs).

