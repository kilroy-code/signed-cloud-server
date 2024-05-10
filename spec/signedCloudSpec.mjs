// The distributed-security package has unit tests that sets up the package to use
// a simple in-memory storage that is independent of the cloud storage implementation.
// Here, however, we exercise distributed-security and signed-storage as co-dependencies
// of each other:
// - These tests use the default behavior of distributed-security.
// - The default behavior of distributed-security is to use signed-cloud-client.
// - The default behavior of signed-cloud-server is to use distributed-security

import Security from "@kilroy-code/distributed-security";
const Storage = Security.Storage; // Just shorthand.

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
    console.log('test cloud:', await Security.ready);
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
    let recoveryTag = await Security.create({prompt: 'Test password:'});
    await checkSignedResult('EncryptionKey', recoveryTag);
    await checkSignedResult('KeyRecovery', recoveryTag);
    await Security.destroy(recoveryTag);
    await checkEmptyResult('EncryptionKey', recoveryTag);
    await checkEmptyResult('KeyRecovery', recoveryTag);    
  }, 10e3);
  it('defines origin.', function () {
    expect(Storage.origin).toBeTruthy();
  });
  it('read answers json with proper mime type.', async function () {
    let response = await fetch(`${Storage.origin}/db/EncryptionKey/${member1}.json`);
    expect(response.ok).toBeTruthy();
    expect(response.headers.get('Content-Type').startsWith('application/json')).toBeTruthy();
  });
  describe('write', function () {
    let anotherTeam, url, signatureByRemovedMember, signatureByFinalMember, verified;
    beforeAll(async function () {
      anotherTeam = await Security.create(member1, member2),
      url = `${Storage.origin}/db/Team/${anotherTeam}.json`,
      signatureByRemovedMember = await fetch(url).then(response => response.json()),
      await Security.changeMembership({tag: anotherTeam, remove: [member1]});
      let ending = await fetch(url).then(response => response.json());
      verified = await Security.verify(ending, {team: anotherTeam, member: false}); // Won't deep verify because we removed that member.
      signatureByFinalMember = await Security.sign(verified.json, {team: anotherTeam, time: Date.now()});
    });
    it('resaves.', async function () {
      let response = await fetch(url, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(signatureByFinalMember)});
      expect(response.ok).toBeTruthy();
    });
    it('resaves a correctly resigned payload.', async function () {
      let response = await fetch(url, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(signatureByFinalMember)});
      expect(response.ok).toBeTruthy();
    });
    it('write rejects non-json writes.', async function () {
      let response = await fetch(url, {method: 'PUT', headers: {'Content-Type': 'application/text'}, body: JSON.stringify(signatureByFinalMember)});
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(415); // Unsupported Media Type
    });
    it('rejects storage with insufficient signature.', async function () {
      let resigned = await Security.sign(verified.json, member2), // right member, but not sufficiently auditable.
          response = await fetch(url, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(resigned)});
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(403); // Forbidden
    });
    it('rejects storage by non-member.', async function () {
      let response = await fetch(url, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(signatureByRemovedMember)});
      expect(response.ok).toBeFalsy();
      expect(response.status).toBe(403); // Forbidden
    });
    afterAll(async function () {
      await Security.destroy(anotherTeam);
      await checkEmptyResult('Team', anotherTeam);
    });
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
