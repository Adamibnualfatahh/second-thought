import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Decision, DecisionStatus, DecisionType } from './types';
import * as Storage from './services/storage';

// --- Assets ---
// Local gentle alarm sound
const ALARM_SOUND = "/ringtone/Success-sound-effect.mp3";

// --- Animation Variants ---

const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    in: { opacity: 1, y: 0, scale: 1 },
    out: { opacity: 0, y: -20, scale: 0.98 }
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
} as const;

const containerStagger = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

// --- Shared Components ---

const Layout: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <div className={`flex flex-col h-full w-full bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden relative ${className}`}>
        {children}
    </div>
);

const Button: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    className?: string;
    disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', className = "", disabled = false }) => {
    const baseStyle = "w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-primary text-white shadow-lg shadow-primary/25",
        secondary: "bg-white dark:bg-surface-dark border-2 border-primary/40 text-slate-800 dark:text-white",
        danger: "bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-100",
        ghost: "bg-transparent text-gray-500 dark:text-gray-400"
    };

    return (
        <motion.button
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${variants[variant]} ${className}`}
        >
            {children}
        </motion.button>
    );
};

const Header: React.FC<{
    title?: string;
    onBack?: () => void;
    step?: string;
    hideBack?: boolean;
}> = ({ title, onBack, step, hideBack }) => (
    <header className="flex items-center justify-between p-6 pb-2 z-20">
        {!hideBack ? (
            <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={onBack}
                className="flex size-10 items-center justify-center rounded-full text-slate-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </motion.button>
        ) : <div className="size-10"></div>}

        <div className="flex-1 text-center px-4">
            {step && <span className="block text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">{step}</span>}
            {title && <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h2>}
        </div>
        <div className="size-10"></div>
    </header>
);



const NotificationRequestBanner: React.FC = () => {
    const [showPermissionRequest, setShowPermissionRequest] = useState(false);

    useEffect(() => {
        // Check notification permission on mount, ensuring API exists
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            setShowPermissionRequest(true);
        }
    }, []);

    const requestNotification = async () => {
        if (!('Notification' in window)) return;

        try {
            const result = await Notification.requestPermission();
            if (result === 'granted') {
                setShowPermissionRequest(false);
                // Test notification
                try {
                    new Notification("Notifikasi Aktif!", { body: "Kami akan kabari saat waktunya tiba.", icon: "https://picsum.photos/192/192" });
                } catch (e) {
                    console.error("Notification creation failed", e);
                }
            } else {
                // User denied or dismissed
                setShowPermissionRequest(false);
            }
        } catch (error) {
            console.error("Notification permission request failed", error);
            setShowPermissionRequest(false);
        }
    };

    if (!showPermissionRequest) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 right-4 z-50 bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-primary/20"
        >
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">notifications_active</span>
                <div>
                    <p className="font-bold text-sm">Aktifkan Notifikasi?</p>
                    <p className="text-xs text-gray-500">Biar kamu tau saat waktunya habis.</p>
                </div>
            </div>
            <button
                onClick={requestNotification}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
                Aktifkan
            </button>
        </motion.div>
    );
};

// --- Screens ---

const LandingScreen: React.FC = () => {
    const navigate = useNavigate();
    return (
        <Layout>
            <NotificationRequestBanner />
            <motion.div
                className="fixed top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-[#E8FDE9] dark:bg-primary/5 rounded-full blur-[80px] -z-10 opacity-80 pointer-events-none"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="fixed bottom-[-10%] left-[-20%] w-[60vw] h-[60vw] bg-[#FEF3C7] dark:bg-yellow-900/10 rounded-full blur-[80px] -z-10 opacity-60 pointer-events-none"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
                initial="hidden"
                animate="show"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex flex-col h-full"
            >
                <div className="w-full flex justify-center pt-8 pb-2">
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2.5 px-5 py-2.5 bg-white/60 dark:bg-black/20 backdrop-blur-md rounded-full border border-white/50 dark:border-white/5 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-primary">spa</span>
                        <h2 className="text-sm font-bold tracking-wide uppercase">SecondThought</h2>
                    </motion.div>
                </div>

                <main className="flex-1 flex flex-col items-center justify-center px-6 z-10">
                    <motion.div
                        className="relative w-full aspect-[4/3] flex items-center justify-center mb-8"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
                    >
                        <div className="absolute w-[80%] h-[80%] bg-white dark:bg-white/5 rounded-full shadow-xl shadow-primary/5 animate-float" />
                        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gray-100 shadow-2xl">
                            <img src="https://picsum.photos/600/400" alt="Cloud illustration" className="w-full h-full object-cover opacity-90" />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background-light/40 dark:to-background-dark/40" />
                        </div>
                    </motion.div>

                    <div className="text-center space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-3xl font-extrabold text-slate-900 dark:text-white"
                        >
                            Perlu mikir bentar?
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-base text-gray-500 dark:text-gray-400 px-4"
                        >
                            SecondThought bantu kamu ngasih jeda sebelum ambil keputusan penting.
                        </motion.p>
                    </div>
                </main>

                <div className="p-6 pb-12 flex flex-col gap-4">
                    <Button onClick={() => navigate('/type')}>Mulai</Button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate('/how-it-works')}
                        className="text-sm font-medium text-gray-400 underline decoration-primary/30 underline-offset-4"
                    >
                        Gimana cara kerjanya?
                    </motion.button>
                </div>
            </motion.div>
        </Layout>
    );
};

const HowItWorksScreen: React.FC = () => {
    const navigate = useNavigate();

    const steps = [
        {
            icon: "pause_circle",
            title: "Tangkap Impuls",
            desc: "Otak kita punya 'Sistem Cepat' yang sering bikin kita menyesal. Kita bantu kamu ngerem dulu.",
            color: "text-rose-500 bg-rose-50 dark:bg-rose-900/20"
        },
        {
            icon: "hourglass_top",
            title: "Dinginkan Pikiran",
            desc: "Tunggu timer habis. Riset membuktikan emosi sesaat akan reda setelah beberapa menit.",
            color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
        },
        {
            icon: "lightbulb",
            title: "Keputusan Sadar",
            desc: "Setelah tenang, kamu bisa memutuskan: Lanjut, Batal, atau Tunda lagi.",
            color: "text-primary bg-green-50 dark:bg-green-900/20"
        }
    ];

    return (
        <Layout>
            <Header onBack={() => navigate('/')} title="Cara Kerja" />
            <motion.div
                initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
                className="flex-1 flex flex-col px-6 pb-8 overflow-y-auto"
            >
                <motion.div variants={containerStagger} initial="hidden" animate="show" className="space-y-6 mt-4">
                    {steps.map((step, idx) => (
                        <motion.div key={idx} variants={itemVariant} className="flex gap-4 p-4 rounded-3xl bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className={`flex-shrink-0 size-12 rounded-2xl flex items-center justify-center ${step.color}`}>
                                <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <div className="mt-auto pt-8">
                    <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl border border-primary/20 text-center mb-6">
                        <span className="material-symbols-outlined text-4xl text-primary mb-2">psychology</span>
                        <p className="font-medium text-slate-700 dark:text-gray-200">"Tujuan kita bukan melarang, tapi memberimu kendali penuh."</p>
                    </div>
                    <Button onClick={() => navigate('/type')}>Cobain Sekarang</Button>
                </div>
            </motion.div>
        </Layout>
    );
};

const DecisionTypeScreen: React.FC<{
    setDraft: React.Dispatch<React.SetStateAction<Decision>>
}> = ({ setDraft }) => {
    const navigate = useNavigate();

    const handleSelect = (type: DecisionType) => {
        setDraft(prev => ({ ...prev, type }));
        navigate('/input');
    };

    const types = [
        { type: DecisionType.SHOPPING, icon: 'shopping_cart', label: 'Beli sesuatu', color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' },
        { type: DecisionType.MESSAGE, icon: 'chat_bubble', label: 'Mau kirim pesan', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
        { type: DecisionType.WORK, icon: 'work', label: 'Urusan kerja', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400' },
        { type: DecisionType.FEELING, icon: 'favorite', label: 'Perasaan', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400' },
    ];

    return (
        <Layout>
            <Header onBack={() => navigate('/')} />
            <motion.div
                initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
                className="px-6 pt-2 pb-6 flex-1 flex flex-col"
            >
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Ini tentang apa?</h1>
                    <p className="text-gray-500 dark:text-gray-400">Tenang, ini cuma buat kamu.</p>
                </div>

                <motion.div
                    variants={containerStagger}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 gap-4"
                >
                    {types.map((t) => (
                        <motion.button
                            key={t.type}
                            variants={itemVariant}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelect(t.type)}
                            className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-surface-light dark:bg-surface-dark p-6 shadow-sm border border-transparent hover:border-primary/50 transition-colors"
                        >
                            <div className={`flex size-14 items-center justify-center rounded-full ${t.color}`}>
                                <span className="material-symbols-outlined text-[28px]">{t.icon}</span>
                            </div>
                            <span className="font-bold text-sm">{t.label}</span>
                        </motion.button>
                    ))}
                    <motion.button
                        variants={itemVariant}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(DecisionType.OTHER)}
                        className="col-span-2 flex items-center justify-center gap-4 rounded-3xl bg-surface-light dark:bg-surface-dark p-6 shadow-sm border border-transparent hover:border-primary/50 transition-colors"
                    >
                        <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600">
                            <span className="material-symbols-outlined">psychology</span>
                        </div>
                        <span className="font-bold">Lainnya...</span>
                    </motion.button>
                </motion.div>
            </motion.div>
        </Layout>
    );
};

const DecisionInputScreen: React.FC<{
    draft: Decision,
    setDraft: React.Dispatch<React.SetStateAction<Decision>>
}> = ({ draft, setDraft }) => {
    const navigate = useNavigate();
    const [text, setText] = useState(draft.text);

    const handleNext = () => {
        if (!text.trim()) return;
        setDraft(prev => ({ ...prev, text }));
        navigate('/delay');
    };

    return (
        <Layout>
            <motion.div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-yellow-100 dark:bg-yellow-900/20 rounded-full blur-3xl opacity-50 pointer-events-none" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 5, repeat: Infinity }} />
            <Header onBack={() => navigate('/type')} step="Langkah 1 dari 3" />

            <motion.div
                initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
                className="flex-1 flex flex-col px-6 pb-6 relative z-10"
            >
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Ceritain sedikit</h1>
                    <p className="text-gray-500 dark:text-gray-400">Apa yang lagi kamu pikirin? Nggak perlu panjang.</p>
                </div>

                <div className="flex-1 relative group">
                    <textarea
                        autoFocus
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-full max-h-[400px] resize-none rounded-3xl border-0 bg-gray-50 dark:bg-[#1a2c1b] p-6 text-lg placeholder:text-gray-400 focus:ring-2 focus:ring-primary/50 transition-all shadow-inner outline-none"
                        placeholder="Contoh: Mau checkout sepatu jam 23.30"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 mb-4"
                >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <p className="text-xs font-medium">Tenang, ini cuma antara kita.</p>
                </motion.div>

                <Button onClick={handleNext} disabled={!text.trim()}>
                    Lanjut <span className="material-symbols-outlined">arrow_forward</span>
                </Button>
            </motion.div>
        </Layout>
    );
};

const CustomDurationPicker: React.FC<{
    onSelect: (minutes: number) => void;
    onCancel: () => void;
}> = ({ onSelect, onCancel }) => {
    const [value, setValue] = useState(1);
    const [unit, setUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
    const [error, setError] = useState<string | null>(null);

    const calculateMinutes = () => {
        switch (unit) {
            case 'minutes': return value;
            case 'hours': return value * 60;
            case 'days': return value * 24 * 60;
        }
    };

    const totalMinutes = calculateMinutes();

    // Validation limit: 7 days
    const MAX_MINUTES = 7 * 24 * 60;

    useEffect(() => {
        if (totalMinutes > MAX_MINUTES) {
            setError("Maksimal durasi adalah 1 minggu (7 hari).");
        } else if (totalMinutes < 1) {
            setError("Durasi minimal 1 menit.");
        } else {
            setError(null);
        }
    }, [totalMinutes]);

    const getDurationFeedback = () => {
        if (totalMinutes <= 30) return "Cukup untuk menenangkan nafas.";
        if (totalMinutes <= 120) return "Bagus untuk meredakan emosi sesaat.";
        if (totalMinutes <= 24 * 60) return "Ideal untuk keputusan belanja atau pesan.";
        return "Cocok untuk keputusan besar dalam hidup.";
    };

    const handleConfirm = () => {
        if (!error) onSelect(totalMinutes);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
        >
            <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold mb-4">Atur Waktu Sendiri</h3>

                <div className="flex gap-2 mb-6">
                    <input
                        type="number"
                        min="1"
                        value={value}
                        onChange={(e) => setValue(parseInt(e.target.value) || 0)}
                        className="w-24 p-4 rounded-2xl bg-gray-50 dark:bg-black/20 text-center font-bold text-2xl outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex-1 flex bg-gray-100 dark:bg-black/20 rounded-2xl p-1">
                        {['minutes', 'hours', 'days'].map((u) => (
                            <button
                                key={u}
                                onClick={() => setUnit(u as any)}
                                className={`flex-1 rounded-xl text-sm font-medium transition-all ${unit === u ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-gray-400'}`}
                            >
                                {u === 'minutes' ? 'Menit' : u === 'hours' ? 'Jam' : 'Hari'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`p-4 rounded-xl mb-6 text-sm ${error ? 'bg-red-50 text-red-500' : 'bg-primary/5 text-slate-600 dark:text-gray-300'}`}>
                    {error ? error : <><span className="font-bold mr-1">💡 Info:</span> {getDurationFeedback()}</>}
                </div>

                <div className="flex gap-3">
                    <Button variant="ghost" onClick={onCancel} className="flex-1">Batal</Button>
                    <Button onClick={handleConfirm} disabled={!!error} className="flex-[2]">Simpan</Button>
                </div>
            </div>
        </motion.div>
    );
};

