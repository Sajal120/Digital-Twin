# Booking System Setup (No Google Verification Needed!)

## Option 1: Cal.com (Recommended - Free & Open Source)

### Setup:
1. Go to https://cal.com
2. Sign up with your email
3. Create a booking page
4. Get your embed code

### Integration:
Add to your portfolio:
```tsx
<iframe
  src="https://cal.com/your-username"
  width="100%"
  height="600px"
  frameborder="0"
/>
```

**Benefits:**
- ✅ Free forever
- ✅ Syncs with YOUR Google Calendar (not users')
- ✅ Sends confirmation emails automatically
- ✅ No OAuth verification needed
- ✅ Professional booking page

---

## Option 2: Calendly (Easiest)

### Setup:
1. Go to https://calendly.com
2. Sign up (free plan)
3. Create an event type
4. Get your scheduling link

### Integration:
```tsx
<iframe
  src="https://calendly.com/your-username"
  width="100%"
  height="630px"
  frameborder="0"
/>
```

---

## Option 3: Custom Booking System (Full Control)

Build your own with:
- Resend for emails (free 100/day)
- Your Postgres database
- .ics file generation

### Implementation:

1. **Install Resend:**
```bash
npm install resend
```

2. **Create API endpoint:**
`src/app/api/booking/route.ts`

3. **Environment variables:**
```bash
RESEND_API_KEY=your_key
YOUR_EMAIL=basnetsajal120@gmail.com
```

---

## My Recommendation:

**Use Cal.com** - It's:
- Free and open source
- Syncs with YOUR calendar
- Sends emails automatically
- No verification needed
- Takes 5 minutes to setup

Want me to help you set it up?
