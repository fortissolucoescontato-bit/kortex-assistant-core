import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { aiAdapter } from "./lib/model-adapter";
import { memoryManager } from "./lib/memory-manager";
import { skillEngine } from "./lib/skill-engine";
import { kortex } from "./lib/kortex-core";
import * as fs from "fs";
import * as path from "path";

async function runTests() {
    console.log("🚀 INICIANDO VERIFICAÇÃO INTEGRAL DO KORTEX\n");
    let failed = 0;

    const test = async (name: string, fn: () => Promise<void>) => {
        try {
            process.stdout.write(`🔹 [TESTE] ${name.padEnd(40, ".")}`);
            await fn();
            console.log(" ✅ [SUCESSO]");
        } catch (e: any) {
            console.log(` ❌ [FALHA]`);
            console.error(`   > Motivo: ${e.message}\n`);
            failed++;
        }
    };

    // 1. AMBIENTE
    await test("Configuração de Ambiente (.env)", async () => {
        if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY ausente");
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("Supabase URL ausente");
    });

    // 2. IA ADAPTER
    await test("Conectividade AI (Groq)", async () => {
        const res = await aiAdapter.generateResponse([{ role: "user", content: "Ping" }], "groq", "llama-3.3-70b-versatile");
        if (!res.text) throw new Error("Resposta vazia da IA");
    });

    // 3. SKILL ENGINE
    await test("Skill Engine (Busca e Carga)", async () => {
        const skills = skillEngine.findRelevantSkills("game", 1);
        if (skills.length === 0) throw new Error("Nenhuma skill encontrada para 'game'");
    });

    // 4. MEMORIA (Opcional - pode falhar se Supabase estiver offline)
    await test("Gerenciador de Memória (Supabase)", async () => {
        await memoryManager.searchMemory("teste", 1);
    });

    // 5. AGENTE (Loop Agêntico)
    await test("Motor Agêntico (Loop ReAct/Shell)", async () => {
        const result = await kortex.thinkingLoop("Diga 'OK' se você consegue ler o sistema.");
        if (!result.toLowerCase().includes("ok")) throw new Error("Falha no loop de raciocínio");
    });

    // 6. NEXUS ARCADE
    await test("Nexus Arcade (Estrutura e Config)", async () => {
        const nexusPath = path.join(process.cwd(), "src/nexus-arcade/config.json");
        if (!fs.existsSync(nexusPath)) throw new Error("Nexus config.json não encontrado");
        const config = JSON.parse(fs.readFileSync(nexusPath, "utf-8"));
        if (!config.hubName) throw new Error("Configuração do Nexus inválida");
    });

    console.log("\n" + "=".repeat(50));
    if (failed === 0) {
        console.log("🏆 TODOS OS SISTEMAS OPERACIONAIS - KORTEX ESTÁ 100%");
    } else {
        console.log(`⚠️ VERIFICAÇÃO CONCLUÍDA COM ${failed} FALHA(S).`);
    }
    console.log("=".repeat(50));
}

runTests().catch(console.error);
