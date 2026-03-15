const { execSync } = require('child_process');

const envVars = [
  {
    name: 'VITE_SUPABASE_URL',
    value: 'https://bfegwgoxeoawftxirapx.supabase.co',
    sensitive: false
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY', 
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZWd3Z294ZW9hd2Z0eGlyYXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzM1NTUsImV4cCI6MjA4ODkwOTU1NX0.YhEy9CrxZoAcWZzsDi2ZxiiWxIEiOcvcVde2L4dv_iA',
    sensitive: false
  },
  {
    name: 'SUPABASE_URL',
    value: 'https://bfegwgoxeoawftxirapx.supabase.co',
    sensitive: false
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZWd3Z294ZW9hd2Z0eGlyYXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzMzMzU1NSwiZXhwIjoyMDg4OTA5NTU1fQ.mQLNjephcttdsnBuMfhtQEk2wWurJFX8P1rh-3vzb4I',
    sensitive: false
  }
];

console.log('Setting Vercel environment variables...');

envVars.forEach((envVar, index) => {
  setTimeout(() => {
    console.log(`Setting ${envVar.name}...`);
    
    const command = `npx vercel env add ${envVar.name} --scope abir2afridi-5746s-projects`;
    
    try {
      // This will prompt for value, so we need to use a different approach
      console.log(`Please enter this value when prompted: ${envVar.value}`);
      console.log(`Run: npx vercel env add ${envVar.name} --scope abir2afridi-5746s-projects`);
    } catch (error) {
      console.error(`Error setting ${envVar.name}:`, error.message);
    }
  }, index * 1000);
});

console.log('\nManual setup instructions:');
console.log('1. Run each command below and paste the corresponding value:');
envVars.forEach(envVar => {
  console.log(`   npx vercel env add ${envVar.name} --scope abir2afridi-5746s-projects`);
  console.log(`   Value: ${envVar.value}`);
});
console.log('\n2. Select "Production" for all environments');
console.log('3. After setting all variables, redeploy with: npx vercel --prod --scope abir2afridi-5746s-projects');
