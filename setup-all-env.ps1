# Setup All Environment Variables for Vercel
Write-Host "🔧 Setting up all environment variables..."

# Server-side Supabase (you need to replace with your actual service role key)
Write-Host "⚠️  Please manually set SUPABASE_SERVICE_ROLE_KEY in Vercel dashboard"
Write-Host "   Go to: https://vercel.com/abir2afridi-5746s-projects/keep-alive/settings/environment-variables"

# App config
echo "your-secret-here" | npx -y vercel env add JWT_SECRET production --scope abir2afridi-5746s-projects
echo "3000" | npx -y vercel env add PORT production --scope abir2afridi-5746s-projects
echo "production" | npx -y vercel env add NODE_ENV production --scope abir2afridi-5746s-projects

# Stripe (replace with your actual keys)
Write-Host "⚠️  Please manually set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Vercel dashboard"

Write-Host "✅ Basic environment variables set!"
Write-Host "📝 Don't forget to set the secret keys manually in the Vercel dashboard"
