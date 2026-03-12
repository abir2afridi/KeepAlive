# fix_vercel_env.ps1
$projId = "prj_wWtw2Pv3JyXiTjmChBAXR1UiYpwQ"
$scope = "abir2afridi-5746s-projects"

$vars = @{
    "VITE_FIREBASE_API_KEY" = "AIzaSyBKwZPzSUmpCvHTKSp4uHhoywfbPK0-F20"
    "VITE_FIREBASE_APP_ID" = "1:780554860855:web:680e1e7ae02be7043f82b2"
    "VITE_FIREBASE_PROJECT_ID" = "keep02alive"
    "VITE_FIREBASE_AUTH_DOMAIN" = "keep02alive.firebaseapp.com"
    "VITE_FIREBASE_STORAGE_BUCKET" = "keep02alive.firebasestorage.app"
    "VITE_FIREBASE_MESSAGING_SENDER_ID" = "780554860855"
    "VITE_FIREBASE_MEASUREMENT_ID" = "G-XFL41Y3P7Y"
    "FIREBASE_PROJECT_ID" = "keep02alive"
    "FIREBASE_CLIENT_EMAIL" = "firebase-adminsdk-fbsvc@keep02alive.iam.gserviceaccount.com"
    "ENCRYPTION_KEY" = "your-secret-encryption-key-32-chars-long!!"
}

# Add Firebase Private Key
$privateKey = Get-Content -Raw serviceAccount.json | ConvertFrom-Json | Select-Object -ExpandProperty private_key
$vars["FIREBASE_PRIVATE_KEY"] = $privateKey

foreach ($key in $vars.Keys) {
    Write-Host "Cleaning and re-setting $key..."
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

Write-Host "`nRedeploying to apply clean environment variables..."
npx -y vercel --prod --scope $scope --yes
