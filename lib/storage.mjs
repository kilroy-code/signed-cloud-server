import express from 'express';
import {dbPath, pathTag} from './tagPath.mjs';
import {enqueueRequest} from './queue.mjs';
import {deepVerify, origin} from './verify.mjs';
import {storeVerifiedBody} from './storeVerified.mjs';
import {answerEmptyJSON} from './emptyJSON.mjs';

const keys = express.Router();

keys.use('/', express.static(dbPath, { maxAge: '1h'})); // Get the .json file

// It seems weird to handle json bodies as text, but alas, express body-parser doesn't
// handle all JSON! Our clients can send the result of JSON.stringify("some string"),
// which is legal json that JSON.parse handles, but which express body-parser does not.
// In any case, we need the parsed result for verify, and the original string for writing
// to the file system, so either way we have to either parse or stringify the body we are given.
keys.use(express.text({type: 'application/json'})); // Define req.body.
keys.put('/:collectionName/:a/:b/:c/:rest.json', pathTag, enqueueRequest, deepVerify, storeVerifiedBody, answerEmptyJSON);

export default keys;
export {keys, dbPath, enqueueRequest, deepVerify, storeVerifiedBody, answerEmptyJSON, origin};
