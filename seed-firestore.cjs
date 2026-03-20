// seed-firestore.js
// Run this from your project folder: node seed-firestore.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection } = require('firebase/firestore');

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

// ═══ 12 FAMILIES WITH 28 STUDENTS ═══
const families = [
  { id: "FAM-002", responsable: "María López", email: "maria.lopez@email.com", telefono: "11-4422-0201", studentIds: [2001, 2002] },
  { id: "FAM-003", responsable: "Ana Martínez", email: "ana.martinez@email.com", telefono: "11-4422-0302", studentIds: [3001] },
  { id: "FAM-004", responsable: "Pedro Rodríguez", email: "pedro.rodriguez@email.com", telefono: "11-4422-0403", studentIds: [4001, 4002, 4003] },
  { id: "FAM-005", responsable: "Laura Fernández", email: "laura.fernandez@email.com", telefono: "11-4422-0504", studentIds: [5001] },
  { id: "FAM-006", responsable: "Diego González", email: "diego.gonzalez@email.com", telefono: "11-4422-0605", studentIds: [6001, 6002] },
  { id: "FAM-007", responsable: "Silvia Pérez", email: "silvia.perez@email.com", telefono: "11-4422-0706", studentIds: [7001, 7002] },
  { id: "FAM-008", responsable: "Marcos Díaz", email: "marcos.diaz@email.com", telefono: "11-4422-0807", studentIds: [8001] },
  { id: "FAM-009", responsable: "Gabriela Romero", email: "gabriela.romero@email.com", telefono: "11-4422-0908", studentIds: [9001, 9002, 9003] },
  { id: "FAM-010", responsable: "Fernando Álvarez", email: "fernando.alvarez@email.com", telefono: "11-4422-1009", studentIds: [10001, 10002] },
  { id: "FAM-011", responsable: "Carolina Suárez", email: "carolina.suarez@email.com", telefono: "11-4422-1110", studentIds: [11001] },
  { id: "FAM-012", responsable: "Roberto Medina", email: "roberto.medina@email.com", telefono: "11-4422-1211", studentIds: [12001, 12002] },
  { id: "FAM-013", responsable: "Patricia Herrera", email: "patricia.herrera@email.com", telefono: "11-4422-1312", studentIds: [13001, 13002, 13003] },
];

