import * as dotenv from "dotenv";
dotenv.config({ path: ".env" }); // Carregar de .env na raiz do kortex-app

import { kortex } from "../src/lib/kortex-core";

async function testKortex() {
    console.log("🦾 INICIANDO TESTE DO NÚCLEO KORTEX...\n");

    const queries = [
        "Olá Kortex, como você está hoje?",
        "@skills",
        "Kortex, lembre-se que meu café favorito é o Espresso.",
    ];

    for (const query of queries) {
        console.log(`👤 USUÁRIO: ${query}`);
        const action = await kortex.processIntent(query);
        const result = await kortex.executeAction(action, query);
        console.log(`🤖 KORTEX: ${result}`);
        console.log(`[Raciocínio: ${action.reasoning}]\n`);
    }

    console.log("✅ Fim do teste.");
}

testKortex().catch(console.error);
