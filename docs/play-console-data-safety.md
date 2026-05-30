# Play Console — Data Safety Form (draft)

Use this when completing **App content → Data safety** in [Google Play Console](https://play.google.com/console). Adjust wording to match your final privacy policy.

## Data collected

| Data type | Collected | Shared | Purpose | Optional |
|-----------|-----------|--------|---------|----------|
| Phone number | Yes | No (Firebase Auth only) | Account creation, OTP login | No |
| Name | Yes | With matched users | Profile display | No |
| Email | If provided | No | Account recovery / support | Yes |
| Photos | Yes | With matched users after approval | Profile pictures | No |
| Date of birth | Yes | With matched users | Age verification, matching | No |
| Location (city/state) | Yes | With matched users | Discovery filters | No |
| Religion / caste / community | Yes | With matched users | User-stated preferences | Partially optional |
| In-app messages | Yes | With chat recipient | Chat feature | No |
| Device or other IDs | Yes (Firebase) | Firebase/Google | Auth, push notifications | No |
| App interactions (likes, matches) | Yes | No third-party ads | Core product | No |

## Data handling

- **Encryption in transit:** HTTPS for API; Firebase for auth.
- **Encryption at rest:** MongoDB Atlas; Backblaze B2 for images.
- **Deletion:** Users can delete account in **Settings → Delete Account** (type `DELETE`). Backend hard-deletes user record and associated data per account-deletion flow.
- **No sale of data:** Select **No** for selling user data.
- **No third-party advertising SDKs** in the matrimonial app build (verify before submit).

## Security practices

- Account creation required before most features.
- Rate limiting on auth endpoints.
- Role-based admin access; discovery responses strip admin/premium fields.

## Privacy policy URL

Must match the live in-app link, e.g. `https://<your-domain>/privacy/`.

## Account deletion

Play Console asks how users request deletion:

- **In-app path:** Settings → Delete Account → confirm by typing `DELETE`.
- **Support email (optional backup):** support@shaadimantrana.com (update if different).

## Content rating (IARC)

- Category: **Dating** / social / matrimonial.
- User-generated content: **Yes** (photos, messages).
- Expected rating: often **Mature 17+** — answer questionnaire honestly.

## Pre-submit checklist

- [ ] Privacy policy URL live and matches store listing
- [ ] Data safety answers match actual app behavior
- [ ] Account deletion tested on production/staging build
- [ ] B2 keys rotated if any key appeared in git or docs
- [ ] `HEALTH_CHECK_TOKEN` set on Render for ops endpoints

See also **§5** in [RELEASE_GUIDE.md](../RELEASE_GUIDE.md).
