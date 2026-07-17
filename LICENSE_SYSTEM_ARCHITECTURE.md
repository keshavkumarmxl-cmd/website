# Digital Product Licensing Architecture

## Frontend

Existing website:

- Shows product preview and pricing.
- Buyer clicks a plan.
- Checkout modal collects buyer name and Gmail/email after payment confirmation.
- Frontend calls `POST /api/purchase`.
- Backend creates user, stores purchase, generates license, sends email.

Production upgrade:

- Replace demo `paymentProvider: "manual"` with Stripe Checkout or Razorpay Checkout.
- Send returned payment/session ID to `/api/purchase`.
- Use only HTTPS URLs.

## Backend

Location:

```text
backend/
```

Technology:

- Node.js
- Express REST API
- SQLite for local development
- JWT admin authentication
- HMAC license hashing
- SMTP email
- Stripe/Razorpay verification adapters
- Rate limiting, Helmet, CORS, Zod validation

## Database Tables

Users:

- `id`
- `name`
- `email`
- `purchase_history`
- `created_at`

Purchases:

- `id`
- `user_id`
- `product_id`
- `payment_provider`
- `payment_id`
- `amount`
- `currency`
- `status`
- `raw_payload`
- `created_at`

Licenses:

- `id`
- `license_hash`
- `license_hint`
- `user_id`
- `status`
- `activation_date`
- `device_id`
- `last_verification`
- `expiry_date`
- `license_type`
- `created_at`

Devices:

- `id`
- `license_id`
- `hardware_fingerprint_hash`
- `activation_timestamp`
- `last_activity`

Activation Attempts:

- `id`
- `email`
- `license_hint`
- `device_fingerprint_hash`
- `ip_address`
- `user_agent`
- `result`
- `reason`
- `created_at`

Extension Versions:

- `id`
- `version`
- `download_path`
- `notes`
- `is_active`
- `created_at`

## License Security

License example:

```text
XXXX-XXXX-XXXX-XXXX
```

Generation:

- Uses Node `crypto.randomInt`.
- Avoids confusing characters.
- Checks DB uniqueness.
- Stores only HMAC-SHA256 hash.
- Shows only last 4 characters in admin search.

Device binding:

- Extension sends hardware fingerprint.
- Server stores SHA-256 fingerprint hash.
- First activation binds license to one device.
- Second device with same license gets:

```json
{
  "status": "failed",
  "reason": "License already activated on another device"
}
```

## API Documentation

### `POST /api/purchase`

Confirms payment, creates user, creates license, emails buyer.

Request:

```json
{
  "name": "Keshav",
  "email": "buyer@gmail.com",
  "productId": "keshav-with-velo",
  "paymentProvider": "manual",
  "paymentId": "manual-payment-id",
  "licenseType": "standard"
}
```

### `POST /api/activate`

Activates a license on a device.

Request:

```json
{
  "email": "buyer@gmail.com",
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "deviceFingerprint": "extension-generated-device-fingerprint"
}
```

### `POST /api/verify-license`

Extension calls on launch and periodically.

Request:

```json
{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "deviceFingerprint": "extension-generated-device-fingerprint"
}
```

Possible responses:

```json
{ "status": "valid" }
{ "status": "invalid" }
{ "status": "blocked" }
{ "status": "expired" }
```

### `POST /api/download`

Allows only purchased users to download extension ZIP.

Request:

```json
{
  "email": "buyer@gmail.com",
  "licenseKey": "XXXX-XXXX-XXXX-XXXX"
}
```

## Admin Dashboard

URL:

```text
http://localhost:4000/admin
```

Features:

- View customers
- Search licenses
- Block/unblock license
- Reset device activation
- View activation attempts
- Generate manual license
- Manage extension versions

## Deployment

1. Deploy backend to Render/Railway/Fly/VPS.
2. Set `.env` secrets.
3. Run:

```bash
npm install
npm run init-db
npm start
```

4. Put backend behind HTTPS.
5. Upload extension ZIP to `backend/storage/extensions/keshav-with-velo.zip`.
6. Configure SMTP.
7. Configure Stripe/Razorpay keys and webhooks.
8. Set frontend `window.LICENSING_API_BASE_URL` or edit `script.js` API URL.

## Production Hardening Checklist

- Use Postgres for production scale.
- Enable backups.
- Use Cloudflare/WAF.
- Log suspicious IP activity.
- Rotate admin password.
- Rotate JWT and license hash secrets if leaked.
- Never store plain license keys.
- Verify payments server-side only.
- Keep extension ZIP outside public web root.
