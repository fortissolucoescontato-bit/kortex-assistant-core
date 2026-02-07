import { kortex } from "./lib/kortex-core";

async function main() {
    console.log("=== TESTE DE LOOP AGÊNTICO KORTEX ===");

    // Teste 1: Tarefa que exige múltiplos passos (Listar -> Ver conteúdo)
    const task = "Liste os arquivos na raiz do projeto e me diga o que tem no package.json";

    console.log(`Tarefa: ${task}`);

    const response = await kortex.thinkingLoop(task);

    console.log("\n--- RESPOSTA FINAL ---");
    console.log(response);
}

main().catch(console.error);