const students = [
  // FAM-002 - López
  { legajo: 2001, apellido: "López", nombre: "Santiago", nivel: "Jardín", curso: "Sala 5", beca: 0, familiaId: "FAM-002", responsable: "María López", email: "maria.lopez@email.com", telefono: "11-4422-0201" },
  { legajo: 2002, apellido: "López", nombre: "Valentina", nivel: "Primaria", curso: "4°A", beca: 0, familiaId: "FAM-002", responsable: "María López", email: "maria.lopez@email.com", telefono: "11-4422-0201" },
  // FAM-003 - Martínez (beca 50%)
  { legajo: 3001, apellido: "Martínez", nombre: "Joaquín", nivel: "Jardín", curso: "Sala 4", beca: 0.5, familiaId: "FAM-003", responsable: "Ana Martínez", email: "ana.martinez@email.com", telefono: "11-4422-0302" },
  // FAM-004 - Rodríguez (3 hijos, distintos niveles)
  { legajo: 4001, apellido: "Rodríguez", nombre: "Emma", nivel: "Primaria", curso: "3°A", beca: 0, familiaId: "FAM-004", responsable: "Pedro Rodríguez", email: "pedro.rodriguez@email.com", telefono: "11-4422-0403" },
  { legajo: 4002, apellido: "Rodríguez", nombre: "Mateo", nivel: "Secundaria", curso: "1°B", beca: 0, familiaId: "FAM-004", responsable: "Pedro Rodríguez", email: "pedro.rodriguez@email.com", telefono: "11-4422-0403" },
  { legajo: 4003, apellido: "Rodríguez", nombre: "Lola", nivel: "Jardín", curso: "Sala 3", beca: 0, familiaId: "FAM-004", responsable: "Pedro Rodríguez", email: "pedro.rodriguez@email.com", telefono: "11-4422-0403" },
  // FAM-005 - Fernández (beca 100%)
  { legajo: 5001, apellido: "Fernández", nombre: "Isabella", nivel: "Jardín", curso: "Sala 3", beca: 1, familiaId: "FAM-005", responsable: "Laura Fernández", email: "laura.fernandez@email.com", telefono: "11-4422-0504" },
  // FAM-006 - González
  { legajo: 6001, apellido: "González", nombre: "Benjamín", nivel: "Primaria", curso: "4°B", beca: 0, familiaId: "FAM-006", responsable: "Diego González", email: "diego.gonzalez@email.com", telefono: "11-4422-0605" },
  { legajo: 6002, apellido: "González", nombre: "Mía", nivel: "Primaria", curso: "2°A", beca: 0, familiaId: "FAM-006", responsable: "Diego González", email: "diego.gonzalez@email.com", telefono: "11-4422-0605" },
  // FAM-007 - Pérez (1 con beca 25%)
  { legajo: 7001, apellido: "Pérez", nombre: "Olivia", nivel: "Secundaria", curso: "2°A", beca: 0.25, familiaId: "FAM-007", responsable: "Silvia Pérez", email: "silvia.perez@email.com", telefono: "11-4422-0706" },
  { legajo: 7002, apellido: "Pérez", nombre: "Thiago", nivel: "Primaria", curso: "5°B", beca: 0, familiaId: "FAM-007", responsable: "Silvia Pérez", email: "silvia.perez@email.com", telefono: "11-4422-0706" },
  // FAM-008 - Díaz
  { legajo: 8001, apellido: "Díaz", nombre: "Felipe", nivel: "Jardín", curso: "Sala 5", beca: 0, familiaId: "FAM-008", responsable: "Marcos Díaz", email: "marcos.diaz@email.com", telefono: "11-4422-0807" },
  // FAM-009 - Romero (3 hijos)
  { legajo: 9001, apellido: "Romero", nombre: "Catalina", nivel: "Primaria", curso: "3°B", beca: 0, familiaId: "FAM-009", responsable: "Gabriela Romero", email: "gabriela.romero@email.com", telefono: "11-4422-0908" },
  { legajo: 9002, apellido: "Romero", nombre: "Tomás", nivel: "Secundaria", curso: "3°A", beca: 0, familiaId: "FAM-009", responsable: "Gabriela Romero", email: "gabriela.romero@email.com", telefono: "11-4422-0908" },
  { legajo: 9003, apellido: "Romero", nombre: "Clara", nivel: "Jardín", curso: "Sala 4", beca: 0, familiaId: "FAM-009", responsable: "Gabriela Romero", email: "gabriela.romero@email.com", telefono: "11-4422-0908" },
  // FAM-010 - Álvarez
  { legajo: 10001, apellido: "Álvarez", nombre: "Nicolás", nivel: "Secundaria", curso: "2°B", beca: 0, familiaId: "FAM-010", responsable: "Fernando Álvarez", email: "fernando.alvarez@email.com", telefono: "11-4422-1009" },
  { legajo: 10002, apellido: "Álvarez", nombre: "Delfina", nivel: "Primaria", curso: "6°A", beca: 0, familiaId: "FAM-010", responsable: "Fernando Álvarez", email: "fernando.alvarez@email.com", telefono: "11-4422-1009" },
  // FAM-011 - Suárez (beca 75%)
  { legajo: 11001, apellido: "Suárez", nombre: "Facundo", nivel: "Jardín", curso: "Sala 4", beca: 0.75, familiaId: "FAM-011", responsable: "Carolina Suárez", email: "carolina.suarez@email.com", telefono: "11-4422-1110" },
  // FAM-012 - Medina
  { legajo: 12001, apellido: "Medina", nombre: "Camila", nivel: "Primaria", curso: "1°B", beca: 0, familiaId: "FAM-012", responsable: "Roberto Medina", email: "roberto.medina@email.com", telefono: "11-4422-1211" },
  { legajo: 12002, apellido: "Medina", nombre: "Lautaro", nivel: "Secundaria", curso: "1°A", beca: 0, familiaId: "FAM-012", responsable: "Roberto Medina", email: "roberto.medina@email.com", telefono: "11-4422-1211" },
  // FAM-013 - Herrera (3 hijos)
  { legajo: 13001, apellido: "Herrera", nombre: "Abril", nivel: "Primaria", curso: "2°B", beca: 0, familiaId: "FAM-013", responsable: "Patricia Herrera", email: "patricia.herrera@email.com", telefono: "11-4422-1312" },
  { legajo: 13002, apellido: "Herrera", nombre: "Bruno", nivel: "Primaria", curso: "5°A", beca: 0, familiaId: "FAM-013", responsable: "Patricia Herrera", email: "patricia.herrera@email.com", telefono: "11-4422-1312" },
  { legajo: 13003, apellido: "Herrera", nombre: "Renata", nivel: "Jardín", curso: "Sala 5", beca: 0, familiaId: "FAM-013", responsable: "Patricia Herrera", email: "patricia.herrera@email.com", telefono: "11-4422-1312" },
];

