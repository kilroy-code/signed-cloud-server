# Signed Cloud Server

Basic cloud-native storage in which contents are cryptographically signed, using distributed-storage as a co-dependency.

[ki1r0y](https://github.com/kilroy-code/ki1r0y) [distributed-security](https://github.com/kilroy-code/distributed-security) securely stores public keys and encrypted private keys in the cloud. This package provides that cloud.

Requires NodeJS version 20 or higher.

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

An [in-browser example](https://github.com/kilroy-code/distributed-security/blob/main/hello-world.html) is running publically at [**https://ki1r0y.com/security-hello-world.html**](https://ki1r0y.com/security-hello-world.html), and you can be run your locally at http://localhost:59693/@ki1r0y/distributed-security/hello-world.html.


To include as middleware within another express-like server, see [app.mjs](./app.mjs).

---
## Principles

1. Data is accessed as a _tag_ string relative to a _collection_ string.
2. Data can be read from a `(tag, collection)`, or written to one. At scale, most operations are read, rather than write.
3. Data in a given _collection_ can be mutable or immutable. Most collections are immutable. 
4. A _tag_ is globally unique, even across different _collections_. The tag of immutable data is the hash of the contents, and for mutable data the tag is a GUID.
5. The default implementation defines six collections:
   - `media`: any mime type as immutable data.
   - `thing`: any immutable object.
   - `place`: a mutable mapping of timestamps to the specific immutable `thing` at that time. (E.g., The identity of identity of "Theseus' Ship" never changes, even as it changes over time.)
   - `EncryptionKey`: Used by [Distributed Security](https://github.com/kilroy-code/distributed-security#readme) to make public encryption keys securely available to all clients.
   - `Team`: Used by Distributed Security to make private keys securely available to the members of the owning team.

The implementation is:

### Simple

6. Cloud-native: designed to store data directly in "the cloud", even if that "cloud" is running locally.
7. The enumerated principles here are all there is.

Thus:
- The data is available to any device that can reach that cloud, without any separate and confusing "synchronization". Even if an application doesn't initially need to share data over multiple devices, it can later do without changing the application.
- All media can be stored, of any public format.
- Versioned mutable data does not require any major new mechanisms. It is stored in two parts: a mutable mapping of timestamps to tags, and the immutable data of each version as stored under the given tag. There are two optimizations:
  - The server implementation of `read(someMutableCollection, guid, timestamp)` can resolve the mapping lookup on the server so that the client does not have to make two network requests.
  - In any write, the client can prune the history to keep things simpler for the user and to prompote garbage collection.

### Safe

8. Private content is encrypted by the storing client before upload, and decrypted by the receiving client after download. Rather than re-encrypting content for different audiences, private content is encrypted (as a [JWE](https://datatracker.ietf.org/doc/html/rfc7516) using [Distributed Security](https://github.com/kilroy-code/distributed-security#readme)) just once for an audience _team_, whose members can be changed without changing the encryption key. The mime type of the payload is specified as the JWE "content type" header. (When encryption is used, the JWE is "inside" the JWS "envelope".)
9. Immutable data cannot be rewritten. (But see [Structured](#structured), below.)
10. In the default implemtation:
    - Content in the `media` collection is only accepted for writing in association with additional non-media metadata content with the same _tag_ in another immutable _collection_. (In the default implementation, this second collection is called `thing`
    - All non-media content, whether mutable or immutable, is only accepted for writing when signed by the client before storing (as a [JWS](https://www.rfc-editor.org/rfc/rfc7515) using [Distributed Security](https://github.com/kilroy-code/distributed-security#readme)), specifying both the owning _team_, and the individual author, and the timestamp. The server validates the signature 
11. The public keys (for encryption and for verficiation) are publically available through the cloud itself. (See [Distributed Security](https://github.com/kilroy-code/distributed-security/blob/main/docs/implementation.md#inside-the-vault).)

Thus:

- While ordinary media files can be consumed in their normal way, their integrity is guaranteed by their hash, and they are alway associated with signed metadata content.
- Any client can verify that signed content has not been altered, and the pseudonymous author can be non-repudiably identified. It is up to the application whether the human behind a given public key is identified.
- Any client can encrypt for a specific audience, even if not a member of the recipient team.
- No one can read private data, including the operators or anyone who gains access to the encrypted data at rest or in transit, because it is end-to-end encrypted.
- An application can make it easy to "undo" by going back through previous versions -- even across sessions and across devices -- thus shielding the user from mistakes.


### Speedy

- typical transfer speeds MB/s:  HDD 30-150; SSD 200-3,500; Network 125-12,500 for "Gb Internet"



### Scalable

speediness reduces load
immutable and scalable can be hosted separately by different mechanisms based on collection type
partition by tag, dht
realtime garbage collection, with pluggable observers (e.g., for search-indexing)


These principles allow systems to be built on it that are further:

### Structured
separate media
part-whole
take-down click-through

### Social
(optionally) separate owner, author, audience
cloud native data is available to OTHER applications that share the same (potentially global) cloud

### Searchable
crawlable - iff you can crawl the collections, which pluggable observer can maintain
(optionally) metdata (title, description, ...) is separate from media content (where the latter may be encrypted to a specific audience)

---
## Behavior

### Glossary

- canonicalized JSON: JSON that is serialized in a standard way: 1) Values that were not specifically assigned are removed (i.e., if they were computed based on other data). 2) The keys appear in alphabetical order. 3) Extra whitespace is removed. For a given Javascript class definition, it's canonical JSON serialization will always have the same hash.
- content-addressable: The tags of a content-addressable collection are the hashes of the payloads as they appears in the resource. For example, the strings "I love you.", "I love you!", and "i love you" are all different content with a different hash code, and therefore a different tag. A property of content-addressable collections is that any errors or changes to the payload are self-evident: the client can re-hash the payload and see if it matches the tag. If a collection is not content-addressable, it the tag might be a an arbitrary Globally Unique Identifier (GUID), or the tag might be the same as in another collection.
- garbage-collection: a process that crawls the storage space starting from a list of users, keeping anything that those users have (recursively) stored, and removing anything that is not so referenced.
- JWE: A standardized self-documenting encryption format for use in "Javascript (or JSON) Web Encryption"
- JWS: A standardized self-documenting signature format for use in "Javascript (or JSON) Web Signatures".
- mutable: The payload of mutable collections can change over time. By contrast an immutable collection cannot be written to a second time.

### Examples

We represent media directly, in whatever format it comes. Media files generally do not have attribution data (although https://c2pa.org is trying to change that). 
- We store the media in a the immutable, content-addressable "media" collection. Private media can be encrypted and stored as the payload of a JWE.
- We store metadata assertions about such files separately, in the immutable, content-addressable "thing" collection. The format of "things" is as a canonicalized JSON payload that has been signed and stored as a JWS.
For example, a thing referencing some media might include information about the media's title and description. This canonicalized JSON is then signed with additional assertions about the owner, the member of the owning team that saved it, if different from the owner itself, the timestamp it was saved, and the antecedent thing (if any) that was editied to produce the new result. 

Note that several different things with different names can reference the same naked media. The system does not make any claims about who writefull created or owns the media, as there is no way to know the history of the media file before it came into our system. However, each thing that references it is a signed, non-repudiable assertion by the user that stores it that they have the legal right to use that media in some context.

Because media is immutable (and identified by content hash), only the first write of any media file is meaningful. Any changes to the bits in the media would save under a different tag, and since no ownership is implied by the media file itself, there nothing to be gained by re-saving it. Similarly for things.

Because our system performs garbage-collection, a media file with no thing pointing to it will eventually be removed. 

For example, suppose you create a 1024x1024 .png that is entirely green. If you are the first person to save it, you can do so. If someone has beaten you to it, it will already be there, and your request to save will be ignored. Similarly, you can save a thing with payload {media:"--hash-of-green-png--",title:"green"} if you sign it, asserting your rights. Maybe someone beats you to it, and they will be known as the author of green. In that case, you might instead successfull save andy of 
- {media:"--hash-of-green-png--",title:"pink"},
- {description:"fancy",media:"--hash-of-green-png--",title:"green"}, or 
- {antecedent:"--hash-of-earliest-green-thing--",media:"--hash-of-green-png--",title:"pink"}.
You could also change one pixel to pink and save the png, and then save a signed thing as, perhaps, {antecedent:"--hash-of-earliest-green-thing--",media:"--hash-of-almost-all-green-png--",title:"pink"}, but you would not be able to save it as {media:"--hash-of-green-png--",title:"green"} because that thing already exists.

(There is some additional behavior regarding legal claims.)

Notice that the green media file can be cached and used from cache in whatever context it appears. The various things can be cached as well, but they are tiny. (FIXME/CHECKME: Even with a signture, they are typically less than a single network packet.)



