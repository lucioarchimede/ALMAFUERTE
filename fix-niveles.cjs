// fix-niveles.cjs
// Run: node fix-niveles.cjs
// Fixes the rates config and verifies all students are uploaded

const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function fix() {
  // Step 1: Check current rates
  var ratesDoc = await db.collection('config').doc('rates').get();
  var currentRates = ratesDoc.exists ? ratesDoc.data() : {};
  console.log('Current rates:', JSON.stringify(currentRates));

  // Step 2: Check what nivel values students actually have
  var stuSnap = await db.collection('students').get();
  var niveles = {};
  stuSnap.docs.forEach(function(d) {
    var n = d.data().nivel || 'UNKNOWN';
    niveles[n] = (niveles[n] || 0) + 1;
  });
  console.log('Student niveles in DB:', JSON.stringify(niveles));
  console.log('Total students in DB:', stuSnap.size);

  // Step 3: Set rates for ALL nivel variants (with and without tildes)
  var newRates = {
    'Jardin': 35000,
    'Primaria': 45000,
    'Secundaria': 52000
  };
  
  // Also add tilde variants just in case
  newRates['Jardín'] = 35000;
  
  await db.collection('config').doc('rates').set(newRates);
  console.log('');
  console.log('Updated rates:', JSON.stringify(newRates));

  // Step 4: If students are missing, re-upload from JSON
  var expected = require('./students-data.json');
  console.log('Expected students from JSON:', expected.length);

  if (stuSnap.size < expected.length) {
    console.log('');
    console.log('Missing students detected. Re-uploading...');
    var batch = db.batch();
    var batchCount = 0;
    var uploaded = 0;
    for (var i = 0; i < expected.length; i++) {
      var s = expected[i];
      batch.set(db.collection('students').doc(String(s.legajo)), s);
      batchCount++;
      uploaded++;
      if (batchCount >= 490) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
        process.stdout.write('.');
      }
    }
    if (batchCount > 0) await batch.commit();
    console.log('');
    console.log('Re-uploaded ' + uploaded + ' students');
  } else {
    console.log('All students present');
  }

  // Step 5: Final verification
  var finalSnap = await db.collection('students').get();
  var finalNiveles = {};
  finalSnap.docs.forEach(function(d) {
    var n = d.data().nivel || 'UNKNOWN';
    finalNiveles[n] = (finalNiveles[n] || 0) + 1;
  });
  console.log('');
  console.log('FINAL STATUS:');
  console.log('  Total students:', finalSnap.size);
  console.log('  By nivel:', JSON.stringify(finalNiveles));

  var finalRates = await db.collection('config').doc('rates').get();
  console.log('  Rates:', JSON.stringify(finalRates.data()));

  process.exit(0);
}

fix().catch(function(e) { console.error(e); process.exit(1); });
