# BusGo frontend

React + Vite + Tailwind. Dark "night highway" look (midnight blue with headlight amber).

## Chalane ka tareeka

```
npm install
cp .env.example .env      # Windows: copy .env.example .env
```
`.env` me `VITE_BACKEND_URL` apne backend ke port pe set karo (jo `PORT` tumhare backend me hai).

```
npm run dev               # http://localhost:5173
```
Backend aur Redis pehle se chal rahe hone chahiye. Dev me `/api` aur `/socket.io` vite proxy se backend ko jate hain, isliye CORS aur cookie ka koi jhanjhat nahi.

## Pages

| Route | Kaun | Kya |
|---|---|---|
| `/` | sab | search (from, to, date) |
| `/search` | sab | trips list (ticket style) |
| `/trip/:id` | sab, book karne ko USER | live seat map, 5 min hold, Razorpay checkout |
| `/login`, `/signup` | sab | OTP se signup |
| `/bookings` | USER | upcoming, pay now, cancel (refund dikhata hai) |
| `/operator/signup` | sab | operator application |
| `/operator` | OPERATOR | documents (PAN, GST), buses (+RC), trips |

## Backend se kya chahiye
- `index.js` me `cors({ origin: CLIENT_URL, credentials: true })` aur socket server (already hai).
- Demo mode: `POST /auth/send-otp` agar response me `otp` bheje to frontend wahi OTP bhar deta hai.
- Production (alag domain par deploy): backend ki refresh cookie `sameSite: "none", secure: true` honi chahiye, aur `.env` me `VITE_API_URL=https://tumhara-backend`.

## Folder
```
src/lib        api client, razorpay, socket, helpers
src/context    auth, toast
src/components seat map, ticket pieces, modal
src/pages      customer pages, pages/operator
```
