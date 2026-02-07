'use client';

import React, { useState, useEffect } from 'react';
import { getSkills, updateSkillStatus } from '../actions';

export default function CommandCenter() {
    const [activeTab, setActiveTab] = useState('reasoning');
    const [skills, setSkills] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        setLoading(true);
        const res = await getSkills();
        if (res.success) {
            setSkills(res.skills || []);
        }
        setLoading(false);
    };

    const handleToggle = async (name: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        // Otimismo na UI
        setSkills(prev => prev.map(s => s.name === name ? { ...s, enabled: newStatus } : s));

        const res = await updateSkillStatus(name, newStatus);
        if (!res.success) {
            // Reverter se falhar
            setSkills(prev => prev.map(s => s.name === name ? { ...s, enabled: currentStatus } : s));
            alert("Falha ao atualizar status da skill.");
        }
    };

    const filteredSkills = skills.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 50); // Mostrar apenas as 50 primeiras para performance na UI

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 p-8 font-sans selection:bg-cyan-500/30">
            {/* Header */}
            <header className="mb-12 flex justify-between items-end border-b border-zinc-800 pb-6">
                <div className="flex items-center gap-6">
                    <a href="/" className="p-2 rounded-full border border-zinc-800 hover:border-cyan-500 transition-colors group">
                        <svg className="h-5 w-5 text-zinc-500 group-hover:text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5m7-7-7 7 7 7" />
                        </svg>
                    </a>
                    <h1 className="text-4xl font-bold tracking-tighter text-white">
                        MISSION <span className="text-cyan-500">CONTROL</span>
                    </h1>
                </div>
                <div className="flex gap-4">
                    <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-tighter animate-pulse">
                        System Online
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="flex gap-8 mb-12 overflow-x-auto pb-2 scrollbar-hide">
                {['reasoning', 'nexus', 'skills', 'evolution'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-sm uppercase tracking-widest font-bold transition-all duration-300 relative pb-2 ${activeTab === tab ? 'text-cyan-500 mb-2' : 'text-zinc-600 hover:text-zinc-400'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                        )}
                    </button>
                ))}
            </nav>

            {/* Main Content */}
            <main className="grid grid-cols-1 gap-8">
                {activeTab === 'reasoning' && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                            THINKING LOG
                        </h2>
                        <div className="space-y-4 font-mono text-sm">
                            <div className="text-zinc-400">[02:34 PM] <span className="text-white">Iniciando tarefa:</span> "Criar jogo de sobrevivência espacial"</div>
                            <div className="text-zinc-500 ml-4 border-l border-zinc-800 pl-4 py-1">
                                [PENSAMENTO] Analisando requisitos para Phaser.js...
                            </div>
                            <div className="text-zinc-400">[02:35 PM] <span className="text-cyan-400">EXECUTANDO BASH:</span> mkdir -p nexus-arcade/games/void-survival</div>
                            <div className="text-zinc-600 italic">Aguardando observação...</div>
                        </div>
                    </div>
                )}

                {activeTab === 'nexus' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all group shadow-lg">
                            <div className="h-40 bg-gradient-to-br from-zinc-800 to-black p-6 flex flex-col justify-end relative">
                                <div className="absolute top-4 right-4 bg-cyan-500 text-black text-[10px] font-black px-2 py-0.5 rounded italic">NEW</div>
                                <h3 className="text-lg font-bold leading-tight">VOID SURVIVAL</h3>
                                <p className="text-zinc-500 text-xs">V1.0.2 • By KORTEX</p>
                            </div>
                            <div className="p-5 flex justify-between items-center bg-black/40">
                                <button className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Abrir Repo</button>
                                <button className="px-5 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all rounded-lg">Jogar</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'skills' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold italic tracking-tighter">SKILL WORKSHOP</h2>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Buscar skill..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1 text-xs focus:outline-none focus:border-cyan-500"
                                />
                                <button onClick={loadSkills} className="text-[10px] font-bold py-2 px-4 border border-zinc-800 rounded-full hover:bg-white hover:text-black transition-all text-zinc-400">
                                    {loading ? 'CARREGANDO...' : 'RE-SYNC'}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredSkills.map(skill => (
                                <div key={skill.name} className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between group hover:border-zinc-700 transition-all">
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-1">{skill.name}</h3>
                                        <p className="text-[10px] text-zinc-500 line-clamp-2 mb-4 leading-tight">{skill.description}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-auto">
                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${skill.enabled ? 'text-cyan-500' : 'text-zinc-600'}`}>
                                            {skill.enabled ? 'Active' : 'Disabled'}
                                        </span>
                                        <div
                                            onClick={() => handleToggle(skill.name, skill.enabled)}
                                            className={`w-8 h-4 rounded-full relative p-0.5 cursor-pointer transition-all duration-300 ${skill.enabled ? 'bg-cyan-500/20' : 'bg-zinc-800'}`}
                                        >
                                            <div className={`w-3 h-3 rounded-full shadow-lg transition-all duration-300 ${skill.enabled ? 'bg-cyan-500 ml-4 shadow-[0_0_8px_cyan]' : 'bg-zinc-600 ml-0'}`} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-zinc-600 italic">Mostrando {filteredSkills.length} de {skills.length} skills totais.</p>
                    </div>
                )}

                {activeTab === 'evolution' && (
                    <div className="max-w-3xl mx-auto space-y-12 py-8 relative">
                        <div className="absolute left-[15px] top-0 w-px h-full bg-zinc-800" />
                        <div className="relative pl-12">
                            <div className="absolute left-0 top-1.5 w-8 h-8 rounded-full bg-black border-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                            </div>
                            <p className="text-[10px] text-zinc-500 font-bold mb-1">FEVEREIRO 07, 2026</p>
                            <h4 className="text-sm font-bold text-white mb-2 underline decoration-cyan-500/50 underline-offset-4">EVO-2026-001: REFRESH MULTI-REPO</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Refatored the `NexusDeploy` logic to support separate repositories for games. Optimized push speed by 40% through metadata caching.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
