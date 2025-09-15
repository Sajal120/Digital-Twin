// This script creates a temporary file to signal build mode without database
const fs = require('fs');
const path = require('path');

const flagFile = path.join(__dirname, '.build-mode');
fs.writeFileSync(flagFile, 'BUILD_MODE=true');
console.log('Created build mode flag file');