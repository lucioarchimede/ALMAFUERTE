// seed-600.cjs
// Run: node seed-600.cjs
// Creates ~200 families with ~600 students and varied payments

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDe7BDHcxksqNkExUvZB3UIZAr9hBdg14Q",
  authDomain: "cobranzas-f092a.firebaseapp.com",
  projectId: "cobranzas-f092a",
  storageBucket: "cobranzas-f092a.firebasestorage.app",
  messagingSenderId: "2530313930",
  appId: "1:2530313930:web:c7e1041d7059fafec25633"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ═══ Argentine name pools ═══
const apellidos = [
  "García","Rodríguez","Martínez","López","González","Pérez","Sánchez","Ramírez","Torres","Flores",
  "Rivera","Gómez","Díaz","Cruz","Morales","Reyes","Gutiérrez","Ortiz","Ramos","Romero",
  "Herrera","Medina","Castro","Vargas","Rojas","Fernández","Álvarez","Suárez","Jiménez","Ruiz",
  "Molina","Silva","Aguirre","Cabrera","Mendoza","Figueroa","Acosta","Sosa","Vera","Peralta",
  "Benítez","Giménez","Cardozo","Ledesma","Arias","Pereyra","Domínguez","Paz","Miranda","Vega",
  "Campos","Bravo","Contreras","Navarro","Ponce","Villalba","Ojeda","Lucero","Correa","Godoy",
  "Ríos","Luna","Fuentes","Espinoza","Carrizo","Bustos","Maldonado","Ibáñez","Barreto","Quiroga",
  "Duarte","Palacios","Barrios","Sandoval","Escobar","Paredes","Moreno","Núñez","Guerrero","Leiva"
];

const nombresM = [
  "Martín","Santiago","Mateo","Tomás","Joaquín","Benjamín","Lautaro","Felipe","Nicolás","Thiago",
  "Bautista","Valentín","Lucas","Facundo","Agustín","Bruno","Franco","Máximo","Ignacio","Simón",
  "Federico","Emilio","Lorenzo","Dante","Gael","Santino","Ciro","Ramiro","Tobías","Juan",
  "Pedro","Ezequiel","Alejo","Genaro","Manuel","Luca","Salvador","Elías","Julián","Enzo"
];

const nombresF = [
  "Sofía","Emma","Valentina","Mía","Catalina","Olivia","Isabella","Lucía","Delfina","Alma",
  "Abril","Renata","Martina","Emilia","Julia","Juana","Lola","Clara","Pilar","Bianca",
  "Camila","Agustina","Victoria","Milagros","Josefina","Julieta","Florencia","Paloma","Amparo","Zoe",
  "Elena","Mora","Rosario","Nina","Celeste","Malena","Lara","Jazmín","Trinidad","Sol"
];

const niveles = ["Jardín","Primaria","Secundaria"];
const cursosJardin = ["Sala 3","Sala 4","Sala 5"];
const cursosPrimaria = ["1°A","1°B","2°A","2°B","3°A","3°B","4°A","4°B","5°A","5°B","6°A","6°B"];
const cursosSecundaria = ["1°A","1°B","2°A","2°B","3°A","3°B","4°A","4°B","5°A","5°B"];

const metodos = ["MercadoPago","Transferencia","Efectivo"];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getCurso(nivel) {
  if (nivel === "Jardín") return pick(cursosJardin);
  if (nivel === "Primaria") return pick(cursosPrimaria);
  return pick(cursosSecundaria);
}

function getBeca() {
  const r = Math.random();
  if (r < 0.80) return 0;       // 80% sin beca
  if (r < 0.90) return 0.25;    // 10% beca 25%
  if (r < 0.95) return 0.50;    // 5% beca 50%
  if (r < 0.98) return 0.75;    // 3% beca 75%
  return 1;                      // 2% beca 100%
}

function genEmail(nombre, apellido, idx) {
  const n = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "");
  const a = apellido.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "");
  return `${n}.${a}${idx}@email.com`;
}

// ═══ GENERATE DATA ═══
const families = [];
const students = [];
const payments = [];

let legajoCounter = 5000;
let familyCounter = 100;

// Generate ~200 families
for (let f = 0; f < 200; f++) {
  const apellido = pick(apellidos);
  const numHijos = Math.random() < 0.45 ? 1 : (Math.random() < 0.7 ? 2 : 3);
  const familyId = `FAM-${String(familyCounter).padStart(3, "0")}`;
  const isFemaleResp = Math.random() > 0.5;
  const respNombre = isFemaleResp ? pick(nombresF) : pick(nombresM);
  const email = genEmail(respNombre, apellido, familyCounter);
  const telefono = `11-${rand(4000,9999)}-${rand(1000,9999)}`;
  
  const studentIds = [];
  
  for (let h = 0; h < numHijos; h++) {
    const isFemale = Math.random() > 0.5;
    const nombre = isFemale ? pick(nombresF) : pick(nombresM);
    const nivel = pick(niveles);
    const curso = getCurso(nivel);
    const beca = getBeca();
    const legajo = legajoCounter++;
    
    studentIds.push(legajo);
    
    students.push({
      legajo,
      apellido,
      nombre,
      nivel,
      curso,
      beca,
      familiaId: familyId,
      responsable: `${respNombre} ${apellido}`,
      email,
      telefono
    });
  }
  
  families.push({
    id: familyId,
    responsable: `${respNombre} ${apellido}`,
    email,
    telefono,
    studentIds
  });
  
  familyCounter++;
}

