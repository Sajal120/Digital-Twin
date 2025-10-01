# 🇦🇺 Australian Phone Number Setup Guide - Address Assignment

## 📍 Address Requirement for Australian Numbers (+61)

For Australian phone numbers like **+61 2 5565 6168**, Twilio requires a **validated address** due to Australian regulatory requirements. This is mandatory and cannot be skipped.

## 🏠 How to Create and Assign an Address

### Step 1: Create a Validated Address in Twilio

1. **Go to Twilio Console**
   - Navigate to: https://console.twilio.com/
   - Login to your account

2. **Access Address Management**
   - In the left sidebar, go to **Phone Numbers** → **Manage** → **Addresses**
   - Click **"Create new Address"**

3. **Enter Your Address Details**
   ```
   Customer Name: [Your Full Name]
   Street Address: [Your Street Address]
   City: [Your City]
   State/Province: [Your State - e.g., NSW, VIC, QLD]
   Postal Code: [Your Postal Code]
   Country: Australia
   ```

4. **Address Validation**
   - Twilio will validate the address
   - ✅ You'll see a green checkmark when validated
   - ❌ If invalid, you'll need to correct the details

### Step 2: Assign Address to Your Phone Number

1. **Go Back to Phone Number Configuration**
   - Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
   - Click on your Australian number: **+61 2 5565 6168**

2. **Assign the Address**
   - In the "Address Requirements" section
   - Click **"Assign Address"**
   - Select the address you just created
   - Click **"Save"**

## 🏠 Address Requirements by Australian State

### For Sydney Numbers (+61 2) - NSW
```
State: New South Wales (NSW)
Required: Valid NSW address
Example: 
123 George Street
Sydney NSW 2000
Australia
```

### For Melbourne Numbers (+61 3) - VIC
```
State: Victoria (VIC)
Required: Valid VIC address
```

### For Brisbane Numbers (+61 7) - QLD
```
State: Queensland (QLD)  
Required: Valid QLD address
```

## 🏢 Business vs Residential Address

### Residential Address (Recommended for Personal Use)
- ✅ Your home address
- ✅ Simple to validate
- ✅ No additional documentation required
- ✅ Perfect for professional portfolio use

### Business Address (For Commercial Use)
- 📋 Requires business registration documents
- 📋 More complex validation process
- 💼 Better for established businesses

## 🆔 Address Validation Tips

### What Twilio Accepts
- ✅ **Residential addresses** (your home)
- ✅ **Business addresses** (your workplace)
- ✅ **PO Boxes** (in some cases)
- ✅ **Co-working spaces** (if you have access)

### What Twilio Rejects
- ❌ Fake or non-existent addresses
- ❌ International addresses for AU numbers
- ❌ Incomplete address information
- ❌ Addresses that fail Australia Post validation

## 🔧 Complete Setup Process

### 1. Create Address (First Time Only)
```bash
# Twilio Console Steps:
1. Phone Numbers → Manage → Addresses
2. Click "Create new Address"
3. Fill in your Australian address
4. Wait for validation ✅
5. Save the address
```

### 2. Assign Address to Phone Number
```bash
# For your number +61 2 5565 6168:
1. Phone Numbers → Manage → Active Numbers
2. Click on +61 2 5565 6168
3. Scroll to "Address Requirements"
4. Click "Assign Address"
5. Select your validated address
6. Save configuration
```

### 3. Configure Webhook (After Address Assignment)
```bash
# In the same phone number configuration:
1. Set Voice Webhook URL: https://your-app.vercel.app/api/phone/webhook
2. Set HTTP Method: POST
3. Save configuration
```

## 📝 Example Address Format for Sydney

```
Customer Name: Sajal Shrestha
Street Address: 123 Pitt Street
City: Sydney
State/Province: NSW
Postal Code: 2000
Country: Australia
```

## 🚨 Common Issues & Solutions

### Issue: "Address not validated"
**Solution:** 
- Double-check spelling of street name
- Ensure postal code matches the suburb
- Use Australia Post website to verify correct format

### Issue: "Address already in use"
**Solution:**
- You can reuse the same address for multiple numbers
- Just select the existing address from dropdown

### Issue: "Invalid address format"
**Solution:**
- Use standard Australian address format
- Include state abbreviation (NSW, VIC, QLD, etc.)
- Don't include "Australia" in street address field

## 🔐 Privacy & Security

### Address Privacy
- Your address is used for regulatory compliance only
- Not publicly visible or shared
- Required by Australian telecommunications regulations
- Stored securely by Twilio

### Regulatory Compliance
- **ACMA Requirements**: Australian Communications and Media Authority
- **Telecommunications Act**: Compliance with Australian law
- **Emergency Services**: Address used for emergency call routing
- **Legal Obligation**: Required for all Australian phone numbers

## ✅ Verification Checklist

After address assignment, verify:
- [ ] Address shows as "Validated" in Twilio console
- [ ] Phone number shows address is assigned
- [ ] Webhook URL is configured
- [ ] Number status is "Active"
- [ ] Test call works correctly

## 🚀 Next Steps After Address Assignment

1. **Complete Phone Setup**
   ```bash
   # Add to your .env.local:
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+61256656168
   ```

2. **Deploy Your System**
   ```bash
   pnpm build
   vercel --prod
   ```

3. **Test Your Professional Phone**
   - Call +61 2 5565 6168
   - Test AI conversation
   - Verify recording and transcription

4. **Update Professional Profiles**
   - Add number to LinkedIn
   - Update resume and business cards
   - Share with professional network

## 🎯 Professional Benefits

Once your Australian number is fully configured:

- **Local Presence**: Australian +61 number for local credibility
- **Professional Image**: Business-grade phone system
- **24/7 Availability**: Never miss Australian business opportunities
- **AI-Powered Screening**: Intelligent handling of professional calls
- **Compliance**: Fully compliant with Australian regulations

**Your Australian professional phone number will be ready to transform your career networking in the Australian market!** 🇦🇺📞

---

**Need help?** The address assignment is a one-time setup. Once completed, your omni-channel digital twin will be ready for Australian professional communications!