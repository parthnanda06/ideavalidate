try {
    console.log("1. Requiring config/firebase...");
    const firebase = require('./config/firebase');
    console.log("   Success.");
} catch (e) { console.log("   FAILED:", e.message); }

try {
    console.log("2. Requiring middleware/firebaseAuth...");
    const auth = require('./middleware/firebaseAuth');
    console.log("   Success.");
} catch (e) { console.log("   FAILED:", e.message); }

try {
    console.log("3. Requiring controllers/validationsController...");
    const ctrl = require('./controllers/validationsController');
    console.log("   Success.");
} catch (e) { console.log("   FAILED:", e.message); }

try {
    console.log("4. Requiring routes/validations...");
    const routes = require('./routes/validations.js');
    console.log("   Success.");
} catch (e) { console.log("   FAILED:", e.message); }
