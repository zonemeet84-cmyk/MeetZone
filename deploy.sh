#!/bin/bash
# =============================================
# ZoneMeet VPS Deploy Script
# Run this ONCE on your InterServer VPS
# =============================================

echo "🚀 Starting ZoneMeet Deployment..."

# 1. Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# 2. Install Git
echo "🔧 Installing Git..."
apt install -y git curl

# 3. Install Node.js 20
echo "⚙️  Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "✅ Node.js version: $(node -v)"
echo "✅ NPM version: $(npm -v)"

# 4. Install PM2 globally
echo "📌 Installing PM2..."
npm install -g pm2

# 5. Clone project from GitHub
echo "📥 Cloning project..."
cd /root
rm -rf MeetZone
git clone https://github.com/zonemeet84-cmyk/MeetZone.git
cd MeetZone

# 6. Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# 7. Create .env file for backend
echo "🔐 Creating .env file..."
cat > .env << 'EOF'
# =============================================
# ZoneMeet Backend Environment Variables
# =============================================

PORT=5000

MONGO_URI=YOUR_MONGO_URI_HERE

RESEND_API_KEY=YOUR_RESEND_API_KEY_HERE

RECAPTCHA_SECRET=YOUR_RECAPTCHA_SECRET_HERE

JWT_SECRET=YOUR_JWT_SECRET_HERE

RAZORPAY_KEY_ID=YOUR_RAZORPAY_LIVE_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_LIVE_KEY_SECRET

PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID_HERE
PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_CLIENT_SECRET_HERE
PAYPAL_MODE=live

STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY

CASHFREE_APP_ID=YOUR_CASHFREE_APP_ID_HERE
CASHFREE_SECRET_KEY=YOUR_CASHFREE_SECRET_KEY_HERE
CASHFREE_ENV=production
EOF

echo "✅ .env file created!"

# 8. Install frontend dependencies & build
echo "🎨 Installing frontend dependencies..."
cd /root/MeetZone/frontend
npm install

echo "🏗️  Building frontend..."
npm run build

# 9. Start backend with PM2
echo "🚀 Starting backend server..."
cd /root/MeetZone/backend
pm2 start server.js --name "zonemeet-backend"
pm2 save
pm2 startup

echo ""
echo "========================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================"
echo "Backend running on: http://69.164.247.246:5000"
echo "PM2 Status:"
pm2 list
echo ""
echo "📋 Next Steps:"
echo "1. Set up Nginx as reverse proxy"
echo "2. Get SSL certificate with Certbot"
echo "========================================"
