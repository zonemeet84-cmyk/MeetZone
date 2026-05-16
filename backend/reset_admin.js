const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, 'users.json');
let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

async function update() {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('12345678', salt);

    users = users.map(u => {
        if (u.email === 'zonemeet84@gmail.com' || u.email === 'ds9376314@gmail.com') {
            return { ...u, email: 'zonemeet84@gmail.com', password: hash };
        }
        return u;
    });

    // Remove duplicates if any
    const seen = new Set();
    users = users.filter(u => {
        if (seen.has(u.email)) return false;
        seen.add(u.email);
        return true;
    });

    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    console.log('Admin password reset to: 12345678');
}

update();
