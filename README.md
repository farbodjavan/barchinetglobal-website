# barchinetglobal-website
Public website for Barchinet Global.

## Membership

The Cloudflare Worker in `membership/` serves the site and its assets. Anonymous access is available in the United States and Canada. Visitors elsewhere can use `/membership` to register or sign in. The approval panel is at `/membership?admin=1` and requires the configured owner's Google sign-in.

From `membership/`, run `npm ci`, `npm test`, and `npx wrangler deploy --dry-run` to verify the package. For production, bind the account's D1 database as `MEMBERS`, apply the included migration, and set `FIREBASE_WEB_API_KEY` and `MEMBERSHIP_OWNER_EMAIL` on the Worker. Enable Email/Password and Google in Firebase Authentication and authorize `barchinetglobal.com` for Google sign-in and email action links.

Keep the Worker in front of every website route. Once the primary domain is serving the Worker, deploy `membership/firebase.json` to the existing Firebase Hosting site to redirect its old public URLs to the primary domain. Firebase's reserved authentication routes must remain available. Review any active Firebase preview channels for alternate copies before verifying the production cutover.
