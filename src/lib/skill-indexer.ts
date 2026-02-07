import fs from "fs";
import path from "path";

interface SkillIndexEntry {
    name: string;
    description: string;
    category: string;
    path: string;
    version: string;
}

export async function generateSkillIndex() {
    const skillsDir = path.join(process.cwd(), "skills");
    const indexFile = path.join(process.cwd(), "src/lib/skills_index.json");

    const index: SkillIndexEntry[] = [];

    if (!fs.existsSync(skillsDir)) {
        console.error("Diretório de skills não encontrado.");
        return;
    }

    const categories = fs.readdirSync(skillsDir);

    for (const category of categories) {
        const categoryPath = path.join(skillsDir, category);
        if (!fs.statSync(categoryPath).isDirectory()) continue;

        const skillFolders = fs.readdirSync(categoryPath);

        for (const skillFolder of skillFolders) {
            const skillPath = path.join(categoryPath, skillFolder);
            if (!fs.statSync(skillPath).isDirectory()) continue;

            const skillMdPath = path.join(skillPath, "SKILL.md");
            if (fs.existsSync(skillMdPath)) {
                const content = fs.readFileSync(skillMdPath, "utf-8");

                // Extração simples de metadados do SKILL.md
                const nameMatch = content.match(/# (.*)/);
                const descriptionMatch = content.match(/\*\*Description\*\*:\s*(.*)/i) || content.match(/_ (.*) _/);

                index.push({
                    name: nameMatch ? nameMatch[1].trim() : skillFolder,
                    description: descriptionMatch ? descriptionMatch[1].trim() : "Sem descrição",
                    category: category,
                    path: path.join(category, skillFolder),
                    version: "1.0.0"
                });
            }
        }
    }

    fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
    console.log(`Índice de skills gerado com ${index.length} entradas.`);
}

// Executa a geração do índice
generateSkillIndex().catch(console.error);
