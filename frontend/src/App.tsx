import { useState, useEffect, useRef } from 'react';
import { useVoiceInput } from './hooks/useVoiceInput';
import { processCommand, CommandResponse } from './api/client';
import { Mic, Send, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

interface HistoryItem {
    type: 'user' | 'system' | 'error';
    text?: string;
    data?: CommandResponse;
}

function App() {
    const { isListening, transcript, startListening, stopListening } = useVoiceInput();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [processing, setProcessing] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleVoiceEnd = async () => {
        stopListening();
        if (!transcript.trim()) return;

        setProcessing(true);
        // Add user message immediately
        setHistory(prev => [...prev, { type: 'user', text: transcript }]);

        try {
            const result = await processCommand(transcript);
            setHistory(prev => [...prev, { type: 'system', data: result }]);
        } catch (e) {
            setHistory(prev => [...prev, { type: 'error', text: 'Failed to connect to CAPS server.' }]);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans flex flex-col items-center">
            <header className="w-full max-w-md py-6 flex items-center justify-center border-b border-slate-800 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                <h1 className="text-xl font-bold tracking-wide">CAPS Voice</h1>
            </header>

            <div className="flex-1 w-full max-w-md overflow-y-auto mb-32 space-y-6 px-2 scrollbar-hide">
                {history.length === 0 && (
                    <div className="text-center text-slate-500 mt-20">
                        <p>Tap the mic and say:</p>
                        <p className="italic mt-2">"Pay shop@upi 100 rupees"</p>
                    </div>
                )}

                {history.map((item, i) => (
                    <div key={i} className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-2xl max-w-[85%] shadow-md ${item.type === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : item.type === 'error'
                                ? 'bg-red-900/40 text-red-200 border border-red-800'
                                : 'bg-slate-800 border border-slate-700 rounded-bl-none'
                            }`}>
                            {item.type === 'system' && item.data ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.data.policy_decision === 'APPROVE' ? 'bg-green-900 text-green-300' :
                                            item.data.policy_decision === 'APPROVE' ? 'bg-green-900 text-green-300' :
                                                item.data.policy_decision === 'DENY' ? 'bg-red-900 text-red-300' :
                                                    'bg-yellow-900 text-yellow-300'
                                            }`}>
                                            {item.data.policy_decision}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="text-sm">{item.data.message}</div>

                                    {/* Transaction Details Card */}
                                    {item.data.intent?.intent_type === 'PAYMENT' && (
                                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 mt-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-slate-400">Merchant</span>
                                                <span className="font-mono text-sm">{item.data.intent.merchant_vpa || 'Unknown'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-slate-400">Amount</span>
                                                <span className="font-bold text-lg">₹{item.data.intent.amount}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Balance Inquiry Card */}
                                    {item.data.intent?.intent_type === 'BALANCE_INQUIRY' && item.data.execution_result && (
                                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 mt-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-slate-400">Wallet Balance</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                    <span className="text-xs text-green-400 font-medium">Live</span>
                                                </div>
                                            </div>
                                            <div className="text-3xl font-bold mb-4">
                                                ₹{item.data.execution_result.balance?.toFixed(2)}
                                            </div>

                                            <div className="bg-slate-800/50 rounded p-2">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-400">Daily Spend</span>
                                                    <span className="text-slate-200">₹{item.data.execution_result.daily_spend?.toFixed(2)} / ₹2000</span>
                                                </div>
                                                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-blue-500 h-full rounded-full"
                                                        style={{ width: `${Math.min((item.data.execution_result.daily_spend || 0) / 2000 * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Transaction History Card */}
                                    {item.data.intent?.intent_type === 'TRANSACTION_HISTORY' && item.data.execution_result?.history && (
                                        <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 mt-2 overflow-hidden">
                                            <div className="bg-slate-800/50 px-3 py-2 border-b border-slate-700/50 flex justify-between items-center">
                                                <span className="text-xs font-medium text-slate-300">Recent Transactions</span>
                                                <Clock className="w-3 h-3 text-slate-500" />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/50">
                                                {item.data.execution_result.history.length === 0 ? (
                                                    <div className="p-4 text-center text-xs text-slate-500">No recent transactions</div>
                                                ) : (
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    item.data.execution_result.history.map((txn: any, idx: number) => (
                                                        <div key={idx} className="p-3 hover:bg-slate-800/30 transition-colors">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-sm font-medium text-slate-200">{txn.merchant_vpa}</span>
                                                                <span className={`text-sm font-bold ${txn.state === 'completed' ? 'text-white' : 'text-slate-400'}`}>
                                                                    -₹{txn.amount}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs text-slate-500">
                                                                    {txn.timestamp ? new Date(txn.timestamp).toLocaleDateString() : 'Unknown date'}
                                                                </span>
                                                                <span className={`text-xs px-1.5 py-0.5 rounded ${txn.state === 'completed' ? 'bg-green-900/30 text-green-400' :
                                                                        txn.state === 'executed' ? 'bg-green-900/30 text-green-400' :
                                                                            'bg-red-900/30 text-red-400'
                                                                    }`}>
                                                                    {txn.state}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Execution Result Card */}
                                    {item.data.status === 'executed' && item.data.execution_result && (
                                        <div className="bg-green-900/30 p-3 rounded-lg border border-green-700/50 mt-2">
                                            <div className="flex items-center gap-2 mb-2 text-green-300">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="font-bold text-sm">Payment Successful</span>
                                            </div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-slate-400">Ref No.</span>
                                                <span className="font-mono text-xs text-slate-200">{item.data.execution_result.reference_number}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-slate-400">Time</span>
                                                <span className="text-xs text-slate-200">
                                                    {new Date(item.data.execution_result.executed_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Violation display */}
                                    {item.data.policy_decision === 'DENY' && item.data.risk_info?.violations && (
                                        <div className="mt-2 flex items-start gap-2 text-red-300 text-xs bg-red-950/30 p-2 rounded">
                                            <ShieldAlert className="w-4 h-4 shrink-0" />
                                            <div>
                                                {item.data.risk_info.violations.map((v, idx) => (
                                                    <div key={idx}>• {v}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-base">{item.text}</div>
                            )}
                        </div>
                    </div>
                ))}
                {processing && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-700 flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className="fixed bottom-0 w-full max-w-md p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                <div className="flex flex-col items-center gap-4">
                    <p className={`text-sm font-medium transition-colors ${isListening ? 'text-blue-400 animate-pulse' : 'text-slate-500'
                        }`}>
                        {isListening ? (transcript || "Listening...") : "Hold to Speak"}
                    </p>

                    <button
                        onMouseDown={startListening}
                        onMouseUp={handleVoiceEnd}
                        onTouchStart={startListening}
                        onTouchEnd={handleVoiceEnd}
                        disabled={processing}
                        className={`
              relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200
              ${isListening
                                ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-110'
                                : processing
                                    ? 'bg-slate-700 cursor-wait scale-95'
                                    : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95'
                            }
            `}
                    >
                        <Mic className={`w-8 h-8 text-white ${processing ? 'opacity-50' : ''}`} />
                        {isListening && (
                            <span className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping"></span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;
