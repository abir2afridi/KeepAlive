
const fs = require('fs');
const content = fs.readFileSync('d:/GitHub Project/KeepAlive/src/data/dnsProviders.ts', 'utf8');
const ids = [];
const idRegex = /id:\s*'([^']+)'/g;
let match;
while ((match = idRegex.exec(content)) !== null) {
  ids.push(match[1]);
}

const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
console.log('Duplicate IDs:', [...new Set(duplicates)]);
