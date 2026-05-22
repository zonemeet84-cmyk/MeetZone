const fs = require('fs');
const path = require('path');

try {
  const usersFile = path.join(__dirname, 'users.json');
  let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const user = users.find(u => u.email === 'ds9376314@gmail.com');
  
  if (user) {
    delete user.twoFactorSecret;
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    console.log("✅ SUCCESS: Google Authenticator 2FA hata diya gaya hai.");
  } else {
    console.log("User not found.");
  }
} catch(e) {
  console.log("Error:", e.message);
}
