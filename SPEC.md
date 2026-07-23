# Snowflake Whisper Protocol v1

Status: implemented, versioned, not independently audited.

This document defines the interoperable envelope and one-time delivery behavior used by the web client and API. Changes to field meaning, canonical AAD, key derivation, or endpoint semantics require a new protocol version.

## 1. Encoding

- Text is UTF-8.
- Binary fields use unpadded RFC 4648 base64url.
- IDs are 16 random bytes encoded as 22 base64url characters.
- Fragment secrets, consume tokens, and delete tokens are 32 random bytes encoded as 43 base64url characters.
- JSON numbers are used only for integers within JavaScript's safe integer range.

## 2. Envelope

```ts
interface OneTimeWhisperEnvelope {
  version: 1;
  algorithm: 'A256GCM-HKDF-SHA256';
  id: string;          // 16 random bytes, base64url
  ttlSeconds: 3600 | 86400 | 604800;
  signature: string;   // UTF-8, at most 256 bytes; non-secret visual seed
  hkdfSalt: string;    // 16 random bytes
  wrapIv: string;      // 12 random bytes
  wrappedKey: string;  // 32-byte CEK + 16-byte GCM tag
  contentIv: string;   // 12 random bytes
  ciphertext: string;  // UTF-8 message ciphertext + 16-byte GCM tag
}
```

The plaintext is 1–4096 UTF-8 bytes. The current product UI limits it further to 500 characters.

## 3. Canonical AAD

Both AES-GCM operations use the UTF-8 bytes of this JSON, with keys in exactly this order and no extra whitespace:

```json
{"version":1,"algorithm":"A256GCM-HKDF-SHA256","id":"<id>","ttlSeconds":86400,"signature":"<signature>"}
```

JSON string escaping follows `JSON.stringify`. Changing any authenticated field invalidates both the wrapped key and the content ciphertext.

## 4. Sealing

1. Generate independent random values: 32-byte CEK, 32-byte fragment secret, 32-byte consume token, 32-byte delete token, 16-byte HKDF salt, two 12-byte AES-GCM IVs, and a 16-byte ID.
2. Encrypt the UTF-8 plaintext with AES-256-GCM under the CEK, `contentIv`, the canonical AAD, and a 128-bit tag.
3. Import the fragment secret as HKDF key material.
4. Derive a 256-bit AES-GCM KEK with HKDF-SHA-256:
   - salt: `hkdfSalt`
   - info: UTF-8 `snow-whisper:v1:kek:<id>`
5. Encrypt the raw 32-byte CEK with AES-256-GCM under the KEK, `wrapIv`, the same AAD, and a 128-bit tag.
6. Upload the envelope, `base64url(SHA-256(consumeToken))`, and `base64url(SHA-256(deleteToken))`. Never upload the fragment secret or either raw token during creation.

The share URL is:

```text
https://origin.example/snowflake/s/<id>#k=<fragment-secret>&c=<consume-token>&r=<sync-token>
```

The URL fragment holds two capabilities and an optional consistency checkpoint. `k` decrypts but is never sent to the server. `c` authorizes the destructive consume request but cannot decrypt the ciphertext. `r` is the non-secret Upstash read-your-writes sync token returned after creation. None may enter query parameters, analytics, or referrers; only `c` and `r` are sent in the destructive API body.

When the sender explicitly requests a cross-device QR code, the browser encodes this complete URL locally. The QR image is not uploaded and is security-equivalent to the link: it must preserve the fragment byte-for-byte and must not be displayed by default.

## 5. Status and local preflight

`POST /snowflake/api/snow/status` is non-consuming. The public mount forwards this path to the deployment's `/api/snow/status` function. A sealed response includes the envelope without `contentIv` and `ciphertext`. The client attempts to unwrap the CEK locally. If that fails, it must not call consume; a corrupted or incomplete link therefore does not destroy the message.

This preflight allows offline guessing by anyone who already possesses the high-entropy URL secret. V1 has no human password, so the secret has 256 bits of random entropy and is not guessable in practice.

## 6. Atomic consume

