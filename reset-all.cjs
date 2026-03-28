// reset-all.cjs
const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
if (admin.apps.length === 0) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
const auth = admin.auth();

async function deleteCollection(name) {
  var snap = await db.collection(name).get();
  if (snap.empty) return 0;
  var batch = db.batch();
  var count = 0;
  var total = 0;
  for (var i = 0; i < snap.docs.length; i++) {
    batch.delete(snap.docs[i].ref);
    count++; total++;
    if (count >= 490) { await batch.commit(); batch = db.batch(); count = 0; }
  }
  if (count > 0) await batch.commit();
  return total;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function run() {
  console.log('STEP 1: Deleting old data...');
  console.log('  Deleted ' + await deleteCollection('students') + ' students');
  console.log('  Deleted ' + await deleteCollection('payments') + ' payments');
  console.log('  Deleted ' + await deleteCollection('Familias') + ' families');

  var studentsRaw = require('./students-data.json');
  console.log('');
  console.log('STEP 2: Building families from ' + studentsRaw.length + ' students...');

  var familyGroups = {};
  studentsRaw.forEach(function(s) {
    var lf = s.legajoFamiliar || String(s.legajo);
    if (!familyGroups[lf]) familyGroups[lf] = [];
    familyGroups[lf].push(s);
  });

  var nombresM = ['Carlos','Pablo','Diego','Fernando','Marcos','Roberto','Gabriel','Sergio','Daniel','Alejandro','Gustavo','Ricardo','Hugo','Javier','Eduardo','Jorge','Mario','Oscar','Federico','Leandro','Gonzalo','Damian','Ariel','Fabian','Cristian','Mariano','Ignacio','Ezequiel','Matias','Lucas'];
  var nombresF = ['Maria','Ana','Laura','Silvia','Patricia','Gabriela','Carolina','Andrea','Marcela','Monica','Claudia','Veronica','Lorena','Paola','Natalia','Florencia','Romina','Soledad','Valeria','Daniela','Cecilia','Viviana','Adriana','Graciela','Liliana','Luciana','Vanesa','Mariana','Yanina','Karina'];
  var dominios = ['gmail.com','hotmail.com','yahoo.com.ar','outlook.com'];

  var families = [];
  var famCounter = 1;
  var usedEmails = {};

  Object.keys(familyGroups).forEach(function(lf) {
    var studs = familyGroups[lf];
    var apellido = studs[0].apellido;
    var isFemale = Math.random() > 0.4;
    var respNombre = pick(isFemale ? nombresF : nombresM);
    var responsable = respNombre + ' ' + apellido;

    var emailBase = respNombre.toLowerCase() + '.' + apellido.toLowerCase();
    emailBase = emailBase.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '');
    var email = emailBase + '@' + pick(dominios);
    var suffix = 1;
    while (usedEmails[email]) {
      email = emailBase + suffix + '@' + pick(dominios);
      suffix++;
    }
    usedEmails[email] = true;

    var prefijo = pick(['11','11','11','15','351','341']);
    var telefono = prefijo + '-' + (4000 + Math.floor(Math.random()*5999)) + '-' + (1000 + Math.floor(Math.random()*8999));

    var famId = 'FAM-' + String(famCounter).padStart(4, '0');
    var legajos = studs.map(function(s) { return s.legajo; });

    studs.forEach(function(s) {
      s.familiaId = famId;
      s.responsable = responsable;
      s.email = email;
      s.telefono = telefono;
    });

    families.push({ id: famId, responsable: responsable, email: email, telefono: telefono, studentIds: legajos });
    famCounter++;
  });

  console.log('  Created ' + families.length + ' families');

  console.log('');
  console.log('STEP 3: Uploading ' + studentsRaw.length + ' students...');
  var batch = db.batch();
  var bc = 0;
  for (var i = 0; i < studentsRaw.length; i++) {
    batch.set(db.collection('students').doc(String(studentsRaw[i].legajo)), studentsRaw[i]);
    bc++;
    if (bc >= 490) { await batch.commit(); batch = db.batch(); bc = 0; process.stdout.write('.'); }
  }
  if (bc > 0) await batch.commit();
  console.log(' OK');

  console.log('STEP 4: Uploading ' + families.length + ' families...');
  batch = db.batch(); bc = 0;
  for (var i = 0; i < families.length; i++) {
    var f = families[i];
    batch.set(db.collection('Familias').doc(f.id), { responsable: f.responsable, email: f.email, telefono: f.telefono, studentIds: f.studentIds });
    bc++;
    if (bc >= 490) { await batch.commit(); batch = db.batch(); bc = 0; process.stdout.write('.'); }
  }
  if (bc > 0) await batch.commit();
  console.log(' OK');

  await db.collection('config').doc('rates').set({ Jardin: 35000, Primaria: 45000, Secundaria: 52000 });
  console.log('STEP 5: Rates configured');

  console.log('');
  console.log('STEP 6: Creating auth accounts (' + families.length + ')...');
  var created = 0, skipped = 0, errors = 0;
  for (var i = 0; i < families.length; i++) {
    var f = families[i];
    var password = 'almafuerte' + f.id.replace('FAM-', '');
    try {
      var existing = null;
      try { existing = await auth.getUserByEmail(f.email); } catch(e) {}
      var uid;
      if (existing) { uid = existing.uid; skipped++; }
      else { var user = await auth.createUser({ email: f.email, password: password, displayName: f.responsable }); uid = user.uid; created++; }
      await db.collection('Familias').doc(f.id).update({ authUid: uid });
    } catch(e) { errors++; }
    if ((i+1) % 100 === 0) console.log('  ' + (i+1) + '/' + families.length);
  }

  console.log('');
  console.log('STEP 7: Verifying...');
  var testFam = await db.collection('Familias').doc('FAM-0001').get();
  if (testFam.exists) {
    var td = testFam.data();
    var testLeg = String(td.studentIds[0]);
    var testStu = await db.collection('students').doc(testLeg).get();
    if (testStu.exists) {
      var sd = testStu.data();
      console.log('  Family FAM-0001: ' + td.responsable + ' (authUid: ' + (td.authUid ? 'YES' : 'NO') + ')');
      console.log('  Student ' + testLeg + ': ' + sd.nombre + ' ' + sd.apellido + ' familiaId=' + sd.familiaId);
      console.log('  Match: ' + (sd.familiaId === 'FAM-0001'));
    }
  }
  var stuCount = await db.collection('students').get();
  var famCount = await db.collection('Familias').get();

  console.log('');
  console.log('=== DONE ===');
  console.log('  Students in DB: ' + stuCount.size);
  console.log('  Families in DB: ' + famCount.size);
  console.log('  Auth created: ' + created + ' | skipped: ' + skipped + ' | errors: ' + errors);
  console.log('  Password: almafuerte0001, almafuerte0002, etc.');
  process.exit(0);
}

run().catch(function(e) { console.error(e); process.exit(1); });
