'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentFPLSeason } from '@/lib/season';
import { ArrowRight, Search, Trophy, User, CheckCircle2, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { Particles } from '@/components/ui/Particles';

export default function OnboardPage() {
    const [type, setType] = useState<'manager' | 'league'>('manager');
    const [id, setId] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const router = useRouter();
    const logsEndRef = useRef<HTMLDivElement>(null);
    const currentSeason = getCurrentFPLSeason();

    const translateError = (error: string) => {
        if (error.includes('404')) {
            return type === 'manager'
                ? "Team ID not found. Tip: Go to 'Points' on the FPL site; the number in the URL (e.g., /entry/123456/) is your Team ID."
                : "League ID not found. Please double-check the ID from your league's URL or invite link.";
        }
        if (error.includes('429')) {
            return "Too many requests. FPL servers are rate-limiting us. Please wait a minute and try again.";
        }
        if (error.includes('403')) {
            return "Access forbidden. This league might be private or require authentication that we don't have.";
        }
        if (error.includes('500') || error.includes('502') || error.includes('503')) {
            return "FPL servers are currently having trouble. This happens often during gameweek updates. Try again in a few minutes.";
        }
        if (error.includes('Elasticsearch') || error.includes('connection')) {
            return "Database connection error. Our scouting servers are currently undergoing maintenance.";
        }
        return error;
    };

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id.trim() || status === 'loading') return;

        // Simple validation
        if (isNaN(parseInt(id))) {
            setStatus('error');
            setLogs(['❌ ERROR: Invalid ID. Please enter a numeric ID.']);
            return;
        }

        setStatus('loading');
        setLogs(['Initializing data import...', `Target: ${type === 'manager' ? 'Team' : 'League'} ID ${id}`]);
        setProgress({ current: 0, total: 0 });

        try {
            const response = await fetch('/api/index', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error: ${response.statusText || response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) throw new Error('No connection to stream');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = JSON.parse(line.slice(6));

                    if (data.error) {
                        setStatus('error');
                        setLogs(prev => [...prev, `❌ ERROR: ${translateError(data.error)}`]);
                        return;
                    }

                    if (data.done) {
                        setStatus('success');
                        setLogs(prev => [...prev, 'Indexing complete.']);
                        return;
                    }

                    if (data.message) {
                        setLogs(prev => [...prev, `▶ ${data.message}`]);
                    }

                    if (data.current !== undefined && data.total !== undefined) {
                        setProgress({ current: data.current, total: data.total });
                    }
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Something went wrong';
            setStatus('error');
            setLogs(prev => [...prev, `❌ CRITICAL FAILURE: ${translateError(message)}`]);
        }
    };

    const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
        <main className="min-h-screen gradient-bg flex flex-col items-center justify-center px-4 relative py-10">
            <Particles />
            <div className="relative z-10 max-w-xl w-full">
                {/* Header */}
                <div className="text-center mb-8 animate-slide-in">
                    <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                        Season {currentSeason} • Setup
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-white uppercase">
                        Data <span className="text-[#00ff87]">ONBOARDING</span>
                    </h1>
                    <p className="text-sm text-white/40 font-medium">
                        Initialize your FPL profile or import a league.
                    </p>
                </div>

                {/* Console Card */}
                <div className="glass-card border-white/5 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                    {/* Mode Selector */}
                    <div className="flex border-b border-white/5 bg-white/5">
                        <button
                            onClick={() => setType('manager')}
                            disabled={status === 'loading'}
                            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${type === 'manager' ? 'text-[#00ff87] bg-white/5 border-b-2 border-[#00ff87]' : 'text-white/30 hover:text-white/60'
                                }`}
                        >
                            <User size={14} /> My Team
                        </button>
                        <button
                            onClick={() => setType('league')}
                            disabled={status === 'loading'}
                            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${type === 'league' ? 'text-[#00ff87] bg-white/5 border-b-2 border-[#00ff87]' : 'text-white/30 hover:text-white/60'
                                }`}
                        >
                            <Trophy size={14} /> Full League
                        </button>
                    </div>

                    <div className="p-6 md:p-8">
                        {status !== 'success' ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                                        Enter {type === 'manager' ? 'Team' : 'League'} ID
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-[#00ff87] transition-colors">
                                            <Search size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={id}
                                            onChange={(e) => {
                                                setId(e.target.value);
                                                if (status === 'error') setStatus('idle');
                                            }}
                                            placeholder={`e.g. ${type === 'manager' ? '123456' : '1305804'}`}
                                            disabled={status === 'loading'}
                                            className={`w-full bg-black/40 border rounded-2xl py-4 pl-12 pr-4 text-white font-bold transition-all outline-none ${status === 'error'
                                                ? 'border-[#e90052] focus:ring-2 focus:ring-[#e90052]/50'
                                                : 'border-white/10 focus:ring-2 focus:ring-[#00ff87]/50 focus:border-[#00ff87]'
                                                }`}
                                        />
                                    </div>
                                </div>

                                {status === 'loading' && progress.total > 0 && (
                                    <div className="space-y-2 animate-fade-in">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-[#00ff87]">Scouting in progress</span>
                                            <span className="text-white/60">{percentage}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#00ff87] to-[#00e67a] transition-all duration-500 shadow-[0_0_10px_rgba(0,255,135,0.5)]"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {status === 'loading' || status === 'error' ? (
                                    <div className={`bg-black/40 rounded-2xl p-4 border font-mono text-[11px] h-32 overflow-y-auto custom-scrollbar space-y-1 transition-colors ${status === 'error' ? 'border-[#e90052]/30' : 'border-white/5'}`}>
                                        {logs.map((log, i) => (
                                            <div key={i} className={log.startsWith('❌') ? 'text-[#e90052]' : log.startsWith('✅') ? 'text-[#00ff87]' : 'text-white/60'}>
                                                {log}
                                            </div>
                                        ))}
                                        <div ref={logsEndRef} />
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-[#00ff87]/5 border border-[#00ff87]/10">
                                        <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                                            <AlertCircle size={12} className="inline mr-1 text-[#00ff87]" />
                                            {type === 'manager'
                                                ? "Indexing your team will take about 5-10 seconds to fetch all historical data."
                                                : "League indexing can take several minutes depending on the number of managers."}
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!id.trim() || status === 'loading'}
                                    className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg ${status === 'loading'
                                            ? 'bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/20'
                                            : status === 'error'
                                                ? 'bg-[#e90052] hover:bg-[#ff1a6a] text-white'
                                                : 'bg-[#00ff87] hover:bg-[#00e67a] text-black disabled:opacity-20 disabled:grayscale'
                                        }`}
                                >
                                    {status === 'loading' ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Scouting...
                                        </>
                                    ) : status === 'error' ? (
                                        <>
                                            Try Again <ArrowRight size={18} />
                                        </>
                                    ) : (
                                        <>
                                            Start Mission <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-8 space-y-6 animate-slide-in">
                                <div className="w-20 h-20 bg-[#00ff87]/20 border-2 border-[#00ff87] rounded-full flex items-center justify-center mx-auto text-[#00ff87] shadow-[0_0_30px_rgba(0,255,135,0.3)]">
                                    <CheckCircle2 size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-white uppercase italic">Data Indexed Successfully</h2>
                                    <p className="text-white/50 font-medium">Your tactical field reports are ready for analysis in the chat.</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => router.push('/chat')}
                                        className="w-full bg-[#00ff87] hover:bg-[#00e67a] text-black font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95"
                                    >
                                        Go to Chat
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStatus('idle');
                                            setId('');
                                            setLogs([]);
                                            setProgress({ current: 0, total: 0 });
                                        }}
                                        className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all active:scale-95 border border-white/10"
                                    >
                                        Scout Another
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer info */}
                <div className="mt-8 flex flex-col items-center gap-6">
                    <Link
                        href="/chat"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-[#00ff87] hover:border-[#00ff87]/30 hover:bg-[#00ff87]/5 transition-all duration-300 active:scale-95 shadow-lg"
                    >
                        <MessageSquare size={14} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-black tracking-[0.2em] uppercase">
                            Already indexed? Start Chatting
                        </span>
                    </Link>
                    <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.3em]">
                        FPL Wrapped Intelligence
                    </p>
                </div>
            </div>
        </main>
    );
}
