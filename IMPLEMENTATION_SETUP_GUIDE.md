# Complete HRMS Payment & Plan Management System - Setup Guide

## 🎯 Implementation Status

✅ **COMPLETED COMPONENTS:**
- [x] Backend dual OTP verification system 
- [x] Enhanced payment configuration and models
- [x] Payment routes and controllers with plan management
- [x] Company model with payment plan details
- [x] Frontend PaymentGateway component
- [x] Registration flow with 4 steps (fixed payment page issue)
- [x] API service methods for payments
- [x] Razorpay integration with verification
- [x] Payment status validation for login restrictions
- [x] Payment link sharing functionality
- [x] Plan expiry management (365 days configurable)
- [x] Automated plan expiry reminder system
- [x] Email notifications for successful payments
- [x] Super admin notifications
- [x] Standalone payment page for direct links
- [x] Cron job scheduler for automated reminders

⚠️ **SETUP REQUIREMENTS:**

## 🔧 Environment Variables Setup

### Backend (.env file)
Add these variables to your backend `.env` file:

```bash
# Razorpay Configuration (REQUIRED)
RAZORPAY_KEY_ID=rzp_test_your_key_id           # Get from Razorpay Dashboard
RAZORPAY_KEY_SECRET=your_key_secret             # Get from Razorpay Dashboard  
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret     # Optional for webhook verification

# Payment Plan Configuration (NEW)
PLAN_DURATION_DAYS=365                          # Plan validity in days (default: 365)
PAYMENT_VALID_DAYS=365                          # Payment link validity (default: 365)
SUPER_ADMIN_EMAIL=admin@yourcompany.com         # Super admin email for notifications

# Frontend Configuration (NEW)
FRONTEND_URL=http://localhost:3000              # Frontend URL for payment links

# Email Configuration (for OTP sending)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com                # Currently: a.dineshsundar02@gmail.com
EMAIL_PASSWORD=your-app-password               # Currently configured

# Database (if not set)
MONGODB_URI=mongodb://localhost:27017/db4-dinesh

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# Other existing variables...
```

## 🏗️ How It Works

### Registration Flow (4 Steps):

1. **Company Information** - Basic company details and logo upload
2. **Admin Account** - Admin user creation 
3. **Email Verification** - Dual OTP verification:
   - Admin email OTP verification
   - Company contact email OTP verification (if different)
4. **Payment** - Razorpay integration for ₹20,000 registration fee

### Dual OTP System:
- Generates separate OTPs for admin email and company contact email
- If emails are identical, only verifies admin OTP
- Both emails must be verified before proceeding to payment

### Payment Integration:
- Fixed amount: ₹20,000 (configurable in backend/config/payment.js)
- Supports: Credit/Debit Cards, UPI, Net Banking, Wallets
- Secure Razorpay integration with signature verification
- Payment verification and company activation on success

### New Advanced Features:

#### 🔒 Login Restrictions:
- Users cannot login if company payment is not completed
- Automatic plan expiry checking on login attempts
- Clear error messages with payment links for pending payments

#### 🔗 Payment Link Sharing:
- Standalone payment page accessible via: `/payment/{companyCode}`
- Share payment links for companies that completed registration but not payment
- API endpoint: `GET /api/companies/payment-link/{companyCode}`

#### 📅 Plan Management:
- Configurable plan duration (default: 365 days)
- Automatic plan start/end date calculation
- Plan expiry checking and account suspension

#### 📧 Automated Email System:
- **Payment Success**: Sent to company contact email with plan details
- **Super Admin Notifications**: Sent to configured admin email for each payment
- **Plan Expiry Reminders**: Automated reminders 5 days and 1 day before expiry
- **Expiry Notifications**: Immediate notification when plan expires

#### ⏰ Automated Reminder System:
- Cron job runs daily at 9:00 AM (Indian timezone)
- Automatic detection of companies needing reminders
- Prevents duplicate reminders with smart tracking
- Automatic account suspension for expired plans

## 🔗 Key API Endpoints

### Company Registration & OTP:
- `POST /api/companies/register` - Company registration with dual OTP sending
- `POST /api/companies/verify-dual-otp` - Verify both admin and contact OTPs
- `GET /api/companies/payment-link/:companyCode` - Get payment link for company

### Payment:
- `GET /api/payments/config` - Get payment configuration
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment after completion
- `GET /api/payments/status/:companyCode` - Get payment status

### Authentication:
- `POST /api/companies/login` - Login with payment validation
  - Returns 402 status for pending payments with payment link
  - Returns 402 status for expired plans

## 🎨 Frontend Components

### RegisterCompanyPage.js
- Multi-step registration form
- Dual OTP input handling
- PaymentGateway integration
- Responsive design with animations

### PaymentGateway.js  
- Professional payment UI
- Multiple payment method options
- Razorpay integration
- Success/failure handling

## 🚀 Getting Razorpay Credentials

1. Sign up at [https://razorpay.com](https://razorpay.com)
2. Go to Account & Settings → API Keys
3. Generate Test/Live keys
4. Add to your .env file:
   - `RAZORPAY_KEY_ID` - Public key (starts with rzp_test_ or rzp_live_)
   - `RAZORPAY_KEY_SECRET` - Secret key
   - `RAZORPAY_WEBHOOK_SECRET` - For webhook verification (optional)

## 📧 Email Configuration

Current setup uses Gmail SMTP:
- Host: smtp.gmail.com
- Port: 587
- Email: a.dineshsundar02@gmail.com
- Password: App-specific password (configured)

## 🔧 Testing the Implementation

1. **Install missing dependency:**
   ```bash
   cd backend
   npm install razorpay@^2.9.4
   ```

2. **Configure Razorpay credentials in .env**

3. **Test registration flow:**
   - Go to `/register-company`
   - Complete all 4 steps
   - Verify dual OTP functionality  
   - Test payment with Razorpay test cards

4. **Test payment with Razorpay test cards:**
   - Card: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date

## 🔄 Payment Configuration

Amount can be modified in `backend/config/payment.js`:
```javascript
REGISTRATION_FEE: 2000000, // ₹20,000 in paise (20000 * 100)
```

## 🐛 Troubleshooting

1. **Razorpay initialization fails:**
   - Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env
   - Ensure values don't have extra spaces or quotes

2. **OTP emails not sending:**
   - Verify EMAIL_USER and EMAIL_PASSWORD
   - Check Gmail app password configuration

3. **Payment verification fails:**
   - Ensure webhook endpoint is accessible
   - Check signature verification in payment controller

## 📋 Next Steps

1. Add Razorpay credentials to .env file
2. Test the complete registration flow
3. Configure webhook URL in Razorpay dashboard (optional)
4. Deploy and test in production environment

## 🔒 Security Notes

- Payment verification uses cryptographic signature validation
- OTPs expire after 10 minutes
- All payment data is encrypted in transit
- No sensitive payment information is stored locally

---

**Implementation is complete and ready for testing with proper environment variables configured!**
