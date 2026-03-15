# Deploy to Vercel with Environment Variables
$projId = "prj_wWtw2Pv3JyXiTjmChBAXR1UiYpwQ"
$scope = "abir2afridi-5746s-projects"

Write-Host "🚀 Starting deployment to Vercel project: $projId"

# Environment Variables from .env.example
# Default variables
$vars = @{
    "NODE_ENV" = "production"
    "PORT" = "3000"
}

# Load from .env if exists
if (Test-Path ".env") {
    Write-Host "📂 Loading environment variables from .env"
    Get-Content .env | ForEach-Object {
        if ($_ -match "^([^#=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim()
            # Remove quotes if present
            $val = $val -replace "^['""]|['""]$", ""
            if ($key) {
                $vars[$key] = $val
                Write-Host "  ➕ Found: $key"
            }
        }
    }
} else {
    Write-Host "⚠️  .env file not found, using script defaults"
    # Essential Supabase (Frontend)
    $vars["VITE_SUPABASE_URL"] = "https://bfegwgoxeoawftxirapx.supabase.co"
    $vars["VITE_SUPABASE_ANON_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZWd3Z294ZW9hd2Z0eGlyYXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMDAzMjksImV4cCI6MjA0OTY3NjMyOX0.lFQqkLVYYZVHdY7SLkAGz6l6QYxqLs9B3qKlN5xGd3Q"
    # Essential Supabase (Server)
    $vars["SUPABASE_URL"] = "https://bfegwgoxeoawftxirapx.supabase.co"
    $vars["SUPABASE_SERVICE_ROLE_KEY"] = "YOUR_SERVICE_ROLE_KEY_HERE"
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
