"use strict";
"use server";

import { kortex } from "@/lib/kortex-core";

export async function processMessage(message: string) {
    try {
        const action = await kortex.processIntent(message);
        const response = await kortex.executeAction(action, message);

        return {
            success: true,
            response,
            action: {
                type: action.type,
                reasoning: action.reasoning
            }
        };
    } catch (error: any) {
        console.error("[ACTION ERROR]", error);
        return {
            success: false,
            error: error.message || "Erro desconhecido ao processar sua solicitação."
        };
    }
}

export async function getSkills() {
    try {
        const { skillEngine } = await import("@/lib/skill-engine");
        return { success: true, skills: skillEngine.getAllSkills(true) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateSkillStatus(name: string, enabled: boolean) {
    try {
        const { skillEngine } = await import("@/lib/skill-engine");
        skillEngine.toggleSkill(name, enabled);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
