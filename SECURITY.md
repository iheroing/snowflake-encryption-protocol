# Security Policy and Threat Model

## Supported version

Only the current `main` branch and protocol v1 receive security fixes. This project has not completed an independent security audit and should not be used as a password manager or to transfer high-impact credentials.

## What v1 protects

- A passive database reader sees ciphertext, authenticated non-secret metadata, expiry, and a hash of the revoke token—not plaintext or the fragment secret.
- A passive network observer behind correctly configured HTTPS sees request metadata and ciphertext but not the URL fragment.
- A normal API client cannot destroy a message using its public path ID alone. Redis atomically checks an independent consume-capability hash before returning and deleting the record.
- Under a healthy Redis leader session, concurrent requests have one winner because the capability check, read, and delete share one Lua execution.
- Authenticated encryption detects changes to the protocol version, algorithm, ID, TTL, signature, wrapped content key, IVs, or ciphertext.

## Explicit non-goals

- An operator or compromised origin can replace the JavaScript delivered to a browser and steal future plaintext or fragment secrets. In-browser encryption still trusts the origin.
- The service is private, not anonymous. Infrastructure can observe IP addresses, timing, user agent, request rate, and ciphertext size.
- Once plaintext is displayed, the recipient can screenshot, record, copy, photograph, or otherwise retain it. The 60-second timer only clears the current UI.
- One-time deletion does not prove secure erasure from hardware, transient platform logs, browser memory, network buffers, or provider backups.
- Anyone with the complete share link has the read capability. V1 does not add identity verification or a second password factor.
- A displayed QR code encodes that complete share link, including both URL-fragment capabilities. It is generated locally on explicit request, but screenshots or cameras can copy it; treat it exactly like the link itself.
- The optional keepsake gallery is local to one browser and stores only a versioned visual signature, derived crystal family, origin, and collection time. It is not an account backup and is lost when site data is cleared.
- Availability is not guaranteed. Redis loss, provider failure, rate limiting, or a lost link can make a message unrecoverable.
- Upstash Redis is eventually consistent across replicas. A fragment-carried sync token provides cross-function read-your-writes behavior, but leader failover or a partition can still expose stale state. V1's one-time guarantee is application-level, not a claim of strict linearizability under infrastructure failure.
- A destructive request can succeed at Redis while its HTTP response is lost. Transparent SDK retries are disabled and the UI reports this as an unknown outcome; the recipient may still lose the unread plaintext.

## Operational requirements

- Serve production only over HTTPS and retain the repository CSP and security headers.
- Do not add third-party analytics, session replay, tag managers, CDN scripts, remote fonts, or error capture that records URLs or request bodies.
- Never persist plaintext, ciphertext, fragment capabilities, share URLs, revoke tokens, or server message IDs in the keepsake gallery. Do not automatically import the legacy prototype gallery.
- Keep Upstash and Vercel credentials server-side without a `VITE_` prefix. Use an independent high-entropy rate-limit salt and, where available, an ACL token restricted to the required commands and `snow:*` keys. Rotate credentials after any suspected exposure.
- Do not enable content recovery backups for the temporary Redis dataset.
- Treat a spike in create/consume errors, CSP violations, unexpected outbound requests, or dependency advisories as a security event.

## Reporting a vulnerability

Do not publish exploit details in a public issue. Use the repository's private vulnerability reporting channel if enabled, or contact the repository owner privately and include:

- affected commit/deployment;
- impact and prerequisites;
- minimal reproduction steps;
- whether any real user content was accessed;
- suggested remediation, if known.

Do not test with other people's messages, bypass access controls, degrade the service, or retain any accidentally accessed data.