`POST /snowflake/api/snow/consume` hashes the supplied consume token, then runs one Redis Lua operation that loads `snow:v1:<id>`, checks absolute expiry, compares the stored verifier, and only on a match deletes and returns the record. The public mount forwards this path to the deployment's `/api/snow/consume` function. Under a healthy Redis leader session, one authorized concurrent request wins; an ID-only or wrong-token request cannot delete it. Later requests return `410 WHISPER_GONE`.

The Upstash SDK is configured with zero network retries for destructive operations. If Redis may have consumed the record but the HTTP response is unavailable or unreadable, the client reports an unknown outcome instead of claiming the message is still sealed. Upstash replication is eventually consistent; the `r` checkpoint prevents ordinary cross-function stale reads, but V1 does not claim strict linearizability during leader failover or network partitions.

The success response is `Cache-Control: no-store` and contains the full encrypted envelope. The browser unwraps the CEK and decrypts the content locally. The server never receives the fragment secret or plaintext.

The API intentionally does not distinguish missing, expired, revoked, and already-consumed records to clients.

## 7. API

All operations use JSON, require `version: 1`, reject request bodies above 8 KiB, and return `Cache-Control: no-store` on normal API handling.

| Method and path | Request | Success |
| --- | --- | --- |
| `POST /snowflake/api/snow/create` | `{version,envelope,consumeTokenHash,deleteTokenHash}` | `201 {version,id,expiresAt,consistencyToken?}` |
| `POST /snowflake/api/snow/status` | `{version,id,consistencyToken?}` | `200` sealed/gone status with refreshed checkpoint |
| `POST /snowflake/api/snow/consume` | `{version,id,consumeToken,consistencyToken?}` + `X-Snow-Intent: reveal` | `200 {version,status:"consumed",expiresAt,envelope}` |
| `POST` or `DELETE /snowflake/api/snow/delete` | `{version,id,deleteToken}` + `X-Snow-Intent: revoke` | `200 {version,status:"deleted"|"gone"}` |

Stable error codes include `INVALID_BODY`, `BODY_TOO_LARGE`, `INVALID_ID`, `INVALID_ENVELOPE`, `UNSUPPORTED_VERSION`, `ID_CONFLICT`, `INVALID_CONSUME_TOKEN`, `INVALID_DELETE_TOKEN`, `WHISPER_GONE`, `RATE_LIMITED`, and `STORAGE_UNAVAILABLE`.

## 8. Required invariants

- IDs, secrets, tokens, keys, salts, and IVs come from Web Crypto CSPRNG output.
- AES-GCM IVs never repeat for the same key.
- The status operation never returns content ciphertext and never consumes a record.
- A wrong fragment never triggers consume.
- An ID-only or wrong consume capability never deletes a record.
- In one healthy storage session, twenty-five simultaneous consumes yield one `200` and twenty-four `410` responses.
- Server-side logs do not include request bodies, fragment secrets, delete tokens, or plaintext.
- Protocol changes are versioned; old fields are not silently reinterpreted.

## 9. Frozen v1 vector

The frozen vector uses sequential byte fixtures solely for interoperability testing. Production entropy must always come from a CSPRNG.
The machine-readable fixture is committed at `protocol/vectors/v1.json`; CI independently regenerates HKDF, wrapped-key and content ciphertext bytes with `node:crypto`, then decrypts them.

```json
{
  "plaintext": "Snow falls once.",
  "fragmentSecret": "ICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj8",
  "aad": "{\"version\":1,\"algorithm\":\"A256GCM-HKDF-SHA256\",\"id\":\"AAECAwQFBgcICQoLDA0ODw\",\"ttlSeconds\":86400,\"signature\":\"vector-v1\"}",
  "envelope": {
    "version": 1,
    "algorithm": "A256GCM-HKDF-SHA256",
    "id": "AAECAwQFBgcICQoLDA0ODw",
    "ttlSeconds": 86400,
    "signature": "vector-v1",
    "hkdfSalt": "YGFiY2RlZmdoaWprbG1ubw",
    "wrapIv": "cHFyc3R1dnd4eXp7",
    "wrappedKey": "SY5oHw-DVHgGkrI4p9g9FcwpkCkqFEQ-xdaPUCyN8siyTTDBn8kHYcS1bQmw86oE",
    "contentIv": "gIGCg4SFhoeIiYqL",
    "ciphertext": "fjDRsAISS-8EGbBHHMHwDNxUxhbVPpz6qwteWhzzYNc"
  }
}
```
