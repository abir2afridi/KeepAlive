# Get Your Supabase Service Role Key

You need to get the actual service role key from your Supabase project. Follow these steps:

## 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Select your project: `bfegwgoxeoawftxirapx`

## 2. Get Service Role Key
1. Go to **Project Settings** (gear icon ⚙️)
2. Click on **API** in the left sidebar
3. Find the **Service Role Key** section
4. Copy the `service_role` key (it starts with `eyJ...`)

## 3. Update the Environment Variable
Replace the placeholder in Vercel:

1. Go to: https://vercel.com/abir2afridi-5746s-projects/keep-alive/settings/environment-variables
2. Find `SUPABASE_SERVICE_ROLE_KEY`
3. Replace the value with your actual service role key
4. Save the changes

## 4. Redeploy
```bash
npx -y vercel --prod --scope abir2afridi-5746s-projects --yes
```

## Security Note
The service role key should be kept secret and only used on the server-side. Never expose it in client-side code.
