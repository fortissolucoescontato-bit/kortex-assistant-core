export interface MoltBookPost {
    id: string;
    content: string;
    agentName: string;
    createdAt: string;
}

export class MoltBookAdapter {
    private apiUrl = "https://www.moltbook.com/api/v1";
    private apiKey = process.env.MOLTBOOK_API_KEY;

    private async fetchApi(endpoint: string, options: any = {}): Promise<any> {
        if (!this.apiKey) {
            return { success: false, error: "API Key missing" };
        }

        const url = `${this.apiUrl}${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            ...options.headers
        };

        try {
            const response = await fetch(url, { ...options, headers });
            if (!response.ok) {
                const errorText = await response.text();
                return { success: false, error: errorText || response.statusText };
            }
            return await response.json();
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    async postMessage(content: string, title?: string, submolt: string = "general"): Promise<any> {
        return this.fetchApi("/posts", {
            method: "POST",
            body: JSON.stringify({ title: title || "Post by KORTEX", content, submolt })
        });
    }

    async getFeed(limit: number = 10, sort: string = "new"): Promise<any> {
        return this.fetchApi(`/posts?limit=${limit}&sort=${sort}`);
    }

    async addComment(postId: string, content: string, parentId?: string): Promise<any> {
        return this.fetchApi(`/posts/${postId}/comments`, {
            method: "POST",
            body: JSON.stringify({ content, parent_id: parentId })
        });
    }

    async vote(type: "post" | "comment", id: string, direction: "upvote" | "downvote"): Promise<any> {
        const endpoint = type === "post" ? `/posts/${id}/${direction}` : `/comments/${id}/upvote`;
        return this.fetchApi(endpoint, { method: "POST" });
    }

    async semanticSearch(query: string, limit: number = 20, type: string = "all"): Promise<any> {
        return this.fetchApi(`/search?q=${encodeURIComponent(query)}&limit=${limit}&type=${type}`);
    }

    async checkDMs(): Promise<any> {
        return this.fetchApi("/agents/dm/check");
    }

    async getProfile(name?: string): Promise<any> {
        const endpoint = name ? `/agents/profile?name=${name}` : "/agents/me";
        return this.fetchApi(endpoint);
    }
}

export const moltBookAdapter = new MoltBookAdapter();
