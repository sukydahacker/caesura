# Caesura Go-Live Guide (10 Days)

You don't need to write code. Two kinds of steps below: **"You do"** (accounts, business info, clicking buttons on other companies' websites — only you can do these) and **"Tell Claude Code"** (paste the exact sentence given and let it do the technical work).

## Step 0: Install Claude Code (do this first, once)

1. Open Terminal on your Mac (Spotlight search → type "Terminal" → Enter).
2. Go to claude.com/product/claude-code and follow the install instructions for Mac (it's a single command you paste into Terminal).
3. Once installed, in Terminal type `cd ~/caesura` (or wherever your project folder lives) then type `claude` and press Enter. This opens Claude Code inside your project.
4. From here on, "Tell Claude Code" means: type the sentence into that same window and press Enter.

---

## Day 1 — Get it running locally again

**Tell Claude Code:**
> "Commit and push the pending changes in this repo, clean up any stray files that shouldn't be tracked (like the Products folder, backend_old, and duplicate frontend folder), then install dependencies and get both the backend and frontend running locally so I can view the site in my browser. Tell me the URL to open."

Open the URL it gives you (probably `localhost:3000`) and click around — sign up, upload a design, browse the marketplace. Just confirm nothing is obviously broken.

---

## Day 2-3 — Get real payment and fulfillment access

**You do — Razorpay (payments):**
1. Go to razorpay.com and sign up for a business account (if you don't have one already).
2. Complete KYC: you'll need PAN, bank account details, and business proof (GST if you have it, or personal KYC if it's a sole proprietorship).
3. Once approved, go to Settings → API Keys → Generate Live Keys. Copy the **Key ID** and **Key Secret** somewhere safe — you'll hand these to Claude Code, not paste them in chat.

**You do — Qikink (fulfillment):**
1. Log into dashboard.qikink.com.
2. Go to Integration → Custom API and check whether you already have live/production credentials, or if the ones in use are sandbox-only and you need to request production access from Qikink support.

**Tell Claude Code (once you have both sets of keys ready):**
> "I have live Razorpay keys and Qikink production credentials. Help me add them to the backend .env file — I'll paste the values when you ask, don't print them back to me in full."

---

## Day 3-4 — Decide hosting and get a domain

**You do:**
1. Buy a domain if you don't have one (Namecheap or GoDaddy, ~$10-15/year).
2. Sign up for two free-tier hosting accounts: vercel.com (for the website) and render.com (for the backend server). Your database is already hosted on Supabase — no change needed there.

**Tell Claude Code:**
> "Help me deploy the frontend to Vercel and the backend to Render, connected to my GitHub repo. Walk me through each account setup step and tell me exactly what to click. Once deployed, update all the URLs in the env files to point to the real domain instead of localhost."

---

## Day 5 — Reconnect login and email to the real domain

**You do — Google login:**
1. Go to console.cloud.google.com → your project → APIs & Services → Credentials.
2. Open your OAuth client and add your new production URL under "Authorized redirect URIs."

**You do — Email (Resend):**
1. Go to resend.com → Domains → Add your domain.
2. It'll give you a few DNS records to add — your domain registrar (Namecheap/GoDaddy) has a place to paste these, usually called "DNS settings" or "Advanced DNS."

**Tell Claude Code:**
> "I've added the production redirect URI in Google Cloud and verified my domain in Resend. Update the backend config to match and redeploy."

---

## Day 6-8 — Test everything for real, fix what breaks

**Tell Claude Code:**
> "Walk through the entire flow on the live site with me: sign up, upload a design, approve it as admin, buy a product with a real small payment, and confirm the order reaches Qikink. Fix anything that breaks along the way."

Do this yourself too — place a real ₹1-10 test order if Razorpay allows it, or use their test mode first before flipping to live. Try it on your phone too, not just your laptop.

---

## Day 9-10 — Final polish and launch

**You do:**
- Re-read your Terms and any refund/shipping policy page for accuracy.
- Decide the exact go-live moment (e.g., a specific evening) so you can watch for issues right after.

**Tell Claude Code:**
> "Do a final check that sandbox mode is off, all keys are live, and nothing points to localhost anywhere. Then help me point my domain's DNS to the new hosting so the site goes live."

After go-live, keep an eye on orders and payments for the first day or two — that's when issues usually surface.

---

## Quick reference: what only you can do (Claude can't do these for you)
- Razorpay KYC and business verification
- Qikink production account approval
- Buying the domain and logging into your registrar
- Entering payment/bank details anywhere
- Clicking "go live" on Razorpay's dashboard
