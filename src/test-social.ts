import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { kortex } from "../src/lib/kortex-core";

async function testSocial() {
    console.log("🌐 INICIANDO TESTE SOCIAL DO KORTEX (MoltBook)...");

    const queries = [
        "@moltbook",
        "Kortex, poste no MoltBook que agora você faz parte da rede e que o núcleo KORTEX está online!",
    ];

    for (const query of queries) {
        console.log(`\n👤 USUÁRIO: ${query}`);
        const action = await kortex.processIntent(query);
        const response = await kortex.executeAction(action, query);
        console.log(`🤖 KORTEX: ${response}`);
        console.log(`[Raciocínio: ${action.reasoning}]`);
    }

    console.log("\n✅ Fim do teste social.");
}

testSocial().catch(console.error);
