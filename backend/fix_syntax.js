const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(filePath, 'utf8');

// The write_to_file tool added literal backslashes before backticks and dollar signs
// e.g. \`Razorpay Ref: \${paymentId}\`
// We need to remove these backslashes.

content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed syntax errors in server.js');
