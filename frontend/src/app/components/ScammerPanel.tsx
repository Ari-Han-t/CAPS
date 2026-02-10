import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Shield, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX, HelpCircle, Send, ChevronDown } from "lucide-react";
import { getScamMerchants, getFraudStats, reportMerchant, MerchantScoreData, FraudStats } from "../../api/client";

// ── Badge Styling ─────────────────────────────────────────────────────
const badgeConfig: Record<string, { color: string; bg: string; border: string; icon: any }> = {
    CONFIRMED_SCAM: { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30", icon: ShieldX },
    LIKELY_SCAM: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: ShieldAlert },
    CAUTION: { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: AlertTriangle },
    UNKNOWN: { color: "text-white/50", bg: "bg-white/5", border: "border-white/10", icon: HelpCircle },
    LIKELY_SAFE: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: ShieldCheck },
    VERIFIED_SAFE: { color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", icon: Shield },
};

function getBadgeStyle(badge: string) {
    return badgeConfig[badge] || badgeConfig["UNKNOWN"];
}

// ── Score Bar ─────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
    const pct = Math.round(score * 100);
    const hue = score * 120; // 0=red, 60=yellow, 120=green
    return (
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: `hsl(${hue}, 80%, 50%)` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            />
        </div>
    );
}

// ── Merchant Card ─────────────────────────────────────────────────────
function MerchantCard({ merchant }: { merchant: MerchantScoreData }) {
    const style = getBadgeStyle(merchant.badge);
    const Icon = style.icon;

    return (
        <motion.div
            className={`p-4 rounded-2xl ${style.bg} border ${style.border} backdrop-blur-sm`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${style.color}`} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white/90">{merchant.merchant_vpa}</p>
                        <p className={`text-xs ${style.color} font-medium`}>
                            {merchant.badge_emoji} {merchant.badge.replace(/_/g, " ")}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-lg font-semibold ${style.color}`}>
                        {merchant.scam_rate}%
                    </p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Scam Rate</p>
                </div>
            </div>

            {/* Score Bar */}
            <div className="mb-2">
                <div className="flex justify-between text-[10px] text-white/40 mb-1">
                    <span>Community Trust</span>
                    <span>{Math.round(merchant.community_score * 100)}%</span>
                </div>
                <ScoreBar score={merchant.community_score} />
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 text-[11px] text-white/40 mt-2">
                <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
                    {merchant.scam_reports} scam
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
                    {merchant.legitimate_reports} legit
                </span>
                <span className="ml-auto">
                    {merchant.total_reports} reports
                </span>
            </div>

            {/* Risk State Pill */}
            <div className="mt-2">
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${merchant.risk_state === "BLOCKED" ? "bg-red-500/20 text-red-300" :
                        merchant.risk_state === "WATCHLIST" ? "bg-yellow-500/20 text-yellow-300" :
                            merchant.risk_state === "TRUSTED" ? "bg-green-500/20 text-green-300" :
                                "bg-white/5 text-white/40"
                    }`}>
                    {merchant.risk_state}
                </span>
            </div>
        </motion.div>
    );
}

// ── Report Form ───────────────────────────────────────────────────────
function ReportForm({ onSubmit }: { onSubmit: () => void }) {
    const [vpa, setVpa] = useState("");
    const [type, setType] = useState<"SCAM" | "SUSPICIOUS" | "LEGITIMATE">("SCAM");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!vpa.trim()) return;
        setSubmitting(true);
        setResult(null);
        try {
            const res = await reportMerchant(vpa.trim(), type, reason.trim() || undefined);
            setResult(`${res.updated_badge_emoji} Reported! Badge: ${res.updated_badge.replace(/_/g, " ")}`);
            setVpa("");
            setReason("");
            onSubmit(); // refresh list
        } catch {
            setResult("Error submitting report");
        }
        setSubmitting(false);
    };

    return (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <p className="text-xs font-medium text-white/60 uppercase tracking-wider">Report a Merchant</p>

            <input
                type="text"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                placeholder="merchant@upi"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
            />

            <div className="flex gap-2">
                {(["SCAM", "SUSPICIOUS", "LEGITIMATE"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`flex-1 px-2 py-1.5 rounded-xl text-xs font-medium transition-all border ${type === t
                                ? t === "SCAM" ? "bg-red-500/20 border-red-500/40 text-red-300"
                                    : t === "SUSPICIOUS" ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                                        : "bg-green-500/20 border-green-500/40 text-green-300"
                                : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                            }`}
                    >
                        {t === "SCAM" ? "🚨 Scam" : t === "SUSPICIOUS" ? "⚠️ Suspect" : "✅ Legit"}
                    </button>
                ))}
            </div>

            <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional)"
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none"
            />

            <button
                onClick={handleSubmit}
                disabled={submitting || !vpa.trim()}
                className="w-full px-4 py-2.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <Send className="w-3.5 h-3.5" />
                {submitting ? "Submitting..." : "Submit Report"}
            </button>

            {result && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-center text-white/60"
                >
                    {result}
                </motion.p>
            )}
        </div>
    );
}

// ── Stats Bar ─────────────────────────────────────────────────────────
function StatsBar({ stats }: { stats: FraudStats | null }) {
    if (!stats) return null;
    const items = [
        { label: "Reports", value: stats.total_reports, color: "text-purple-400" },
        { label: "Merchants", value: stats.total_merchants, color: "text-blue-400" },
        { label: "Flagged", value: stats.flagged_merchants, color: "text-red-400" },
        { label: "Safe", value: stats.safe_merchants, color: "text-green-400" },
    ];
    return (
        <div className="grid grid-cols-4 gap-2">
            {items.map((item) => (
                <div key={item.label} className="text-center p-2 rounded-xl bg-white/[0.03]">
                    <p className={`text-lg font-semibold ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">{item.label}</p>
                </div>
            ))}
        </div>
    );
}

// ── Main Panel ────────────────────────────────────────────────────────
interface ScammerPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ScammerPanel({ isOpen, onClose }: ScammerPanelProps) {
    const [merchants, setMerchants] = useState<MerchantScoreData[]>([]);
    const [stats, setStats] = useState<FraudStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [showReport, setShowReport] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [m, s] = await Promise.all([getScamMerchants(), getFraudStats()]);
            setMerchants(m);
            setStats(s);
        } catch (err) {
            console.error("Failed to load fraud data:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-full max-w-2xl h-full max-h-[85vh] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                        <ShieldAlert className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-light text-white/90">Fraud Intelligence</h2>
                                        <p className="text-xs text-white/40">Crowdsourced merchant ratings</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-white/60" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {/* Stats */}
                                <StatsBar stats={stats} />

                                {/* Report Toggle */}
                                <button
                                    onClick={() => setShowReport(!showReport)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/60 hover:bg-white/[0.06] transition-all"
                                >
                                    <span className="flex items-center gap-2">
                                        <Send className="w-3.5 h-3.5" />
                                        Report a Merchant
                                    </span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showReport ? "rotate-180" : ""}`} />
                                </button>

                                <AnimatePresence>
                                    {showReport && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <ReportForm onSubmit={fetchData} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Merchant List */}
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <motion.div
                                            className="w-8 h-8 border-2 border-white/20 border-t-purple-400 rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        />
                                    </div>
                                ) : merchants.length === 0 ? (
                                    <div className="flex items-center justify-center py-12">
                                        <p className="text-white/40 text-sm">No merchant data available</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
                                            All Merchants ({merchants.length})
                                        </p>
                                        {merchants.map((m, i) => (
                                            <motion.div
                                                key={m.merchant_vpa}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <MerchantCard merchant={m} />
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
