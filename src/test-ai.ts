import { aiAdapter } from "./lib/model-adapter";

async function testGroq() {
    console.log("Testando conexão Groq...");
    try {
        const res = await aiAdapter.generateResponse([{ role: "user", content: "Olá, você está funcionando?" }], "groq");
        console.log("Resposta do Groq:", res.text);
    } catch (e: any) {
        console.error("ERRO NO GROQ:", e.message);
    }
}

testGroq();
