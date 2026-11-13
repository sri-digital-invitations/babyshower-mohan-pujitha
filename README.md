# SRI Digital Invitations — Baby Shower Demo
## Mohan Sai & Pujitha

A static, mobile-friendly invitation website prepared from the invitation poster and event details supplied in the conversation.

### Included
- Original supplied invitation poster
- English / Tamil language switch
- Countdown to 19 November 2026, 6:00 PM IST
- Event date, time and venue details
- Google Maps location link supplied by the hosts
- WhatsApp RSVP message (opens WhatsApp share/chat selection; no phone number was provided)
- Native share / copy-link action
- Responsive layout and social preview metadata

### Preview locally
Open `index.html` in a browser. For a local web server, run:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

### Publish under the SRI GitHub organisation
Create a new repository under `sri-digital-invitations` named:
`babyshower-mohan-pujitha`

Upload the contents of this folder to the repository root:
```text
index.html
styles.css
script.js
assets/
  mohan-sai-pujitha-babyshower-poster.jpg
  logo.svg
```
Then open **Settings → Pages**:
- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`
- Save

Expected project-site URL:
`https://sri-digital-invitations.github.io/babyshower-mohan-pujitha/`

### Important
- This is a static invitation site. RSVP currently opens WhatsApp with a prefilled message; it does not store responses in a database.
- The Google Maps link is the exact link supplied by the user. Verify it opens the intended venue before sharing widely.
- If you later buy a SRI domain, this invitation can be routed to a subdomain using a hosting platform that supports wildcard subdomains.
- The poster image is included in the package. Confirm the hosts approve public display of their image and event details before publishing.