// ═══ GENERATE PAYMENTS ═══
// Current month: March (index 1 in our school year array)
// Months to generate payments for: Febrero (index 0) and Marzo (index 1)
const meses = ["Febrero", "Marzo"];
const rates = { "Jardín": 35000, "Primaria": 45000, "Secundaria": 52000 };

let payCounter = 1000;

for (const family of families) {
  const famStudents = students.filter(s => s.familiaId === family.id);
  
  for (const mes of meses) {
    // 70% chance paid Febrero, 50% chance paid Marzo
    const payChance = mes === "Febrero" ? 0.75 : 0.50;
    
    if (Math.random() < payChance) {
      const monto = famStudents.reduce((sum, s) => {
        return sum + Math.round((rates[s.nivel] || 0) * (1 - (s.beca || 0)));
      }, 0);
      
      if (monto === 0) continue; // Skip if all students have 100% scholarship
      
      // Determine status
      let estado;
      const statusRoll = Math.random();
      if (statusRoll < 0.80) estado = "verificado";
      else if (statusRoll < 0.95) estado = "pendiente";
      else estado = "rechazado";
      
      const metodo = pick(metodos);
      const dia = rand(1, 10);
      const mesNum = mes === "Febrero" ? "02" : "03";
      const fecha = `${String(dia).padStart(2, "0")}/${mesNum}/2026`;
      const prefix = metodo === "MercadoPago" ? "MP" : metodo === "Transferencia" ? "TRF" : "EF";
      const referencia = `${prefix}-2026${mesNum}${String(dia).padStart(2, "0")}-${payCounter}`;
      
      let observaciones = "";
      if (estado === "rechazado") {
        observaciones = pick(["Monto no coincide", "CBU incorrecto", "Transferencia no encontrada", "Comprobante ilegible"]);
      }
      
      payments.push({
        id: `PAY-${payCounter}`,
        studentIds: famStudents.map(s => s.legajo),
        familiaId: family.id,
        mes,
        monto,
        estado,
        metodo,
        fecha,
        referencia,
        observaciones
      });
      
      payCounter++;
    }
  }
}

// ═══ WRITE TO FIRESTORE ═══
async function seed() {
  console.log("═══════════════════════════════════════════");
  console.log("  SEED 600 STUDENTS");
  console.log("═══════════════════════════════════════════\n");
  console.log(`Families to create: ${families.length}`);
  console.log(`Students to create: ${students.length}`);
  console.log(`Payments to create: ${payments.length}\n`);
  
  // Firestore writeBatch supports max 500 operations per batch
  // We'll batch our writes
  
  // Write families
  console.log("Writing families...");
  let batch = writeBatch(db);
  let batchCount = 0;
  
  for (const fam of families) {
    const { id, ...data } = fam;
    batch.set(doc(db, "Familias", id), data);
    batchCount++;
    if (batchCount >= 490) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
      process.stdout.write(".");
    }
  }
  if (batchCount > 0) { await batch.commit(); }
  console.log(` ✓ ${families.length} families`);
  
  // Write students
  console.log("Writing students...");
  batch = writeBatch(db);
  batchCount = 0;
  
  for (const stu of students) {
    batch.set(doc(db, "students", String(stu.legajo)), stu);
    batchCount++;
    if (batchCount >= 490) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
      process.stdout.write(".");
    }
  }
  if (batchCount > 0) { await batch.commit(); }
  console.log(` ✓ ${students.length} students`);
  
  // Write payments
  console.log("Writing payments...");
  batch = writeBatch(db);
  batchCount = 0;
  
  for (const pay of payments) {
    const { id, ...data } = pay;
    batch.set(doc(db, "payments", id), data);
    batchCount++;
    if (batchCount >= 490) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
      process.stdout.write(".");
    }
  }
  if (batchCount > 0) { await batch.commit(); }
  console.log(` ✓ ${payments.length} payments`);
  
  // Print summary
  console.log("\n═══════════════════════════════════════════");
  console.log("  SEED COMPLETE!");
  console.log("═══════════════════════════════════════════\n");
  
  // Level distribution
  const byLevel = {};
  students.forEach(s => { byLevel[s.nivel] = (byLevel[s.nivel] || 0) + 1; });
  console.log("Students by level:");
  Object.entries(byLevel).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  
  // Scholarship distribution
  const withBeca = students.filter(s => s.beca > 0);
  console.log(`\nStudents with scholarships: ${withBeca.length}/${students.length}`);
  const becaDist = {};
  withBeca.forEach(s => { const k = (s.beca * 100) + "%"; becaDist[k] = (becaDist[k] || 0) + 1; });
  Object.entries(becaDist).forEach(([k, v]) => console.log(`  ${k}: ${v} students`));
  
  // Family size distribution
  const sizes = {};
  families.forEach(f => { const k = f.studentIds.length + " hijos"; sizes[k] = (sizes[k] || 0) + 1; });
  console.log("\nFamily sizes:");
  Object.entries(sizes).forEach(([k, v]) => console.log(`  ${k}: ${v} families`));
  
  // Payment summary
  const payByStatus = {};
  payments.forEach(p => { payByStatus[p.estado] = (payByStatus[p.estado] || 0) + 1; });
  console.log("\nPayments by status:");
  Object.entries(payByStatus).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  
  const totalRecaudado = payments.filter(p => p.estado === "verificado").reduce((s, p) => s + p.monto, 0);
  console.log(`\nTotal collected (verificado): $${totalRecaudado.toLocaleString()}`);
  
  console.log("\n✓ All done! Refresh your app to see the data.\n");
  process.exit(0);
}

seed().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
