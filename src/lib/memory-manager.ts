import { createClient } from "@supabase/supabase-js";
import { aiAdapter } from "./model-adapter";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface Memory {
    id?: string;
    content: string;
    metadata?: any;
    created_at?: string;
}

/**
 * Manages both Episodic and Semantic memory using Supabase PGVector.
 */
export class MemoryManager {
    private supabase = createClient(supabaseUrl, supabaseKey);

    async storeMemory(content: string, metadata: any = {}): Promise<void> {
        console.log(`[MEMORY] Memorizando: "${content.substring(0, 50)}..."`);
        const embedding = await aiAdapter.generateEmbedding(content);

        const { error } = await this.supabase
            .from("kortex_memories")
            .insert({
                content,
                embedding,
                metadata,
            });

        if (error) {
            console.error("[MEMORY] Erro ao salvar memória:", error);
            // Fallback: se a tabela não existir, apenas log para agora
        }
    }

    /**
     * Searches for relevant memories using vector similarity search.
     */
    async searchMemory(query: string, limit: number = 5): Promise<Memory[]> {
        try {
            const embedding = await aiAdapter.generateEmbedding(query);

            // RPC call para busca vetorial
            const { data, error } = await this.supabase.rpc("match_memories", {
                query_embedding: embedding,
                match_threshold: 0.7,
                match_count: limit,
            });

            if (!error && data) return data;
        } catch (e: any) {
            console.warn("[MEMORY] Falha na busca vetorial, tentando fallback de texto:", e.message);
        }

        // Fallback: busca por texto simples
        const { data, error } = await this.supabase
            .from("kortex_memories")
            .select("id, content, metadata")
            .ilike("content", `%${query}%`)
            .limit(limit);

        if (error) {
            console.error("[MEMORY] Erro no fallback de memória:", error);
            return [];
        }

        return data || [];
    }
}

export const memoryManager = new MemoryManager();
