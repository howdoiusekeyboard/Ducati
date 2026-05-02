# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in Ducati, please report it privately. **Do not file a public issue.**

Email: **Kush@mountmerugroup.com**

Include:

- A description of the vulnerability
- Steps to reproduce
- Affected versions / commits
- Potential impact (data exposure, account takeover, denial of service, etc.)
- Any proof-of-concept code or screenshots that help confirm the issue

You will receive an acknowledgement within 72 hours. Initial assessment within 7 days.

## Scope

In scope:

- Authentication and session handling (Firebase Auth integration)
- API routes (`/api/chat`, `/api/realtime/token`)
- Firestore security rules (`firestore.rules`)
- Storage rules (`storage.rules`)
- Client-side data exposure
- OpenAI key handling and ephemeral-token issuance
- Any unintended data leak between users

Out of scope:

- Vulnerabilities in third-party dependencies that have already been disclosed upstream (file an issue or PR to bump the dep instead)
- Self-XSS that requires the victim to paste attacker-controlled content into their own DevTools console
- Issues that require physical access to a victim's device
- Theoretical attacks without a demonstrable impact path

## Disclosure

Once a fix has shipped to production, the reporter is credited in the release notes (with permission) and the vulnerability is described publicly. Reporters who prefer anonymity will be credited as "anonymous researcher" or not at all, per their preference.

## Known operational considerations

- This project depends on the OpenAI API and Firebase. Outages or vulnerabilities in those services are reported through their respective channels, not here.
- API keys must never be committed. `.env.local` is gitignored; check before pushing.
