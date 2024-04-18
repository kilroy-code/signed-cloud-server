import process from 'process';
import express from 'express';
import logger from 'morgan';
import storage from './lib/storage.mjs';
import pkg from './package.json' assert {type: 'json'};
const port = 8000;
const app = express();
app.use(logger(':date[iso] :method :url :status :res[content-length] :response-time '));
process.title = 'ki1r0ystore';

app.use('/db', storage);
app.listen(port, () => console.log(`${pkg.name} ${pkg.version} listening on port ${port}`));


