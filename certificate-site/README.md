# LC MUN Certificate Studio

Bulk certificate generation and delivery workspace for LC MUN.

## Current workflow

1. Upload Excel/CSV with Name, Committee, Portfolio and Email.
2. Upload a PNG/JPG certificate template.
3. Set event, edition and certificate prefix.
4. Sign IDs & QR. The server creates an HMAC-signed certificate token.
5. Generate a ZIP containing individualized PDF certificates.
6. Send all certificates through the bulk delivery action.
7. Each QR opens /verify.html?token=... and is authenticated server-side.

## Production environment variables

Set these in Vercel:

- CERT_SIGNING_SECRET — already provisioned for this project.
- RESEND_API_KEY — Resend API key used only by the server-side delivery function.
- MAIL_FROM — verified sender address, for example LC MUN <certificates@yourdomain.com>.

The frontend never receives the signing secret or Resend API key.

## Delivery behavior

The bulk sender sends one personalized email per delegate. The delegate is placed in BCC, while the sender address is used as the visible recipient. This keeps recipient addresses private and ensures each delegate receives only their own certificate attachment.

## Verification security

Certificate data is embedded in a signed token. The public verification endpoint checks the HMAC signature before displaying the certificate. Changing the name, committee, portfolio, event or certificate ID invalidates the token.

## Important

The browser generates the PDFs from the uploaded visual template. The issuing and verification APIs are server-side Vercel Functions.