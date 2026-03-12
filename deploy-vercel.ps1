# Deploy to Vercel with Environment Variables
$projId = "prj_wWtw2Pv3JyXiTjmChBAXR1UiYpwQ"
$scope = "abir2afridi-5746s-projects"

Write-Host "🚀 Starting deployment to Vercel project: $projId"

# Environment Variables from .env.example
$vars = @{
    # Supabase (Frontend)
    "VITE_SUPABASE_URL" = "https://bfegwgoxeoawftxirapx.supabase.co"
    "VITE_SUPABASE_ANON_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZWd3Z294ZW9hd2Z0eGlyYXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMDAzMjksImV4cCI6MjA0OTY3NjMyOX0.lFQqkLVYYZVHdY7SLkAGz6l6QYxqLs9B3qKlN5xGd3Q"
    
    # Supabase (Server)
    "SUPABASE_URL" = "https://bfegwgoxeoawftxirapx.supabase.co"
    "SUPABASE_SERVICE_ROLE_KEY" = "YOUR_SERVICE_ROLE_KEY_HERE"
    
    # Stripe Config (SECRET - KEEP ON SERVER ONLY)
    "STRIPE_SECRET_KEY" = "sk_test_YOUR_STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET" = "whsec_YOUR_WEBHOOK_SECRET"
    
    # App Config
    "ENCRYPTION_KEY" = "your-32-character-encryption-key-here"
    "JWT_SECRET" = "your-secret-here"
    "PORT" = "3000"
    "NODE_ENV" = "production"
    
    # Firebase Config (from your existing script)
    "VITE_FIREBASE_API_KEY" = "AIzaSyBKwZPzSUmpCvHTKSp4uHhoywfbPK0-F20"
    "VITE_FIREBASE_APP_ID" = "1:780554860855:web:680e1e7ae02be7043f82b2"
    "VITE_FIREBASE_PROJECT_ID" = "keep02alive"
    "VITE_FIREBASE_AUTH_DOMAIN" = "keep02alive.firebaseapp.com"
    "VITE_FIREBASE_STORAGE_BUCKET" = "keep02alive.firebasestorage.app"
    "VITE_FIREBASE_MESSAGING_SENDER_ID" = "780554860855"
    "VITE_FIREBASE_MEASUREMENT_ID" = "G-XFL41Y3P7Y"
    "FIREBASE_PROJECT_ID" = "keep02alive"
    "FIREBASE_CLIENT_EMAIL" = "firebase-adminsdk-fbsvc@keep02alive.iam.gserviceaccount.com"
}

# Add Firebase Private Key if serviceAccount.json exists
if (Test-Path "serviceAccount.json") {
    try {
        $privateKey = Get-Content -Raw "serviceAccount.json" | ConvertFrom-Json | Select-Object -ExpandProperty private_key
        $vars["FIREBASE_PRIVATE_KEY"] = $privateKey
        Write-Host "✅ Firebase private key loaded from serviceAccount.json"
    } catch {
        Write-Host "⚠️  Could not read Firebase private key from serviceAccount.json"
    }
} else {
    Write-Host "⚠️  serviceAccount.json not found, skipping Firebase private key"
}

# Set environment variables
foreach ($key in $vars.Keys) {
    Write-Host "🔧 Setting environment variable: $key"
    $val = $vars[$key]
    
    # Remove existing to prevent duplication/errors
    npx -y vercel env rm $key production --scope $scope --yes 2>$null
    
    # Write to a temporary file WITHOUT newline
    $tmpFile = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($tmpFile, $val)
    
    # Pipe the file content to vercel env add
    Get-Content -Raw $tmpFile | npx -y vercel env add $key production --scope $scope
    
    Remove-Item $tmpFile
}

Write-Host "`n🎯 Environment variables set successfully!"

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..."
npx -y vercel --prod --scope $scope --yes

Write-Host "`n✅ Deployment completed!"
Write-Host "🌐 Your app should be live at: https://your-app-name.vercel.app"
