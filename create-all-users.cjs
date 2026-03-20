// create-all-users.cjs
// Run: node create-all-users.cjs
// Uses Firebase Admin SDK to create auth accounts for ALL families in Firestore

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createAllUsers() {
  console.log("═══════════════════════════════════════════");
  console.log("  CREATING AUTH ACCOUNTS FOR ALL FAMILIES");
  console.log("═══════════════════════════════════════════\n");

  // Get all families from Firestore
  const famSnap = await db.collection('Familias').get();
  console.log(`Found ${famSnap.size} families in Firestore\n`);

  let created = 0;
  let skipped = 0;
  let updated = 0;
  let errors = 0;
  const credentials = [];

  for (const famDoc of famSnap.docs) {
    const famId = famDoc.id;
    const famData = famDoc.data();
    const email = famData.email;

    if (!email) {
      console.log(`  ⚠ ${famId} — no email, skipped`);
      skipped++;
      continue;
    }

    // If already has authUid, check if the auth account exists
    if (famData.authUid) {
      try {
        await auth.getUser(famData.authUid);
        console.log(`  ○ ${famId} | ${email} — already has auth account`);
        skipped++;
        continue;
      } catch (e) {
        // authUid exists in Firestore but no auth account — will create one
      }
    }

    // Check if email already exists in Auth
    let uid;
    try {
      const existingUser = await auth.getUserByEmail(email);
      uid = existingUser.uid;
      console.log(`  ○ ${famId} | ${email} — auth exists, linking UID`);
    } catch (e) {
      // Email not found in Auth — create new account
      const password = `colegio${famId.replace('FAM-', '')}`;
      try {
        const newUser = await auth.createUser({
          email: email,
          password: password,
          displayName: famData.responsable || ''
        });
        uid = newUser.uid;
        created++;
        credentials.push({ famId, email, password, responsable: famData.responsable });
        console.log(`  ✓ ${famId} | ${email} | pass: ${password}`);
      } catch (createErr) {
        console.log(`  ✗ ${famId} | ${email} — Error: ${createErr.message}`);
        errors++;
        continue;
      }
    }

    // Update Firestore document with authUid
    if (uid) {
      try {
        await db.collection('Familias').doc(famId).update({ authUid: uid });
        updated++;
      } catch (updateErr) {
        console.log(`  ✗ ${famId} — Could not update authUid: ${updateErr.message}`);
      }
    }
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("  DONE!");
  console.log("═══════════════════════════════════════════");
  console.log(`\n  Created:  ${created} new accounts`);
  console.log(`  Skipped:  ${skipped} (already had accounts)`);
  console.log(`  Linked:   ${updated} families updated with authUid`);
  console.log(`  Errors:   ${errors}`);

  if (credentials.length > 0) {
    console.log("\n  NEW CREDENTIALS:");
    console.log("  ─────────────────────────────────────────────────────────");
    console.log("  FAMILY ID     EMAIL                                PASSWORD");
    console.log("  ─────────────────────────────────────────────────────────");
    credentials.forEach(c => {
      console.log(`  ${c.famId.padEnd(14)} ${c.email.padEnd(36)} ${c.password}`);
    });
    console.log("  ─────────────────────────────────────────────────────────");
    console.log(`\n  Password format: colegio + family number (e.g., colegio100, colegio201)`);
  }

  console.log("\n✓ All families can now log in.\n");
  process.exit(0);
}

createAllUsers().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
