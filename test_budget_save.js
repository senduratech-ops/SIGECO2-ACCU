// Test Budget API
const API_BASE = 'http://localhost:4000/api';

async function testBudgetSave() {
    console.log("=== TESTING BUDGET SAVE ===\n");

    try {
        // 1. Create budget
        console.log("[1] Creating budget...");
        const createRes = await fetch(`${API_BASE}/budgets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_proyecto: 1, titulo: 'Test Budget', descripcion_alcance: 'Testing save' })
        });
        const budget = await createRes.json();
        console.log("   Created:", budget);
        const id_presupuesto = budget.id_presupuesto;

        // 2. Add material
        console.log("\n[2] Adding material...");
        const matRes = await fetch(`${API_BASE}/budgets/materiales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_presupuesto, id_material: 1, cantidad: 5, costo_unitario: 100 })
        });
        console.log("   Material:", await matRes.json());

        // 3. Add mano de obra
        console.log("\n[3] Adding mano de obra...");
        const moRes = await fetch(`${API_BASE}/budgets/mano-obra`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_presupuesto, cargo: 'Albañil', costo_hora: 15, horas: 8, personas: 2 })
        });
        console.log("   Mano Obra:", await moRes.json());

        // 4. Get budget by ID
        console.log("\n[4] Getting budget details...");
        const getRes = await fetch(`${API_BASE}/budgets/${id_presupuesto}`);
        const fullBudget = await getRes.json();
        console.log("   Full Budget:", JSON.stringify(fullBudget, null, 2));

    } catch (error) {
        console.error("ERROR:", error);
    }
}

testBudgetSave();
