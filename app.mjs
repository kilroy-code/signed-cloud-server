import process from 'process';
import express from 'express';
import logger from 'morgan';
import {keys, origin} from './lib/storage.mjs';
import pkg from './package.json' assert {type: 'json'};
const port = new URL(origin).port;
const app = express();
process.title = 'ki1r0ystore';
app.use(logger(':date[iso] :method :url :status :res[content-length] :response-time '));
app.use('/db', keys);
app.use(express.static('../..')); // { maxAge: '1h'}
app.listen(port, () => console.log(`${pkg.name} ${pkg.version} listening on port ${port}`));


