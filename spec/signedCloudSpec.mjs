// The distributed-security package has unit tests that sets up the package to use
// a simple in-memory storage that is independent of the cloud storage implementation.
// Here, however, we exercise distributed-security and signed-storage as co-dependencies
// of each other:
// - These tests use the default behavior of distributed-security.
// - The default behavior of distributed-security is to use signed-cloud-client.
// - The default behavior of signed-cloud-server is to use distributed-security

import Security from "../../distributed-security/lib/api.mjs";
//import Security from "../../distributed-security/index.mjs";
import Storage from "../../signed-cloud-client/index.mjs";
Security.getUserDeviceSecret = (tag, prompt = '') => tag+prompt;
Security.Storage = Storage;
Storage.Security = Security;

async function checkSignedResult(collectionName, tag) {
  // Retrieve specific resource and make sure it signed appropriately.
  let body = await Storage.retrieve(collectionName, tag),
      verified = await Security.verify(body);
  expect(verified).toBeTruthy();
  expect(verified.json).toBeTruthy();
  expect(verified.protectedHeader.kid || verified.protectedHeader.iss).toBeTruthy();
}
async function checkEmptyResult(collectionName, tag) {
  // Confirm that retrieval of a specific resource is empty.
  expect(await Storage.retrieve(collectionName, tag)).toBeFalsy();
}

describe("Signed Cloud", function () {
  let member1, member2, team;
  beforeAll(async function () {
    await Security.ready;
    member1 = await Security.create();
    member2 = await Security.create();
    team = await Security.create(member1);
    await checkSignedResult('EncryptionKey', member1);
    await checkSignedResult('EncryptionKey', member2);    
    await checkSignedResult('EncryptionKey', team);
    await checkSignedResult('Team', team);
  }, 10e3);
  it('verifies after change of membership, but tracks membership.', async function () {
    let teamSig = await Storage.retrieve('Team', team),
        verified = await Security.verify(teamSig, {team, member: member1, notBefore: 'Team'});
    expect(verified).toBeTruthy();
    await Security.changeMembership({tag: team, add: [member2], remove: [member1]});
    teamSig = await Storage.retrieve('Team', team);
    verified = await Security.verify(teamSig, {team, member: false}); // Do not check that signer is a current member.
    expect(verified).toBeTruthy();
    expect(verified.protectedHeader.act).toBe(member1); // not member2, who is the current member
    expect(await Security.verify(teamSig, {team})).toBeUndefined(); // because not signed by a current member
  });
  it('stores recovery tags.', async function () {
    let recoveryTag = await Security.create({prompt: 'test'});
    await checkSignedResult('EncryptionKey', recoveryTag);
    await checkSignedResult('KeyRecovery', recoveryTag);
    await Security.destroy(recoveryTag);
    await checkEmptyResult('EncryptionKey', recoveryTag);
    await checkEmptyResult('KeyRecovery', recoveryTag);    
  }, 10e3);
  it('read answer json with proper mime type.', function () {
    // TODO:
  });
  it('write rejects non-json.', function () {
    // TODO:
  });
  it('will not store garbage.', function () {
    // TODO:
  });
  it('rejects storage with bad signature.', function () {
    // TODO:
  });
  it('rejects storage by non-member.', function () {
    // TODO:
  });
  it('removes file stored with empty signed payload.', function () {
    // TODO:
  });
  it('queues write requests in order received.', async function () {
    // TODO!
  });
  it('get provides headers for caching.', async function () {
    // TODO!
  });
  afterAll(async function () {
    await Security.destroy(team);
    await Security.destroy(member1);
    await Security.destroy(member2);
    await checkEmptyResult('EncryptionKey', member1);
    await checkEmptyResult('EncryptionKey', member2);
    await checkEmptyResult('EncryptionKey', team);
    await checkEmptyResult('Team', team);
  });
});