// ═══ PAYMENTS (some families paid, some didn't) ═══
const payments = [
  // FAM-002 López - Feb paid, March paid
  { id: "PAY-002-FEB", studentIds: [2001, 2002], familiaId: "FAM-002", mes: "Febrero", monto: 80000, estado: "verificado", metodo: "MercadoPago", fecha: "05/02/2026", referencia: "MP-20260205-101" },
  { id: "PAY-002-MAR", studentIds: [2001, 2002], familiaId: "FAM-002", mes: "Marzo", monto: 80000, estado: "verificado", metodo: "Transferencia", fecha: "04/03/2026", referencia: "TRF-20260304-102" },
  // FAM-003 Martínez - Feb paid, March pending
  { id: "PAY-003-FEB", studentIds: [3001], familiaId: "FAM-003", mes: "Febrero", monto: 17500, estado: "verificado", metodo: "MercadoPago", fecha: "06/02/2026", referencia: "MP-20260206-103" },
  { id: "PAY-003-MAR", studentIds: [3001], familiaId: "FAM-003", mes: "Marzo", monto: 17500, estado: "pendiente", metodo: "Transferencia", fecha: "05/03/2026", referencia: "TRF-20260305-104" },
  // FAM-004 Rodríguez - Feb paid, March unpaid
  { id: "PAY-004-FEB", studentIds: [4001, 4002, 4003], familiaId: "FAM-004", mes: "Febrero", monto: 132000, estado: "verificado", metodo: "MercadoPago", fecha: "07/02/2026", referencia: "MP-20260207-105" },
  // FAM-006 González - Feb paid, March paid
  { id: "PAY-006-FEB", studentIds: [6001, 6002], familiaId: "FAM-006", mes: "Febrero", monto: 90000, estado: "verificado", metodo: "MercadoPago", fecha: "08/02/2026", referencia: "MP-20260208-106" },
  { id: "PAY-006-MAR", studentIds: [6001, 6002], familiaId: "FAM-006", mes: "Marzo", monto: 90000, estado: "verificado", metodo: "MercadoPago", fecha: "06/03/2026", referencia: "MP-20260306-107" },
  // FAM-007 Pérez - Feb paid, March rejected
  { id: "PAY-007-FEB", studentIds: [7001, 7002], familiaId: "FAM-007", mes: "Febrero", monto: 84000, estado: "verificado", metodo: "Transferencia", fecha: "06/02/2026", referencia: "TRF-20260206-108" },
  { id: "PAY-007-MAR", studentIds: [7001, 7002], familiaId: "FAM-007", mes: "Marzo", monto: 84000, estado: "rechazado", metodo: "Transferencia", fecha: "07/03/2026", referencia: "TRF-20260307-109", observaciones: "Monto no coincide" },
  // FAM-008 Díaz - Feb paid only
  { id: "PAY-008-FEB", studentIds: [8001], familiaId: "FAM-008", mes: "Febrero", monto: 35000, estado: "verificado", metodo: "Efectivo", fecha: "07/02/2026", referencia: "EF-20260207-110" },
  // FAM-009 Romero - Feb paid, March pending
  { id: "PAY-009-FEB", studentIds: [9001, 9002, 9003], familiaId: "FAM-009", mes: "Febrero", monto: 132000, estado: "verificado", metodo: "MercadoPago", fecha: "05/02/2026", referencia: "MP-20260205-111" },
  { id: "PAY-009-MAR", studentIds: [9001, 9002, 9003], familiaId: "FAM-009", mes: "Marzo", monto: 132000, estado: "pendiente", metodo: "Transferencia", fecha: "08/03/2026", referencia: "TRF-20260308-112" },
  // FAM-010 Álvarez - Nothing paid
  // FAM-011 Suárez - Feb paid
  { id: "PAY-011-FEB", studentIds: [11001], familiaId: "FAM-011", mes: "Febrero", monto: 8750, estado: "verificado", metodo: "MercadoPago", fecha: "10/02/2026", referencia: "MP-20260210-113" },
  // FAM-012 Medina - Feb and March paid
  { id: "PAY-012-FEB", studentIds: [12001, 12002], familiaId: "FAM-012", mes: "Febrero", monto: 97000, estado: "verificado", metodo: "MercadoPago", fecha: "05/02/2026", referencia: "MP-20260205-114" },
  { id: "PAY-012-MAR", studentIds: [12001, 12002], familiaId: "FAM-012", mes: "Marzo", monto: 97000, estado: "verificado", metodo: "Transferencia", fecha: "03/03/2026", referencia: "TRF-20260303-115" },
  // FAM-013 Herrera - Feb paid, March unpaid
  { id: "PAY-013-FEB", studentIds: [13001, 13002, 13003], familiaId: "FAM-013", mes: "Febrero", monto: 125000, estado: "verificado", metodo: "MercadoPago", fecha: "06/02/2026", referencia: "MP-20260206-116" },
];

