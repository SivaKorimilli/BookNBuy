# BookNBuy — Complete Setup & Deployment Guide
# Next.js + Firebase + Amadeus + TMDB + Razorpay + Stripe + PayPal

===========================================================================
## STEP 1: PROJECT SETUP
===========================================================================

# 1A. Create Next.js project using our files
npx create-next-app@latest booknbuy --typescript --app --no-tailwind
cd booknbuy

# 1B. Install all dependencies
npm install firebase razorpay @stripe/stripe-js stripe @paypal/react-paypal-js \
  axios swr zustand react-hot-toast date-fns clsx

# 1C. Copy all files from this package into your project
cp -r booknbuy-nextjs/* booknbuy/

# 1D. Setup environment variables
cp .env.example .env.local
# Now edit .env.local with your real API keys (see Step 2)


===========================================================================
## STEP 2: GET YOUR API KEYS (Step-by-step)
===========================================================================

─── A. FIREBASE (Authentication — FREE) ───────────────────────────────────

1. Go to https://console.firebase.google.com
2. Click "Add Project" → Name it "booknbuy" → Continue
3. In your project: go to "Authentication" → "Get Started"
4. Enable these Sign-in methods:
   a. Email/Password → toggle ON → check "Email link (passwordless)" → Save
   b. Phone → toggle ON → Save (requires billing enabled for SMS)
5. Go to Project Settings (gear icon) → "Your apps" → "</>  Web"
6. Register app → copy the firebaseConfig object
7. Paste values into your .env.local:
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=booknbuy.firebaseapp.com
   etc.

⚠️  IMPORTANT for Email Magic Link:
- In Firebase Console → Authentication → Settings → Authorized domains
- Add your domain: localhost, and your production domain

⚠️  IMPORTANT for Phone OTP:
- Firebase phone auth requires billing (Blaze plan). First 10,000 verifications/month FREE
- Go to Firebase Console → Upgrade to Blaze (you won't be charged under free tier)
- Add test phone numbers in Authentication → Phone → Test phone numbers (for dev)


─── B. AMADEUS (Flights — FREE sandbox, paid production) ───────────────────

1. Go to https://developers.amadeus.com
2. Sign Up → Verify email
3. Go to "My Apps" → "Create New App"
4. App name: "BookNBuy" → select "Flight Search" APIs
5. You'll get: Client ID and Client Secret
6. Paste into .env.local:
   AMADEUS_CLIENT_ID=xxxxx
   AMADEUS_CLIENT_SECRET=xxxxx
   AMADEUS_BASE_URL=https://test.api.amadeus.com

📦 Sandbox gives you: 
   - Real flight data (test environment)
   - 2000 free API calls/month
   - No credit card needed

🚀 Production:
   - Apply for production access in Amadeus Dashboard
   - Change AMADEUS_BASE_URL to https://api.amadeus.com
   - Pricing: Pay-per-use (starts ~$0.001/call)


─── C. TMDB (Movies — COMPLETELY FREE) ────────────────────────────────────

1. Go to https://www.themoviedb.org/signup
2. Create a free account → Verify email
3. Go to: https://www.themoviedb.org/settings/api
4. Click "Create" → Developer → Fill the form → Submit
5. Copy your "API Key (v3 auth)" — it's on the same page
6. Paste into .env.local:
   TMDB_API_KEY=your_32_char_key

✅ Completely free. No limits for reasonable use. 1M+ movies & shows.


─── D. TRAINMAN API (Trains/IRCTC — PAID) ──────────────────────────────────

1. Go to https://www.trainman.in/api
2. Fill out the contact form / apply for API access
3. Pricing starts at ₹999/month
4. You'll receive API key via email
5. Paste:
   TRAINMAN_API_KEY=your_key
   TRAINMAN_BASE_URL=https://api.trainman.in/v1

💡 Alternative (free for low volume):
   - RailYatri API: https://www.railyatri.in/api
   - Indian Rail API (unofficial): https://indianrailapi.com

⚠️  Note: IRCTC does NOT have a public API. Trainman/RailYatri are licensed
    aggregators that have a legal arrangement with Indian Railways.


─── E. REDBUS API (Buses — PARTNER PROGRAM) ────────────────────────────────

1. Go to https://www.redbus.in/info/affiliates
2. Apply as an affiliate/API partner
3. Requires business verification
4. Timeline: 1-2 weeks for approval

💡 Alternative while waiting:
   - AbhiBus Partner API: https://www.abhibus.com/bus-api
   - Use Yatri Sathi for India buses

✅ Our code gracefully falls back to MOCK DATA if API key not set.


─── F. AMAZON PA-API (Shopping) ────────────────────────────────────────────

1. Sign up for Amazon Associates: https://affiliate-program.amazon.in
   (Indian) or https://affiliate-program.amazon.com (US)
2. Get approved (usually instant for new accounts)
3. Go to: https://affiliate-program.amazon.in/assoc_credentials/home
4. Click "Add credentials" → Create Access + Secret Key
5. Your Associate/Partner Tag is visible in your Associates account
6. Paste:
   AMAZON_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
   AMAZON_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLE
   AMAZON_PARTNER_TAG=yourtag-21

⚠️  Requirements: 3 qualifying sales within 180 days to maintain access


─── G. RAZORPAY (India Payments — FREE test, 2% live) ──────────────────────

1. Go to https://dashboard.razorpay.com/signup
2. Complete KYC (takes 1-2 days for business verification)
3. Go to Settings → API Keys → Generate Key
4. Copy Key ID and Key Secret
5. Paste:
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=xxxx

   For production (after KYC):
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxx

💰 Fees: 2% per transaction (no monthly fee). UPI is free for users.


─── H. STRIPE (Global Payments — FREE test, 2.9% + 30¢ live) ──────────────

1. Go to https://dashboard.stripe.com/register
2. Create account → Dashboard opens automatically (no KYC needed for test)
3. Click "Developers" → "API Keys"
4. Copy Publishable key and Secret key
5. For webhooks: Stripe Dashboard → Webhooks → Add endpoint
   URL: https://yourdomain.com/api/payments/stripe/webhook
   Events: payment_intent.succeeded, payment_intent.payment_failed
6. Paste:
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx

Local webhook testing:
   npm install -g stripe
   stripe login
   stripe listen --forward-to localhost:3000/api/payments/stripe/webhook


─── I. PAYPAL (Global — FREE test, 3.49% live) ─────────────────────────────

1. Go to https://developer.paypal.com
2. Log in with your PayPal account
3. Go to "Apps & Credentials" → "Create App"
4. App Name: BookNBuy → Merchant → Create
5. Copy Client ID and Secret Key
6. Paste:
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxxxx
   PAYPAL_CLIENT_SECRET=xxxxx
   PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

   For production:
   PAYPAL_BASE_URL=https://api-m.paypal.com


===========================================================================
## STEP 3: FIREBASE SETUP FOR AUTH (Firebase Console)
===========================================================================

3A. In Firebase Console → Authentication → Settings:
    - Add Authorized Domains: localhost, yourdomain.com

3B. For Email Link (magic link) to work, edit your app's sign-in page to handle
    the redirect. Add this to your app/auth/verify/page.jsx:

    import { verifyEmailOTP } from "../../../lib/firebase";
    useEffect(() => {
      if (typeof window !== "undefined") {
        verifyEmailOTP(window.location.href)
          .then(user => router.push("/dashboard"))
          .catch(err => console.error(err));
      }
    }, []);


===========================================================================
## STEP 4: RUN LOCALLY
===========================================================================

# Install deps
npm install

# Start development server
npm run dev

# Open http://localhost:3000
# APIs with mock data will work immediately (TMDB, trains, buses)
# Add real keys in .env.local for live data


===========================================================================
## STEP 5: DEPLOY TO VERCEL (Recommended — FREE tier)
===========================================================================

5A. Push code to GitHub:
    git init && git add . && git commit -m "BookNBuy initial commit"
    git remote add origin https://github.com/yourusername/booknbuy
    git push -u origin main

5B. Deploy to Vercel:
    npm install -g vercel
    vercel

5C. Add environment variables in Vercel Dashboard:
    - Go to your project → Settings → Environment Variables
    - Add all variables from .env.local one by one
    - Deploy again: vercel --prod

5D. Configure custom domain:
    Vercel Dashboard → Domains → Add your domain
    Update DNS records as instructed


===========================================================================
## STEP 6: PRODUCTION CHECKLIST
===========================================================================

Before going live, complete these:

[ ] Firebase: Enable billing (Blaze plan) for Phone Auth SMS
[ ] Firebase: Add your production domain to Authorized Domains
[ ] Amadeus: Apply for production API access
[ ] Razorpay: Complete KYC and switch to rzp_live_ keys
[ ] Stripe: Activate your Stripe account, switch to pk_live_ / sk_live_
[ ] PayPal: Switch PAYPAL_BASE_URL to api-m.paypal.com
[ ] Add database (Firestore or PostgreSQL via Supabase) for bookings storage
[ ] Set up Stripe webhook endpoint in Stripe Dashboard
[ ] Enable HTTPS (automatic on Vercel)
[ ] Set up error monitoring (Sentry: https://sentry.io)
[ ] Set up analytics (Vercel Analytics or Google Analytics)


===========================================================================
## STEP 7: DATABASE SETUP (Firestore — Recommended)
===========================================================================

For storing bookings, user data, and wallet:

1. Firebase Console → Firestore Database → Create database
2. Start in test mode (update rules before production)
3. Collections to create:
   - users/{userId} → profile, wallet, preferences
   - bookings/{bookingId} → type, details, payment, status
   - transactions/{txId} → amount, type, timestamp, status

Firestore Security Rules (update before production):
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /bookings/{bookingId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}


===========================================================================
## QUICK REFERENCE — API STATUS
===========================================================================

| Service      | Provider       | Cost        | Approval Time | Mock Data |
|--------------|----------------|-------------|---------------|-----------|
| Flights      | Amadeus        | Free sandbox| Instant       | No        |
| Movies       | TMDB           | FREE        | Instant       | No        |
| Trains       | Trainman       | ₹999/mo     | 1-3 days      | ✅ Yes    |
| Buses        | RedBus         | Partner     | 1-2 weeks     | ✅ Yes    |
| Shopping     | Amazon PA-API  | FREE        | Instant       | ✅ Yes    |
| Auth         | Firebase       | Free tier   | Instant       | No        |
| India Pay    | Razorpay       | 2% txn fee  | 1-2 days KYC  | Test keys |
| Global Pay   | Stripe         | 2.9%+30¢    | Instant       | Test keys |
| PayPal       | PayPal         | 3.49%       | Instant       | Sandbox   |


===========================================================================
## SUPPORT & RESOURCES
===========================================================================

- Amadeus Dev Docs:    https://developers.amadeus.com/self-service
- TMDB API Docs:       https://developer.themoviedb.org/docs
- Firebase Auth:       https://firebase.google.com/docs/auth
- Razorpay Docs:       https://razorpay.com/docs/
- Stripe Docs:         https://stripe.com/docs
- PayPal Dev:          https://developer.paypal.com/docs
- Vercel Deploy:       https://vercel.com/docs
- Next.js Docs:        https://nextjs.org/docs

Built with ❤️ for BookNBuy — Founder: Sivakumar Korimilli
