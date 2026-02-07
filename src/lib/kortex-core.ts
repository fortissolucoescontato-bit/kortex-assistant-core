import { aiAdapter, ChatMessage } from "./model-adapter";
import { memoryManager } from "./memory-manager";
import { skillEngine } from "./skill-engine";
import { observerAgent } from "./observer-agent";
import { observerAgent } from "./observer-agent";
import { ShellTool } from "./shell-tool";
import * as path from "path";
import * as fs from "fs";

const shell = new ShellTool();

export interface KortexAction {
    type: "chat" | "skill" | "memory" | "system" | "agent";
    payload: any;
    reasoning: string;
}

/**
 * KortexCore is the main orchestrator for the AI assistant.
 * It manages intent processing, action execution, and coordinates
 * between memory, skills, and the AI models.
 */
export class KortexCore {
    private skillsPath = path.join(process.cwd(), "skills");
    private nexusUrl = "https://nexus-arcade-hub.vercel.app/";
    private maxSteps = 5;

    constructor() {
        // Inicializar skills via índice ou scan
        skillEngine.loadSkillsFromDirectory(this.skillsPath).catch(console.error);
    }

    /**
     * Processes user input to identify the intended action.
     */
    async processIntent(userInput: string): Promise<KortexAction> {
        // 0. Verificar comandos de sistema diretos
        if (userInput.trim().toLowerCase() === "@skills") {
            return {
                type: "system",
                payload: { command: "list_skills" },
                reasoning: "Usuário solicitou explicitamente a lista de skills disponíveis."
            };
        }


        // 1. Buscar memórias relevantes
        let memoryContext = "";
        try {
            const relevantMemories = await memoryManager.searchMemory(userInput);
            if (relevantMemories.length > 0) {
                memoryContext = "\nMemórias Relevantes:\n" + relevantMemories.map(m => `- ${m.content}`).join("\n");
            }
        } catch (e) {
            console.warn("[KORTEX] Falha ao buscar memórias:", e);
        }

        // 2. Buscar skills relevantes (usando o índice otimizado)
        const relevantSkills = skillEngine.findRelevantSkills(userInput, 10);
        const availableSkills = relevantSkills
            .map((s: any) => `- ${s.name}: ${s.description}`)
            .join("\n");

        const prompt: ChatMessage[] = [
            {
                role: "system",
                content: `
                    Você é o núcleo de processamento do assistente KORTEX.
                    Analise o input do usuário e decida a melhor ação.
                    
                    ${memoryContext}
                    
                    Skills Disponíveis:
                    ${availableSkills}
                    
                    Se a tarefa for complexa (envolver arquivos, shell, ou múltiplos passos), use type "agent".
                    Se for apenas conversa ou algo simples das skills, use os tipos específicos.
                    
                    Retorne JSON:
                    {
                        "type": "chat" | "skill" | "memory" | "system" | "agent",
                        "payload": { ... },
                        "reasoning": "Sua explicação"
                    }
                `
            },
            { role: "user", content: userInput }
        ];

        try {
            const response = await aiAdapter.generateResponse(prompt, "groq", "llama-3.3-70b-versatile");
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]) as KortexAction;
            }
            throw new Error("No JSON found");
        } catch (e) {
            return {
                type: "chat",
                payload: { response: "Peço desculpas, tive um problema ao analisar sua intenção." },
                reasoning: "Fallback devido a erro de parsing."
            };
        }
    }

    /**
     * Ciclo de raciocínio principal (ReAct).
     */
    async thinkingLoop(userInput: string): Promise<string> {
        let messages: ChatMessage[] = [
            {
                role: "system",
                content: `Você é o KORTEX, um assistente agêntico autônomo.
                Objetivo: Resolver a tarefa do usuário da forma mais precisa possível usando as ferramentas disponíveis.
                
                Instruções de Operação:
                1. **Pense**: Primeiro, explique brevemente sua estratégia antes de chamar qualquer ferramenta.
                2. **Aja**: Use as ferramentas (run_bash, read_file) quando necessário. Você pode chamar múltiplas ferramentas se precisar.
                3. **Observe**: Analise os resultados fornecidos pelo sistema.
                4. **Conclua**: Quando a tarefa estiver terminada, forneça a resposta final diretamente, sem mais chamadas de ferramentas.
                
                IMPORTANTE: Se você precisar ler um arquivo, primeiro verifique se ele existe listando o diretório com run_bash.`
            },
            { role: "user", content: userInput }
        ];

        let step = 0;
        let finalResponse = "";

        while (step < this.maxSteps) {
            console.log(`[LOOP ANTIGRAVITY] Passo ${step + 1}...`);
            const tools = this.getAvailableTools();
            const response = await aiAdapter.generateResponse(messages, "groq", "llama-3.3-70b-versatile", tools);

            let toolCalls = response.toolCalls || [];

            // FALLBACK: Parser Manual ultra-flexível
            if (toolCalls.length === 0) {
                const regex = /<function.*?(\w+).*?(\{[^]*?\}).*?\/?>/g;
                let match;
                while ((match = regex.exec(response.text)) !== null) {
                    try {
                        toolCalls.push({
                            id: Math.random().toString(36).substring(7),
                            type: "function",
                            function: { name: match[1], arguments: match[2].trim() }
                        });
                    } catch (e) {
                        console.error("Erro ao parsear argumentos da ferramenta:", e);
                    }
                }
            }

            if (toolCalls.length > 0) {
                // Limpar tags da resposta para o histórico
                const assistantContent = response.text.replace(/<function.*?\/?>/g, "").trim();
                messages.push({ role: "assistant", content: assistantContent || "Executando ferramentas..." });

                for (const toolCall of toolCalls) {
                    console.log(`[LOOP ANTIGRAVITY] Chamando ferramenta: ${toolCall.function.name}`);
                    const result = await this.callTool(toolCall);
                    messages.push({
                        role: "system",
                        content: `Resultado de [${toolCall.function.name}]:\n${result}`
                    } as any);
                }
            } else {
                finalResponse = response.text;
                break;
            }
            step++;
        }
        console.log(`[LOOP ANTIGRAVITY] Ciclo finalizado em ${step} passos.`);
        return finalResponse || "Tarefa concluída.";
    }

    private getAvailableTools() {
        return [
            {
                type: "function",
                function: {
                    name: "run_bash",
                    description: "Executa comandos bash de forma segura.",
                    parameters: {
                        type: "object",
                        properties: { command: { type: "string" } },
                        required: ["command"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "read_file",
                    description: "Lê um arquivo do sistema.",
                    parameters: {
                        type: "object",
                        properties: { path: { type: "string" } },
                        required: ["path"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "self_refactor",
                    description: "Analisa o próprio código e aplica melhorias baseadas em logs de erro.",
                    parameters: {
                        type: "object",
                        properties: {
                            explanation: { type: "string", description: "Por que mudar?" },
                            filePath: { type: "string", description: "Arquivo a ser mudado." },
                            newContent: { type: "string", description: "Novo conteúdo completo." }
                        },
                        required: ["explanation", "filePath", "newContent"]
                    }
                }
            }
        ];
    }

    private async callTool(toolCall: any): Promise<string> {
        const { name, arguments: argsString } = toolCall.function;
        const args = JSON.parse(argsString);

        switch (name) {
            case "self_refactor": {
                const refactorPath = path.join(process.cwd(), args.filePath);
                if (fs.existsSync(refactorPath)) {
                    fs.writeFileSync(refactorPath, args.newContent);
                    // Registrar no Jornal de Evolução
                    const logEntry = `\n## [EVOLUÇÃO] ${new Date().toISOString()}\n- **Arquivo**: ${args.filePath}\n- **Motivo**: ${args.explanation}\n`;
                    fs.appendFileSync(path.join(process.cwd(), "docs/evolution/CHANGELOG.md"), logEntry);
                    return `Sucesso: Código refatorado e evolução registrada.`;
                }
                return "Erro: Arquivo não encontrado.";
            }
            case "run_bash":
                const res = await shell.execute(args.command);
                return `STDOUT: ${res.stdout}\nSTDERR: ${res.stderr}`;
            case "read_file": {
                const fPath = path.join(process.cwd(), args.path);
                if (fs.existsSync(fPath)) return fs.readFileSync(fPath, "utf-8");
                return "Erro: Arquivo não encontrado.";
            }
            default:
                return "Erro: Ferramenta não implementada.";
        }
    }

    /**
     * Executes the determined action.
     */
    async executeAction(action: KortexAction, userInput: string): Promise<string> {
        console.log(`[KORTEX] Executando: ${action.type}`);

        try {
            switch (action.type) {
                case "agent":
                    return await this.thinkingLoop(userInput);
                case "chat":
                    return action.payload.response || "Compreendido.";
                case "system":
                    if (action.payload.command === "list_skills") {
                        const all = skillEngine.getAllSkills();
                        return `Possuo ${all.length} especialistas prontos.`;
                    }
                    return "Comando ignorado.";
                case "skill":
                    const skill = skillEngine.getSkill(action.payload.skillName);
                    if (skill) {
                        const prompt: ChatMessage[] = [
                            { role: "system", content: skill.instructions },
                            { role: "user", content: action.payload.query }
                        ];
                        const res = await aiAdapter.generateResponse(prompt);
                        return res.text;
                    }
                    return "Skill não encontrada.";
                default:
                    return "Tipo de ação não suportado.";
            }
        } catch (e: any) {
            return `Erro fatal: ${e.message}`;
        }
    }
}

export const kortex = new KortexCore();