async function seed() {
  console.log("Starting seed...\n");

  // Add families
  console.log("Adding 12 families...");
  for (const fam of families) {
    const { id, ...data } = fam;
    await setDoc(doc(db, "Familias", id), data);
    console.log("  ✓ " + id + " - " + data.responsable + " (" + data.studentIds.length + " hijos)");
  }

  // Add students
  console.log("\nAdding " + students.length + " students...");
  for (const stu of students) {
    await setDoc(doc(db, "students", String(stu.legajo)), stu);
    const becaStr = stu.beca > 0 ? " [BECA " + (stu.beca * 100) + "%]" : "";
    console.log("  ✓ " + stu.legajo + " - " + stu.nombre + " " + stu.apellido + " (" + stu.nivel + " " + stu.curso + ")" + becaStr);
  }

  // Add payments
  console.log("\nAdding " + payments.length + " payments...");
  for (const pay of payments) {
    const { id, ...data } = pay;
    await setDoc(doc(db, "payments", id), data);
    const statusIcon = data.estado === "verificado" ? "✓" : data.estado === "pendiente" ? "⏳" : "✗";
    console.log("  " + statusIcon + " " + id + " - " + data.mes + " $" + data.monto.toLocaleString() + " (" + data.estado + ")");
  }

  console.log("\n═══════════════════════════════════");
  console.log("SEED COMPLETE!");
  console.log("═══════════════════════════════════");
  console.log("Families:  12 (+ FAM-001 García que ya existía)");
  console.log("Students:  " + students.length + " (+ 3 García que ya existían)");
  console.log("Payments:  " + payments.length);
  console.log("");
  console.log("Summary by level:");
  const levels = {};
  students.forEach(s => { levels[s.nivel] = (levels[s.nivel] || 0) + 1; });
  Object.entries(levels).forEach(([k, v]) => console.log("  " + k + ": " + v + " alumnos"));
  console.log("");
  console.log("Students with scholarships:");
  students.filter(s => s.beca > 0).forEach(s => console.log("  " + s.nombre + " " + s.apellido + " - " + (s.beca * 100) + "% (" + s.nivel + ")"));
  console.log("");
  console.log("Families with unpaid months:");
  console.log("  FAM-004 Rodríguez - Marzo (3 hijos)");
  console.log("  FAM-005 Fernández - Feb y Marzo (beca 100%, $0)");
  console.log("  FAM-008 Díaz - Marzo");
  console.log("  FAM-010 Álvarez - Feb y Marzo (2 hijos, sin pagar nada)");
  console.log("  FAM-011 Suárez - Marzo");
  console.log("  FAM-013 Herrera - Marzo (3 hijos)");
  console.log("");

  process.exit(0);
}

seed().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
