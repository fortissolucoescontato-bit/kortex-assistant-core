import * as dotenv from "dotenv";
dotenv.config();

import { Groq } from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIProvider = "groq" | "google";

export interface AIResponse {
    text: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
}

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export class ModelAdapter {
    private groq?: Groq;
    private google?: GoogleGenerativeAI;

    constructor() {
        if (process.env.GROQ_API_KEY) {
            this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        }
        if (process.env.GOOGLE_AI_KEY) {
            this.google = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
        }
    }

    async generateResponse(
        messages: ChatMessage[],
        provider: AIProvider = (process.env.DEFAULT_PROVIDER as AIProvider) || "groq",
        model?: string,
        tools?: any[]
    ): Promise<any> {
        if (provider === "groq") {
            return this.generateGroqResponse(messages, model || "llama-3.3-70b-versatile", tools);
        } else {
            return this.generateGoogleResponse(messages, model || "gemini-1.5-pro", tools);
        }
    }

    private async generateGroqResponse(messages: ChatMessage[], model: string, tools?: any[]): Promise<any> {
        if (!this.groq) throw new Error("Groq API key not configured");

        const response = await this.groq.chat.completions.create({
            model,
            messages: messages as any,
            tools: tools as any,
            tool_choice: tools ? "auto" : undefined,
        });

        const choice = response.choices[0]?.message;
        return {
            text: choice?.content || "",
            toolCalls: choice?.tool_calls,
            usage: {
                promptTokens: response.usage?.prompt_tokens || 0,
                completionTokens: response.usage?.completion_tokens || 0,
                totalTokens: response.usage?.total_tokens || 0,
            },
            model: response.model,
        };
    }

    private async generateGoogleResponse(messages: ChatMessage[], model: string, tools?: any[]): Promise<any> {
        if (!this.google) throw new Error("Google AI key not configured");

        const genModel = this.google.getGenerativeModel({
            model,
            tools: tools ? [{ functionDeclarations: tools }] : undefined
        });

        const systemMessage = messages.find(m => m.role === "system")?.content;
        const history = messages
            .filter(m => m.role !== "system")
            .map(m => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }],
            }));

        const chat = genModel.startChat({
            history: history.slice(0, -1),
            systemInstruction: systemMessage,
        });

        const lastMessage = history[history.length - 1];
        if (!lastMessage) throw new Error("No messages to process");

        const result = await chat.sendMessage(lastMessage.parts[0].text);
        const response = await result.response;
        const candidate = response.candidates?.[0];

        return {
            text: response.text(),
            toolCalls: candidate?.content?.parts?.filter(p => p.functionCall).map(p => ({
                id: Math.random().toString(36).substring(7),
                type: "function",
                function: {
                    name: p.functionCall?.name,
                    arguments: JSON.stringify(p.functionCall?.args)
                }
            })),
            model: model,
        };
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.google) throw new Error("Google AI key not configured (needed for embeddings)");
        const model = this.google.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        return result.embedding.values;
    }
}

export const aiAdapter = new ModelAdapter();
