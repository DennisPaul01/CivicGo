# CiviTm Mobile

Expo wrapper pentru aplicatia web CivicGo. Pentru demo rapid, ruleaza frontendul React si deschide acest proiect in Expo Go.

## Start local

1. Porneste web app-ul pe LAN:

```bash
npm run dev:frontend:lan
```

Daca vrei si API live pe telefon, porneste backendul pe LAN si seteaza in `frontend/.env.local`:

```bash
npm run dev:backend:lan
```

```txt
VITE_API_URL=http://192.168.1.20:5051
```

2. Configureaza URL-ul folosit de WebView:

```bash
cp .env.example .env
```

In `.env`, inlocuieste IP-ul cu adresa laptopului din aceeasi retea Wi-Fi, de exemplu:

```txt
EXPO_PUBLIC_CIVICGO_URL=http://192.168.1.20:5173
```

3. Porneste Expo:

```bash
npm run start
```

Scaneaza QR code-ul cu Expo Go.

## Hosted demo

Pentru Vercel, Netlify sau alt host HTTPS, seteaza:

```txt
EXPO_PUBLIC_CIVICGO_URL=https://app-ta.ro
```

WebView-ul pastreaza JavaScript, DOM storage si cookies activate pentru Supabase Auth si flow-ul map-first.
