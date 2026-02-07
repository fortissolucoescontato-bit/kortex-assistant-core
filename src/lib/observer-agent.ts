import { aiAdapter, ChatMessage } from "../lib/model-adapter";

export interface ExecutionLog {
    timestamp: string;
    userInput: string;
    actionType: string;
    reasoning: string;
    result: string;
    success: boolean;
}

export class ObserverAgent {
    private logs: ExecutionLog[] = [];

    logExecution(log: ExecutionLog) {
        this.logs.push(log);
        console.log(`[OBSERVER] Log registrado para ${log.actionType}`);
    }

    async analyzePerformance(): Promise<string> {
        if (this.logs.length === 0) return "Sem logs para analisar.";

        const logSummary = this.logs.map(l =>
            `[${l.actionType}] User: ${l.userInput} -> Reasoning: ${l.reasoning} -> Success: ${l.success}`
        ).join("\n");

        const prompt: ChatMessage[] = [
            {
                role: "system",
                content: "Você é um Supervisor de Performance de IA. Analise os logs de execução do KORTEX e identifique padrões de falha ou oportunidades de melhoria nos prompts de sistema."
            },
            { role: "user", content: `Aqui estão os logs recentes:\n${logSummary}\n\nQuais são suas recomendações?` }
        ];

        const response = await aiAdapter.generateResponse(prompt, "groq", "llama-3.3-70b-versatile");
        return response.text;
    }

    async getOptimizationProposals(): Promise<string[]> {
        if (this.logs.length < 5) return [];

        const failures = this.logs.filter(l => !l.success);
        if (failures.length === 0) return [];

        const logSummary = failures.map(l =>
            `Erro em ${l.actionType}: ${l.result.substring(0, 100)}...`
        ).join("\n");

        const prompt: ChatMessage[] = [
            {
                role: "system",
                content: "Você é um Especialista em Auto-Melhoria de IA. Com base nos erros fornecidos, sugira uma refatoração específica para um dos arquivos do núcleo (kortex-core.ts, model-adapter.ts, shell-tool.ts). Retorne apenas um array JSON de strings com as propostas."
            },
            { role: "user", content: `Erros recentes:\n${logSummary}` }
        ];

        const response = await aiAdapter.generateResponse(prompt);
        try {
            const match = response.text.match(/\[[^]*\]/);
            return match ? JSON.parse(match[0]) : [];
        } catch {
            return [];
        }
    }

    getLogs() {
        return this.logs;
    }
}

export const observerAgent = new ObserverAgent();
