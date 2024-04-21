import process from 'process';
import express from 'express';
import logger from 'morgan';
import {keys, origin} from './lib/storage.mjs';
import pkg from './package.json' assert {type: 'json'};
//import clientStorage from '../signed-cloud-client/index.mjs'; // Server from the port specified by client.
//const port = new URL(clientStorage.origin).port;
const port = new URL(origin).port;
const app = express();
process.title = 'ki1r0ystore';
app.use(logger(':date[iso] :method :url :status :res[content-length] :response-time '));
app.use('/db', keys);
app.listen(port, () => console.log(`${pkg.name} ${pkg.version} listening on port ${port}`));


