import * as fs from "fs";
import * as path from "path";

export interface SkillDefinition {
    name: string;
    description: string;
    instructions: string;
    path: string;
}

export class SkillEngine {
    private skills: Map<string, SkillDefinition> = new Map();
    private skillIndex: any[] = [];
    private disabledSkills: Set<string> = new Set();
    private configPath = path.join(process.cwd(), "src/lib/skills_config.json");

    constructor() {
        this.loadIndex();
        this.loadConfig();
    }

    private loadIndex() {
        try {
            const indexPath = path.join(process.cwd(), "src/lib/skills_index.json");
            if (fs.existsSync(indexPath)) {
                this.skillIndex = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
                console.log(`[SKILLS] Índice estático carregado: ${this.skillIndex.length} skills.`);
            }
        } catch (e) {
            console.warn("[SKILLS] Falha ao carregar índice estático:", e);
        }
    }

    private loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, "utf-8"));
                this.disabledSkills = new Set(config.disabledSkills || []);
            }
        } catch (e) {
            console.warn("[SKILLS] Falha ao carregar config de skills:", e);
        }
    }

    private saveConfig() {
        try {
            const config = { disabledSkills: Array.from(this.disabledSkills) };
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 4));
        } catch (e) {
            console.error("[SKILLS] Falha ao salvar config de skills:", e);
        }
    }

    toggleSkill(name: string, enabled: boolean) {
        if (enabled) {
            this.disabledSkills.delete(name);
        } else {
            this.disabledSkills.add(name);
        }
        this.saveConfig();
        console.log(`[SKILLS] Skill ${name} agora está ${enabled ? 'ATIVA' : 'INATIVA'}.`);
    }

    isSkillEnabled(name: string): boolean {
        return !this.disabledSkills.has(name);
    }

    async loadSkillsFromDirectory(dirPath: string): Promise<void> {
        if (this.skillIndex.length > 0) return;
        // Fallback para escaneamento inicial se o índice não existir
        // (Lógica omitida por brevidade, pois usamos o índice estático gerado anteriormente)
    }

    async getSkillInstructions(name: string): Promise<string | undefined> {
        if (!this.isSkillEnabled(name)) return undefined;

        const cached = this.skills.get(name);
        if (cached) return cached.instructions;

        const entry = this.skillIndex.find(s => s.name === name);
        if (entry) {
            const fullPath = path.join(process.cwd(), "skills", entry.path, "SKILL.md");
            if (fs.existsSync(fullPath)) {
                return fs.readFileSync(fullPath, "utf-8");
            }
        }
        return undefined;
    }

    getAllSkills(includeDisabled: boolean = false): any[] {
        const all = this.skillIndex.length > 0 ? this.skillIndex : Array.from(this.skills.values());
        if (includeDisabled) {
            return all.map(s => ({ ...s, enabled: this.isSkillEnabled(s.name) }));
        }
        return all.filter(s => this.isSkillEnabled(s.name));
    }

    getSkill(name: string): any | undefined {
        const skill = this.skills.get(name) || this.skillIndex.find(s => s.name === name);
        if (skill && this.isSkillEnabled(skill.name)) return skill;
        return undefined;
    }

    findRelevantSkills(query: string, limit: number = 10): any[] {
        const lowercaseQuery = query.toLowerCase();
        const sources = this.getAllSkills(false);

        return sources
            .filter(skill =>
                skill.name.toLowerCase().includes(lowercaseQuery) ||
                skill.description.toLowerCase().includes(lowercaseQuery)
            )
            .slice(0, limit);
    }
}

export const skillEngine = new SkillEngine();
