// create-users.cjs
// Run: node create-users.cjs
// This creates Firebase Auth accounts for all families and links them in Firestore

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDe7BDHcxksqNkExUvZB3UIZAr9hBdg14Q",
  authDomain: "cobranzas-f092a.firebaseapp.com",
  projectId: "cobranzas-f092a",
  storageBucket: "cobranzas-f092a.firebasestorage.app",
  messagingSenderId: "2530313930",
  appId: "1:2530313930:web:c7e1041d7059fafec25633"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const users = [
  { familyId: "FAM-002", email: "maria.lopez@email.com", password: "colegio2002" },
  { familyId: "FAM-003", email: "ana.martinez@email.com", password: "colegio3001" },
  { familyId: "FAM-004", email: "pedro.rodriguez@email.com", password: "colegio4001" },
  { familyId: "FAM-005", email: "laura.fernandez@email.com", password: "colegio5001" },
  { familyId: "FAM-006", email: "diego.gonzalez@email.com", password: "colegio6001" },
  { familyId: "FAM-007", email: "silvia.perez@email.com", password: "colegio7001" },
  { familyId: "FAM-008", email: "marcos.diaz@email.com", password: "colegio8001" },
  { familyId: "FAM-009", email: "gabriela.romero@email.com", password: "colegio9001" },
  { familyId: "FAM-010", email: "fernando.alvarez@email.com", password: "colegio10001" },
  { familyId: "FAM-011", email: "carolina.suarez@email.com", password: "colegio11001" },
  { familyId: "FAM-012", email: "roberto.medina@email.com", password: "colegio12001" },
  { familyId: "FAM-013", email: "patricia.herrera@email.com", password: "colegio13001" },
];

async function createUsers() {
  console.log("Creating 12 user accounts...\n");
  
  for (const user of users) {
    try {
      // Create auth account
      const result = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const uid = result.user.uid;
      
      // Update Familias document with authUid
      await updateDoc(doc(db, "Familias", user.familyId), { authUid: uid });
      
      console.log("  ✓ " + user.familyId + " | " + user.email + " | pass: " + user.password + " | UID: " + uid);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log("  ⚠ " + user.email + " — already exists (skipped)");
      } else {
        console.log("  ✗ " + user.email + " — Error: " + err.message);
      }
    }
  }

  console.log("\n═══════════════════════════════════");
  console.log("USERS CREATED!");
  console.log("═══════════════════════════════════");
  console.log("\nCredentials for all families:\n");
  console.log("  FAMILY        EMAIL                           PASSWORD");
  console.log("  ─────────     ─────────────────────────────   ──────────────");
  users.forEach(u => {
    console.log("  " + u.familyId.padEnd(12) + "  " + u.email.padEnd(32) + "  " + u.password);
  });
  console.log("\n  + FAM-001     carlos.garcia@email.com          test1234  (already existed)");
  console.log("  + ADMIN       admin@almafuerte.edu.ar           admin1234 (already existed)");
  console.log("\nDone! Each family can now log in and see only their children.\n");
  
  process.exit(0);
}

createUsers().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
