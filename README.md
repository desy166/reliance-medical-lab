# React + Vite

## Admin login configuration

The API reads admin credentials from a `.env` file in the project root. Copy
`.env.example` to `.env`, then set:

- `ADMIN_USERNAME` to your chosen admin username.
- `ADMIN_PASSWORD_HASH` to a bcrypt hash of your chosen password. Do not put
	the plain-text password in this setting.
- `JWT_SECRET` to a long, random secret used to sign login tokens.

The `.env` file is ignored by Git. Restart the API after changing it with
`npm run server` or `npm run server-dev`.

## Patient report approval workflow

- Register patients from `/admin`. The API assigns a patient ID and a one-time
	PIN; provide both securely to the patient. The PIN hash is stored, not the PIN.
- Secretaries upload PDF reports against a registered patient. Uploads remain
	`Pending Approval` and are not visible in the patient portal.
- Scientists sign in with `SCIENTIST_USERNAME` and
	`SCIENTIST_PASSWORD_HASH`, review the PDF, then approve or reject it. A reason
	is required for rejection.
- Secretaries can find uploaded reports under `Uploaded Reports`, read rejection
	notes, open reports for printing, and upload a corrected PDF as a new pending
	report.
- Patients sign in at `/patient` using their patient ID and PIN. The portal lists
	and downloads only reports with `Approved` status.

Set separate `SECRETARY_USERNAME`, `SECRETARY_PASSWORD_HASH`,
`SCIENTIST_USERNAME`, and `SCIENTIST_PASSWORD_HASH` values in `.env` for staff
accounts. Keep the existing `ADMIN_*` values for the administrator account.
Generate a bcrypt hash using Node:

```powershell
node --input-type=module -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash('ReplaceWithYourPassword', 12))"
```

This JSON-file implementation is intended for local workflow development. Before
using real patient data in a deployed service, use a properly secured database,
HTTPS, backups, access auditing, and a deployment that meets applicable medical
privacy requirements.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
