# setup_vercel.ps1
# This script will set all necessary Firebase and Backend environment variables on your Vercel project.
# It assumes you are logged in to Vercel (verify with 'npx vercel whoami').

$projId = "prj_wWtw2Pv3JyXiTjmChBAXR1UiYpwQ"
$scope = "abir2afridi-5746s-projects"

Write-Host "Linking local codebase to Vercel Project: $projId..."
npx -y vercel link --yes --scope $scope --project $projId

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

foreach ($key in $vars.Keys) {
    Write-Host "Setting $key..."
    $val = $vars[$key]
    echo $val | npx -y vercel env add $key production --scope $scope
}

# Special handling for Private Key due to multi-line
Write-Host "Setting FIREBASE_PRIVATE_KEY..."
$privateKey = Get-Content -Raw serviceAccount.json | ConvertFrom-Json | Select-Object -ExpandProperty private_key
echo $privateKey | npx -y vercel env add FIREBASE_PRIVATE_KEY production --scope $scope

Write-Host "`nAll environment variables have been queued for production."
Write-Host "Now redeploying to apply changes..."
npx -y vercel --prod --scope $scope --yes