const DelaySelectionScreen: React.FC<{
    setDraft: React.Dispatch<React.SetStateAction<Decision>>
}> = ({ setDraft }) => {
    const navigate = useNavigate();
    const [showCustom, setShowCustom] = useState(false);

    const handleSelect = (minutes: number) => {
        setDraft(prev => ({ ...prev, durationMinutes: minutes }));
        navigate('/reflection');
    };

    return (
        <Layout>
            {showCustom && (
                <CustomDurationPicker
                    onSelect={handleSelect}
                    onCancel={() => setShowCustom(false)}
                />
            )}
            <div className="absolute bottom-[20%] left-[-10%] h-[250px] w-[250px] rounded-full bg-primary/20 blur-[80px] pointer-events-none"></div>
            <Header onBack={() => navigate('/input')} />
            <motion.div
                initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
                className="px-6 flex-1 flex flex-col pb-6"
            >
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Mau dijeda<br />berapa lama?</h1>
                    <p className="text-gray-500">Kadang jawaban terbaik datang setelah jeda sejenak.</p>
                </div>

                <motion.div
                    variants={containerStagger}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 gap-4 mb-4"
                >
                    {[
                        { min: 60, label: '1 jam', sub: 'Buat napas dulu', icon: 'timer', color: 'bg-blue-50 text-blue-500 dark:bg-blue-900/30' },
                        { min: 480, label: 'Besok pagi', sub: 'Tidur dulu aja', icon: 'bedtime', color: 'bg-purple-50 text-purple-500 dark:bg-purple-900/30' },
                        { min: 1440, label: '24 jam', sub: 'Pikir matang', icon: 'calendar_month', color: 'bg-orange-50 text-orange-500 dark:bg-orange-900/30' },
                        { min: 5, label: '5 menit', sub: 'Coba dulu', icon: 'bolt', color: 'bg-primary/10 text-primary', border: 'border-2 border-primary/20' }
                    ].map((item, i) => (
                        <motion.button
                            key={i}
                            variants={itemVariant}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelect(item.min)}
                            className={`aspect-square flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface-light dark:bg-surface-dark p-4 shadow-sm transition-colors ${item.border || ''}`}
                        >
                            <div className={`flex size-12 items-center justify-center rounded-full ${item.color}`}>
                                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                            </div>
                            <div className="text-center">
                                <p className="font-bold">{item.label}</p>
                                <p className="text-xs text-gray-400">{item.sub}</p>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>

                <motion.div variants={itemVariant}>
                    <Button variant="secondary" onClick={() => setShowCustom(true)}>
                        <span className="material-symbols-outlined">tune</span> Atur Waktu Sendiri
                    </Button>
                </motion.div>
            </motion.div>
        </Layout>
    );
};

const ReflectionScreen: React.FC<{
    draft: Decision,
    setDraft: React.Dispatch<React.SetStateAction<Decision>>,
    startWaiting: (finalDecision: Decision) => void
}> = ({ draft, setDraft, startWaiting }) => {
    const navigate = useNavigate();
    const [reflection, setReflection] = useState('');

    const handleStart = async () => {
        // Request notification permission if not granted and supported
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (e) {
                console.error("Failed to request permission", e);
            }
        }

        const finalDecision = {
            ...draft,
            reflectionText: reflection,
            status: DecisionStatus.WAITING,
            startTime: Date.now(),
            endTime: Date.now() + draft.durationMinutes * 60 * 1000
        };
        startWaiting(finalDecision);
        navigate('/waiting', { replace: true });
    };

    return (
        <Layout>
            <Header onBack={() => navigate('/delay')} />
            <motion.div
                initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
                className="px-6 pb-6 flex-1 flex flex-col overflow-y-auto"
            >
                <h1 className="text-3xl font-bold mb-6">Sebelum lanjut...</h1>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-surface-dark rounded-3xl p-4 shadow-sm mb-6 border border-gray-100 dark:border-gray-800"
                >
                    <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-green-200 to-yellow-100 dark:from-green-900 dark:to-yellow-900 mb-4 overflow-hidden relative">
                        <img src="https://picsum.photos/600/350" className="w-full h-full object-cover mix-blend-overlay opacity-60" alt="Calm" />
                        <div className="absolute top-3 left-3 bg-white/80 dark:bg-black/50 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-primary">spa</span>
                            <span className="text-[10px] font-bold uppercase">Refleksi</span>
                        </div>
                    </div>
                    <p className="text-lg font-medium leading-snug px-2">"Banyak keputusan impulsif terjadi saat kita capek atau emosi."</p>
                </motion.div>

                <div className="flex items-start gap-3 mb-2">
                    <span className="material-symbols-outlined text-yellow-500 mt-1">psychology_alt</span>
                    <h2 className="font-bold text-lg">Kalau ditunda sebentar, apa yang paling kamu takutkan?</h2>
                </div>

                <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Ceritakan ketakutanmu di sini..."
                    className="w-full min-h-[120px] p-4 rounded-2xl bg-white dark:bg-surface-dark border-transparent focus:border-primary/50 focus:ring-0 resize-none shadow-sm mb-6"
                />

                <div className="mt-auto">
                    <Button onClick={handleStart}>
                        Mulai Timer <span className="material-symbols-outlined">timer</span>
                    </Button>
                </div>
            </motion.div>
        </Layout>
    );
};

const WaitingScreen: React.FC<{
    decision: Decision | null,
    onComplete: () => void,
    onEmergency: () => void
}> = ({ decision, onComplete, onEmergency }) => {
    const [timeLeft, setTimeLeft] = useState<{ h: number, m: number, s: number }>({ h: 0, m: 0, s: 0 });
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(new Audio(ALARM_SOUND));
    const [notified, setNotified] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;

        // Stop audio when component unmounts
        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

    useEffect(() => {
        if (!decision) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = decision.endTime - now;
            const totalDuration = decision.endTime - decision.startTime;

            if (diff <= 0) {
                clearInterval(interval);
                if (!notified) {
                    setNotified(true);
                    // Browser Notification
                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                        try {
                            new Notification("Waktu Habis! ⏰", {
                                body: "Saatnya kembali ke SecondThought untuk keputusanmu.",
                                icon: "https://picsum.photos/192/192" // Placeholder icon
                            });
                        } catch (e) {
                            console.error("Failed to create notification", e);
                        }
                    }
                    // Audio Alarm Loop
                    audioRef.current.loop = true;
                    audioRef.current.play().catch(e => console.log("Autoplay blocked usually, user interaction required earlier", e));
                }
                onComplete();
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({ h: hours, m: minutes, s: seconds });
                setProgress(100 - (diff / totalDuration) * 100);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [decision, onComplete, notified]);

    if (!decision) return null;

    return (
        <Layout className="bg-soft-green dark:bg-[#0f1f12]">
            <NotificationRequestBanner />

            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center px-6 relative"
            >
                {/* Background Animation */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
                    />
                </div>

                <div className="relative mb-10">
                    <div className="w-64 h-64 rounded-full bg-white dark:bg-surface-dark shadow-2xl flex items-center justify-center relative overflow-hidden">
                        <svg className="w-full h-full rotate-[-90deg] absolute" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-800" strokeWidth="4" />
                            <motion.circle
                                cx="50" cy="50" r="45" fill="none" stroke="currentColor"
                                className="text-primary"
                                strokeWidth="4"
                                strokeDasharray="283"
                                strokeDashoffset="283"
                                animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                                transition={{ duration: 1, ease: "linear" }}
                                strokeLinecap="round"
                            />
                        </svg>
                        {/* Removed animate prop here to stop bouncing */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center">
                            <span className="material-symbols-outlined text-4xl text-primary mb-2">spa</span>
                            <p className="text-xs uppercase tracking-widest text-gray-400">Sisa Waktu</p>
                        </div>
                    </div>
                </div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="text-3xl font-bold text-center mb-2"
                >
                    Tunggu sebentar ya.
                </motion.h1>
                <p className="text-center text-gray-500 mb-8 max-w-xs">Keputusan terbaik lahir dari pikiran yang tenang.</p>

                <div className="flex gap-4 mb-12">
                    <div className="text-center">
                        <div className="text-4xl font-bold font-mono">{String(timeLeft.h).padStart(2, '0')}</div>
                        <div className="text-xs text-gray-400 uppercase">Jam</div>
                    </div>
                    <div className="text-4xl font-bold pb-4 animate-pulse">:</div>
                    <div className="text-center">
                        <div className="text-4xl font-bold font-mono">{String(timeLeft.m).padStart(2, '0')}</div>
                        <div className="text-xs text-gray-400 uppercase">Menit</div>
                    </div>
                    <div className="text-4xl font-bold pb-4 animate-pulse">:</div>
                    <div className="text-center">
                        <div className="text-4xl font-bold font-mono text-primary">{String(timeLeft.s).padStart(2, '0')}</div>
                        <div className="text-xs text-gray-400 uppercase">Detik</div>
                    </div>
                </div>

                <div className="w-full space-y-4">
                    {/* Fixed Button Visibility: Changed variant and removed conflicting text classes */}
                    <Button
                        onClick={() => { }}
                        variant="ghost"
                        className="bg-white/50 dark:bg-black/20 text-slate-600 dark:text-gray-300 pointer-events-none border border-white/20"
                    >
                        <span className="material-symbols-outlined text-lg">lock</span> Menunggu...
                    </Button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onEmergency}
                        className="w-full text-center text-rose-500 text-sm font-medium hover:text-rose-600"
                    >
                        Saya butuh ini sekarang (Darurat)
                    </motion.button>
                </div>
            </motion.div>
        </Layout>
    );
};

const ResultScreen: React.FC<{
    onFinish: (status: DecisionStatus, note?: string) => void;
    decisionText: string;
}> = ({ onFinish, decisionText }) => {
    const [step, setStep] = useState<'selection' | 'feedback' | 'appreciation'>('selection');
    const [selectedAction, setSelectedAction] = useState<DecisionStatus | null>(null);
    const [note, setNote] = useState('');

    const handleSelection = (action: DecisionStatus) => {
        setSelectedAction(action);
        setStep('feedback');
    };

    const submitFeedback = () => {
        if (selectedAction) {
            setStep('appreciation');
        }
    };

    const handleFinalClose = () => {
        if (selectedAction) {
            onFinish(selectedAction, note);
        }
    }

    const getFeedbackContent = () => {
        switch (selectedAction) {
            case DecisionStatus.COMPLETED:
                return {
                    title: "Kamu yakin?",
                    desc: "Oke, kamu sudah melewati masa tunggu. Tulis alasan kenapa kamu tetap mau lanjut, biar jadi pengingat nanti.",
                    placeholder: "Saya memutuskan lanjut karena...",
                    btn: "Lanjut & Selesai"
                };
            case DecisionStatus.CANCELLED:
                return {
                    title: "Keputusan Hebat!",
                    desc: "Menahan diri itu nggak gampang. Apa yang bikin kamu berubah pikiran?",
                    placeholder: "Saya batal karena sadar bahwa...",
                    btn: "Simpan & Selesai"
                };
            default: // Snooze
                return {
                    title: "Masih ragu?",
                    desc: "Nggak masalah. Tulis apa yang masih mengganjal di pikiranmu.",
                    placeholder: "Saya masih bingung soal...",
                    btn: "Tunda Dulu"
                };
        }
    };

    const getAppreciationContent = () => {
        const reasonSnippet = note.trim() ? `"${note.trim()}"` : 'alasanmu';

        switch (selectedAction) {
            case DecisionStatus.COMPLETED:
                return {
                    icon: "check_circle",
                    color: "text-green-500",
                    title: "Semoga Lancar!",
                    body: `Kamu memutuskan lanjut karena ${reasonSnippet}. Keputusan yang diambil dengan kepala dingin biasanya jarang salah. Good luck!`,
                };
            case DecisionStatus.CANCELLED:
                return {
                    icon: "celebration",
                    color: "text-rose-500",
                    title: "Self-Control Level Up!",
                    body: `Hebat! Kamu berhasil menahan impuls karena menyadari ${reasonSnippet}. Dompet dan mentalmu pasti berterima kasih.`,
                };
            default:
                return {
                    icon: "hourglass_bottom",
                    color: "text-yellow-500",
                    title: "Pelan-pelan Saja",
                    body: `Gapapa kalau masih ragu soal ${reasonSnippet}. Lebih baik tunda daripada menyesal. Ambil waktumu lagi ya.`,
                };
        }
    }

    const content = selectedAction ? getFeedbackContent() : null;
    const appreciation = selectedAction && step === 'appreciation' ? getAppreciationContent() : null;

    return (
        <Layout>
            <motion.div
                key={step}
                initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}
                className="flex-1 flex flex-col items-center justify-center px-6 py-8"
            >
                {step === 'selection' && (
                    <>
                        <motion.div
                            initial={{ rotate: -10, scale: 0.8 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", bounce: 0.4 }}
                            className="w-48 h-48 rounded-[2rem] overflow-hidden mb-8 shadow-lg"
                        >
                            <img src="https://picsum.photos/400/400" alt="Calm leaves" className="w-full h-full object-cover" />
                        </motion.div>

                        {/* Added context box for user's original decision text */}
                        <div className="w-full bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl p-4 mb-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-1 text-primary">
                                <span className="material-symbols-outlined text-sm">history</span>
                                <span className="text-xs font-bold uppercase tracking-wide">Niat Awalmu</span>
                            </div>
                            <p className="font-medium text-lg leading-snug">"{decisionText}"</p>
                        </div>

                        <h1 className="text-2xl font-bold text-center mb-2">Waktu Habis!</h1>
                        <p className="text-gray-500 text-center mb-8">Jadi, gimana keputusanmu sekarang?</p>

                        <motion.div
                            variants={containerStagger}
                            initial="hidden"
                            animate="show"
                            className="w-full space-y-4"
                        >
                            <motion.div variants={itemVariant}>
                                <Button onClick={() => handleSelection(DecisionStatus.COMPLETED)} variant="secondary" className="!bg-white !border-primary !text-primary-dark">
                                    ✅ Lanjut, aku yakin
                                </Button>
                            </motion.div>
                            <motion.div variants={itemVariant}>
                                <Button onClick={() => handleSelection(DecisionStatus.CANCELLED)} variant="danger">
                                    ❌ Nggak jadi deh
                                </Button>
                            </motion.div>
                            <motion.div variants={itemVariant}>
                                <Button onClick={() => handleSelection(DecisionStatus.SNOOZED)} variant="ghost" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
                                    🤔 Tunda lagi
                                </Button>
                            </motion.div>
                        </motion.div>
                    </>
                )}

                {step === 'feedback' && (
                    <div className="w-full flex flex-col h-full">
                        <button onClick={() => setStep('selection')} className="self-start mb-6 text-gray-400 hover:text-gray-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-lg">arrow_back</span> Kembali
                        </button>

                        <h1 className="text-3xl font-bold mb-2">{content?.title}</h1>
                        <p className="text-gray-500 mb-6">{content?.desc}</p>

                        <textarea
                            autoFocus
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={content?.placeholder}
                            className="w-full flex-1 min-h-[150px] p-4 rounded-2xl bg-white dark:bg-surface-dark border-transparent focus:border-primary/50 focus:ring-0 resize-none shadow-sm mb-6 text-lg"
                        />

                        <Button onClick={submitFeedback}>
                            {content?.btn}
                        </Button>
                    </div>
                )}

                {step === 'appreciation' && appreciation && (
                    <div className="w-full flex flex-col items-center justify-center h-full text-center">
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className={`w-32 h-32 rounded-full bg-white dark:bg-surface-dark shadow-xl flex items-center justify-center mb-8 ${appreciation.color.replace('text', 'bg').replace('500', '100')}`}
                        >
                            <span className={`material-symbols-outlined text-6xl ${appreciation.color}`}>{appreciation.icon}</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-bold mb-4"
                        >
                            {appreciation.title}
                        </motion.h1>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8"
                        >
                            <p className="text-lg text-slate-700 dark:text-gray-300 leading-relaxed italic">
                                {appreciation.body}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="w-full"
                        >
                            <Button onClick={handleFinalClose}>
                                Selesai
                            </Button>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </Layout>
    );
};

// --- Main App Logic ---

const AnimatedRoutes: React.FC<{
    activeDecision: Decision | null,
    setDraftDecision: React.Dispatch<React.SetStateAction<Decision>>,
    draftDecision: Decision,
    startWaiting: (d: Decision) => void,
    handleFinish: (s: DecisionStatus, note?: string) => void,
    handleEmergency: () => void
}> = ({ activeDecision, setDraftDecision, draftDecision, startWaiting, handleFinish, handleEmergency }) => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <div key={location.pathname} className="w-full h-full">
                <Routes location={location}>
                    <Route path="/" element={
                        activeDecision && activeDecision.status === DecisionStatus.WAITING ? (
                            Date.now() >= activeDecision.endTime ? <Navigate to="/result" /> : <Navigate to="/waiting" />
                        ) : <LandingScreen />
                    } />

                    <Route path="/how-it-works" element={<HowItWorksScreen />} />
                    <Route path="/type" element={<DecisionTypeScreen setDraft={setDraftDecision} />} />
                    <Route path="/input" element={<DecisionInputScreen draft={draftDecision} setDraft={setDraftDecision} />} />
                    <Route path="/delay" element={<DelaySelectionScreen setDraft={setDraftDecision} />} />
                    <Route path="/reflection" element={<ReflectionScreen draft={draftDecision} setDraft={setDraftDecision} startWaiting={startWaiting} />} />

                    <Route path="/waiting" element={
                        activeDecision ? (
                            <WaitingScreen
                                decision={activeDecision}
                                onComplete={() => window.location.hash = '#/result'}
                                onEmergency={handleEmergency}
                            />
                        ) : <Navigate to="/" />
                    } />

                    <Route path="/result" element={
                        activeDecision ? (
                            <ResultScreen
                                onFinish={handleFinish}
                                decisionText={activeDecision.text}
                            />
                        ) : <Navigate to="/" />
                    } />
                </Routes>
            </div>
        </AnimatePresence>
    );
};

const App: React.FC = () => {
    const [activeDecision, setActiveDecision] = useState<Decision | null>(null);
    const [draftDecision, setDraftDecision] = useState<Decision>(Storage.createDraftDecision());
    const [isLoading, setIsLoading] = useState(true);

    // Initialize from storage
    useEffect(() => {
        const saved = Storage.getDecision();
        if (saved) {
            setActiveDecision(saved);
        }
        setIsLoading(false);
    }, []);

    const startWaiting = useCallback((decision: Decision) => {
        Storage.saveDecision(decision);
        setActiveDecision(decision);
    }, []);

    const handleFinish = useCallback((status: DecisionStatus, note?: string) => {
        // In a real app with history, we would push to a history array here including the final note.
        console.log("Finished:", status, note);

        Storage.clearDecision();
        setActiveDecision(null);
        setDraftDecision(Storage.createDraftDecision());
    }, []);

    const handleEmergency = useCallback(() => {
        if (activeDecision) {
            const updated = { ...activeDecision, endTime: Date.now() };
            Storage.saveDecision(updated);
            setActiveDecision(updated);
        }
    }, [activeDecision]);

    if (isLoading) return <div className="h-screen w-full bg-background-light dark:bg-background-dark" />;

    return (
        <HashRouter>
            <AnimatedRoutes
                activeDecision={activeDecision}
                setDraftDecision={setDraftDecision}
                draftDecision={draftDecision}
                startWaiting={startWaiting}
                handleFinish={handleFinish}
                handleEmergency={handleEmergency}
            />
        </HashRouter>
    );
};

export default App;