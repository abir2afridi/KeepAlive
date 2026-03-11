import 'dotenv/config';
console.log('ENV keys:', Object.keys(process.env).filter(k => k.includes('FIREBASE') || k.includes('ENCRYPTION')));
console.log('ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY ? process.env.ENCRYPTION_KEY.length : 'undefined');
