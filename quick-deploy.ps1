# Quick Deploy to Vercel
Write-Host "🚀 Quick deploy to Vercel project: prj_wWtw2Pv3JyXiTjmChBAXR1UiYpwQ"

# Set essential environment variables first
Write-Host "🔧 Setting essential environment variables..."

# Supabase variables
npx -y vercel env add VITE_SUPABASE_URL production --scope abir2afridi-5746s-projects <<< "https://bfegwgoxeoawftxirapx.supabase.co"
npx -y vercel env add VITE_SUPABASE_ANON_KEY production --scope abir2afridi-5746s-projects <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZWd3Z294ZW9hd2Z0eGlyYXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMDAzMjksImV4cCI6MjA0OTY3NjMyOX0.lFQqkLVYYZVHdY7SLkAGz6l6QYxqLs9B3qKlN5xGd3Q"

# Deploy
Write-Host "🚀 Deploying to production..."
npx -y vercel --prod --scope abir2afridi-5746s-projects --yes

Write-Host "✅ Deployment completed!"
