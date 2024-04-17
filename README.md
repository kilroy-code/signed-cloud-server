co-dependency with distributed-security
router at entry point, for use in an express-like server. (give example code)
comes with a basic stand-alone server:
  npm install
  npm start
hosts client code. (show where)

TODO:

- [x] queue
- [x] how do we guard against rewrite of device EncryptionKey? (since devices have no members, so signature is compact)
- [x] unit tests
- [x] verify
- [x] content-type
- [ ] cache-control / max-age -- can we make it do the HEAD/304 thing?
- [ ] origin (in signed-cloud-client/index.mjs, and signedCloudSpec.mjs)
- [ ] split tag into subdirectories
- [ ] split resusable parts to routes.mjs
- [ ] process.title, powered-by, content-security-policy
- [ ] link client to public at its installation
- [ ] update all READMEs
- [ ] publish github @kilroy-code packages
- [ ] install packages and refer to them in code
- [ ] change packages to npm @kilr0y and republish
- [ ] refer to npm @kilr0y packages in code and READMEs, update package versions to 1.0.0, and publish to npm
- [ ] retest with clean install

