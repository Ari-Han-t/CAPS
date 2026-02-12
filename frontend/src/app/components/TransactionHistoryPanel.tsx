import { motion, AnimatePresence } from "motion/react";
import { X, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface Transaction {
    merchant: string;
    amount: number;
    status: string;
    timestamp: string;
}

interface TransactionHistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    balance: number;
    dailySpend: number;
    dailyLimit: number;
}

export function TransactionHistoryPanel({
    isOpen,
    onClose,
    transactions,
    balance,
    dailySpend,
    dailyLimit,
}: TransactionHistoryPanelProps) {
    const spendPercent = Math.min((dailySpend / dailyLimit) * 100, 100);

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
            case "success":
                return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
            case "failed":
                return <XCircle className="w-3.5 h-3.5 text-red-400" />;
            case "pending":
            case "executing":
                return <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />;
            default:
                return <Clock className="w-3.5 h-3.5 text-white/40" />;
        }
    };

    const formatTime = (ts: string) => {
        try {
            const d = new Date(ts);
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } catch {
            return "--:--";
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    {/* Panel */}
                    <motion.div
                        className="fixed right-0 top-0 bottom-0 w-[380px] max-w-[90vw] bg-gray-950/95 backdrop-blur-2xl border-l border-white/10 z-50 overflow-y-auto"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-gray-950/90 backdrop-blur-xl p-5 border-b border-white/10 z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Account</h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                                >
                                    <X className="w-4 h-4 text-white/60" />
                                </button>
                            </div>

                            {/* Balance Card */}
                            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-2xl p-4 border border-emerald-500/20">
                                <div className="text-xs text-emerald-300/60 mb-1">Available Balance</div>
                                <div className="text-2xl font-bold text-emerald-300">₹{balance.toLocaleString()}</div>

                                {/* Spend Progress */}
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-white/40 mb-1.5">
                                        <span>Daily Spend</span>
                                        <span>₹{dailySpend} / ₹{dailyLimit}</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${spendPercent > 80 ? "bg-red-400" : spendPercent > 50 ? "bg-amber-400" : "bg-emerald-400"
                                                }`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${spendPercent}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transaction List */}
                        <div className="p-5">
                            <div className="text-xs text-white/40 uppercase tracking-wider mb-3">
                                Recent Transactions
                            </div>
                            {transactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <Clock className="w-8 h-8 text-white/10 mx-auto mb-3" />
                                    <p className="text-sm text-white/30">No transactions yet</p>
                                    <p className="text-xs text-white/20 mt-1">Your payment history will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {transactions.map((txn, i) => (
                                        <motion.div
                                            key={`${txn.timestamp}-${i}`}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            {/* Direction Icon */}
                                            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                                                <ArrowUpRight className="w-4 h-4 text-red-400" />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-white/90 font-medium truncate">
                                                    {txn.merchant}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {getStatusIcon(txn.status)}
                                                    <span className="text-xs text-white/40 capitalize">{txn.status}</span>
                                                    <span className="text-xs text-white/20">•</span>
                                                    <span className="text-xs text-white/30">{formatTime(txn.timestamp)}</span>
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div className="text-sm font-semibold text-red-300 flex-shrink-0">
                                                -₹{txn.amount}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
