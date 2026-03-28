// clean-auth.cjs
// Deletes all Firebase Auth accounts that are NOT linked to a current family
const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const auth = admin.auth();

async function clean() {
  // Get all current family emails
  console.log('Reading current families...');
  var famSnap = await db.collection('Familias').get();
  var validEmails = {};
  famSnap.docs.forEach(function(d) {
    var email = d.data().email;
    if (email) validEmails[email.toLowerCase()] = true;
  });
  // Always keep admin
  validEmails['admin@almafuerte.edu.ar'] = true;
  console.log('Valid emails: ' + Object.keys(validEmails).length);

  // List all auth users
  console.log('Checking auth accounts...');
  var deleted = 0;
  var kept = 0;
  var nextPageToken;

  do {
    var listResult = await auth.listUsers(1000, nextPageToken);
    for (var i = 0; i < listResult.users.length; i++) {
      var user = listResult.users[i];
      var email = (user.email || '').toLowerCase();
      if (validEmails[email]) {
        kept++;
      } else {
        try {
          await auth.deleteUser(user.uid);
          deleted++;
        } catch(e) {}
      }
    }
    nextPageToken = listResult.pageToken;
  } while (nextPageToken);

  console.log('');
  console.log('DONE');
  console.log('  Kept: ' + kept);
  console.log('  Deleted: ' + deleted);
  process.exit(0);
}

clean().catch(function(e) { console.error(e); process.exit(1); });
