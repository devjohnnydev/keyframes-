import React, { useState, useEffect } from 'react';
import { useData } from './DataContext';
import { 
    LogIn, Mail, Lock, User, Code, ArrowLeft, Shield, Camera, 
    Volume2, VolumeX, HelpCircle, Trophy, Key, Compass, Award, 
    Sparkles, Zap, SkipForward, Play, Hourglass, ZapOff, CheckCircle 
} from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { motion, AnimatePresence } from 'framer-motion';

// Sound effects generator using Web Audio API (completely offline & lightweight)
const playSynthSound = (type, muted) => {
    if (muted) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        if (type === 'click') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
            
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } else if (type === 'flip') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(250, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.1);
            
            gain.gain.setValueAtTime(0.03, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'success') {
            const notes = [261.63, 329.63, 392.00, 523.25];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
                
                gain.gain.setValueAtTime(0.03, ctx.currentTime + idx * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.18);
                
                osc.start(ctx.currentTime + idx * 0.07);
                osc.stop(ctx.currentTime + idx * 0.07 + 0.18);
            });
        } else if (type === 'unlock') {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(90, ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.6);
            
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(92, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(752, ctx.currentTime + 0.6);
            
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            
            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 0.6);
            osc2.stop(ctx.currentTime + 0.6);
        } else if (type === 'gameover') {
            const notes = [392.00, 329.63, 261.63, 196.00];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
                
                gain.gain.setValueAtTime(0.04, ctx.currentTime + idx * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.3);
                
                osc.start(ctx.currentTime + idx * 0.12);
                osc.stop(ctx.currentTime + idx * 0.12 + 0.3);
            });
        }
    } catch (e) {
        console.warn('Audio Context error:', e);
    }
};

const Login = () => {
    const { login, registerStudent, updateProfessorPassword } = useData();
    const [role, setRole] = useState('ALUNO'); // 'ALUNO', 'PROFESSOR', 'ADMIN'
    const [mode, setMode] = useState('LOGIN'); // 'LOGIN' or 'REGISTER'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nome: '',
        codigo: ''
    });

    const [newPassword, setNewPassword] = useState('');
    const [mustChange, setMustChange] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);

    // Audio State
    const [muted, setMuted] = useState(() => {
        const saved = localStorage.getItem('eduGameMuted');
        return saved ? saved === 'true' : false;
    });

    // Check on startup if they already attempted today (Wordle / Termo limit)
    const [portalState, setPortalState] = useState(() => {
        const todayStr = new Date().toDateString();
        const lastAttemptDate = localStorage.getItem('portalLastAttemptDate');
        if (lastAttemptDate === todayStr) {
            return 'ATTEMPTED';
        }
        return 'CLOSED'; // Cover start screen
    });

    const [puzzleMode, setPuzzleMode] = useState('GEAR'); // 'GEAR' or 'MEMORY'
    const [xpNotify, setXpNotify] = useState(false);
    const [achievedTitle, setAchievedTitle] = useState('');

    // Timer states: 3 minutes (180 seconds) countdown limit
    const [timeLeft, setTimeLeft] = useState(180);
    const [puzzlesSolved, setPuzzlesSolved] = useState(0);

    // Puzzle 1 state (Rune Alignment Ring)
    const [rotations, setRotations] = useState([1, 2, 3]);

    const randomizeRotations = () => {
        setRotations([
            Math.floor(Math.random() * 3) + 1,
            Math.floor(Math.random() * 3) + 1,
            Math.floor(Math.random() * 3) + 1
        ]);
    };

    // Puzzle 2 state (Memory Match Cards)
    const memorySymbols = [
        { name: 'shield', Icon: Shield },
        { name: 'trophy', Icon: Trophy },
        { name: 'key', Icon: Key },
        { name: 'compass', Icon: Compass },
        { name: 'award', Icon: Award },
        { name: 'sparkles', Icon: Sparkles },
        { name: 'code', Icon: Code },
        { name: 'zap', Icon: Zap }
    ];

    const [cards, setCards] = useState([]);
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [matchedNames, setMatchedNames] = useState([]);

    // 3-Minute countdown loop effect
    useEffect(() => {
        let interval = null;
        if (portalState === 'PLAYING') {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        handleTimeOut();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [portalState]);

    // Handle when the 3-minute timer runs out (defeat or automatic completion)
    const handleTimeOut = () => {
        finishAndSavePoints();
    };

    // Save volume configuration
    const toggleMute = () => {
        setMuted(prev => {
            const next = !prev;
            localStorage.setItem('eduGameMuted', String(next));
            playSynthSound('click', next);
            return next;
        });
    };

    // Initialize Memory game cards
    const startMemoryGame = () => {
        const duplicated = [...memorySymbols, ...memorySymbols]
            .map((item, idx) => ({
                id: idx,
                name: item.name,
                Icon: item.Icon
            }))
            .sort(() => Math.random() - 0.5);
        setCards(duplicated);
        setFlippedIndices([]);
        setMatchedNames([]);
    };

    useEffect(() => {
        if (puzzleMode === 'MEMORY') {
            startMemoryGame();
        } else {
            randomizeRotations();
        }
    }, [puzzleMode]);

    // Handle concentric ring alignment clicks
    const handleRingClick = (ringIndex) => {
        if (portalState !== 'PLAYING') return;
        
        playSynthSound('click', muted);
        setRotations(prev => {
            const next = [...prev];
            next[ringIndex] = (next[ringIndex] + 1) % 4; // increment 90 degrees
            
            // Check success: all rings at 0 (perfect alignment)
            if (next[0] === 0 && next[1] === 0 && next[2] === 0) {
                handleSinglePuzzleSuccess('Alinhador de Runas');
            }
            return next;
        });
    };

    // Handle memory card clicks
    const handleCardClick = (cardIndex) => {
        if (portalState !== 'PLAYING' || flippedIndices.length >= 2 || flippedIndices.includes(cardIndex) || matchedNames.includes(cards[cardIndex].name)) {
            return;
        }

        playSynthSound('flip', muted);
        const newFlipped = [...flippedIndices, cardIndex];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            const [firstIdx, secondIdx] = newFlipped;
            const firstCardName = cards[firstIdx].name;
            const secondCardName = cards[secondIdx].name;

            if (firstCardName === secondCardName) {
                // Successful Match!
                setTimeout(() => {
                    playSynthSound('click', muted);
                    const newMatched = [...matchedNames, firstCardName];
                    setMatchedNames(newMatched);
                    setFlippedIndices([]);
                    
                    // Check if all matched
                    if (newMatched.length === memorySymbols.length) {
                        handleSinglePuzzleSuccess('Mestre de Rituais');
                    }
                }, 400);
            } else {
                // Unsuccessful Match
                setTimeout(() => {
                    setFlippedIndices([]);
                }, 1000);
            }
        }
    };

    // Triggered whenever a single puzzle round is solved in the chain
    const handleSinglePuzzleSuccess = (title) => {
        playSynthSound('success', muted);
        setPuzzlesSolved(prev => prev + 1);
        setAchievedTitle(title);
        
        // Show short floating reward message
        setXpNotify(true);
        setTimeout(() => setXpNotify(false), 1200);

        // Switch to other puzzle mode to keep the chain active
        setTimeout(() => {
            setPuzzleMode(prev => prev === 'GEAR' ? 'MEMORY' : 'GEAR');
        }, 600);
    };

    // Finalize the 3-minute run, compute final ratio & score, and lock today's attempt
    const finishAndSavePoints = () => {
        const todayStr = new Date().toDateString();
        const timeSpent = 180 - timeLeft;
        
        // Dynamic formula: Base points = puzzlesSolved. 
        // Speed bonus if solved fast. Maximum score is strictly 5 points.
        const score = puzzlesSolved === 0 ? 0 : Math.min(5, puzzlesSolved + (timeLeft > 90 ? 2 : timeLeft > 40 ? 1 : 0));
        
        localStorage.setItem('portalLastAttemptDate', todayStr);
        localStorage.setItem('portalAttemptScore', String(score));
        localStorage.setItem('portalAttemptPuzzles', String(puzzlesSolved));
        localStorage.setItem('portalAttemptTimeSpent', String(timeSpent));
        localStorage.setItem('portalAttemptResult', score > 0 ? 'SUCCESS' : 'FAILED');

        playSynthSound('unlock', muted);
        setPortalState('ATTEMPTED');
    };

    // Calculate live points (informative HUD)
    const getLiveScore = () => {
        if (puzzlesSolved === 0) return 0;
        const speedBonus = timeLeft > 90 ? 2 : timeLeft > 40 ? 1 : 0;
        return Math.min(5, puzzlesSolved + speedBonus);
    };

    // Direct Bypass / Skip to login screen (Can play later, attempt not locked!)
    const skipAndPlayLater = () => {
        playSynthSound('unlock', muted);
        setPortalState('UNLOCKED');
    };

    // Format seconds to MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (mustChange) {
                await updateProfessorPassword(newPassword);
                alert('Senha alterada com sucesso! Você já está conectado.');
                setMustChange(false);
                return;
            }

            if (mode === 'REGISTER' && role === 'ALUNO') {
                await registerStudent({
                    nome: formData.nome?.trim(),
                    email: formData.email?.trim().toLowerCase(),
                    password: formData.password,
                    codigo: formData.codigo?.trim().toUpperCase()
                });
                alert('Cadastro realizado com sucesso!');
                return;
            }

            let credentials = { 
                email: formData.email?.trim().toLowerCase(), 
                password: formData.password 
            };
            const user = await login(credentials);

            if (user && user.role === 'PROFESSOR' && user.primeiro_acesso) {
                setMustChange(true);
            }
        } catch (e) {
            alert(e.message || 'Erro ao realizar ação');
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem', background: 'var(--bg-dark)', position: 'relative', overflow: 'hidden' }}>
            
            {/* Ambient Animated Cyber Nebula Background */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '600px', height: '600px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 232, 31, 0.04) 0%, rgba(99, 102, 241, 0.04) 40%, transparent 70%)',
                filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0
            }} />

            {/* Floating particles effect */}
            <div style={{
                position: 'absolute', width: '100%', height: '100%',
                backgroundImage: 'radial-gradient(1px 1px at 10% 20%, rgba(255,232,31,0.2) 0%, transparent 100%), radial-gradient(1px 1px at 50% 60%, rgba(99,102,241,0.2) 0%, transparent 100%)',
                pointerEvents: 'none', zIndex: 0
            }} />

            {/* Floating Victory bubble */}
            <AnimatePresence>
                {xpNotify && (
                    <motion.div 
                        initial={{ y: 50, opacity: 0, scale: 0.5 }}
                        animate={{ y: -120, opacity: 1, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        className="floating-xp"
                        style={{
                            position: 'absolute',
                            color: 'var(--primary)',
                            fontSize: '2rem',
                            fontWeight: '900',
                            textShadow: '0 0 12px var(--primary), 0 0 25px rgba(255, 232, 31, 0.6)',
                            fontFamily: 'Poller One, sans-serif',
                            zIndex: 9999
                        }}
                    >
                        🏆 Enigma Concluído!
                        <div style={{ fontSize: '0.8rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px', textShadow: 'none', fontFamily: 'Inter' }}>
                            {achievedTitle} + Pontos Diários!
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {portalState === 'CLOSED' ? (
                    // 1. CHOOSE/START COVER CHALLENGE CARD (SKIP & PLAY LATER SUPPORTED)
                    <motion.div 
                        key="cover-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
                        className="glass-card" 
                        style={{ padding: '2.5rem', width: '100%', maxWidth: '460px', zIndex: 10, textAlign: 'center' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                            <button 
                                onClick={toggleMute}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
                            >
                                {muted ? <VolumeX size={20} /> : <Volume2 size={20} style={{ color: 'var(--primary)' }} />}
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h1 style={{ fontSize: '2.3rem', color: 'var(--primary)', textShadow: '0 0 12px rgba(255, 232, 31, 0.4)', fontWeight: '900', marginBottom: '0.2rem' }}>
                                RANKING SENAI
                            </h1>
                            <p style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
                                Portal de Guildas
                            </p>
                        </div>

                        {/* Banner Description */}
                        <div style={{
                            margin: '1.5rem 0', padding: '1.5rem', background: 'rgba(0,0,0,0.5)', borderRadius: '16px',
                            border: '1px solid rgba(255, 232, 31, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem'
                        }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255, 232, 31, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary)' }}>
                                <Trophy size={28} style={{ color: 'var(--primary)' }} />
                            </div>
                            <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: 'bold' }}>Desafio Diário de Entrada</h3>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', margin: 0, lineHeight: '1.5' }}>
                                Resolva o máximo de enigmas que conseguir em <strong>3 minutos</strong>! Quanto mais puzzles alinhar, mais pontinhos extras garante para sua guilda (limite de <strong>5 pontos</strong>).
                            </p>
                        </div>

                        {/* Interactive Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <button
                                onClick={() => {
                                    playSynthSound('click', muted);
                                    setPortalState('PLAYING');
                                    setTimeLeft(180);
                                    setPuzzlesSolved(0);
                                }}
                                className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center', padding: '1rem', gap: '0.5rem', fontSize: '0.95rem' }}
                            >
                                <Play size={18} />
                                INICIAR DESAFIO (3 MIN)
                            </button>

                            <button
                                onClick={skipAndPlayLater}
                                style={{
                                    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff', padding: '0.9rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s'
                                }}
                                className="btn-secondary-hover"
                            >
                                <SkipForward size={16} style={{ color: 'var(--primary)' }} />
                                Pular e Jogar Depois
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '10px', marginTop: '1.5rem' }}>
                            <Compass size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', margin: 0 }}>
                                Pode pular o desafio e tentar em outro momento!
                            </p>
                        </div>
                    </motion.div>
                ) : portalState === 'PLAYING' ? (
                    // 2. ACTIVE MULTI-ROUND GAME SCREEN
                    <motion.div 
                        key="playing-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
                        className="glass-card" 
                        style={{ padding: '2.5rem', width: '100%', maxWidth: '460px', zIndex: 10, textAlign: 'center', position: 'relative' }}
                    >
                        {/* Header Stats */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <button 
                                onClick={toggleMute}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
                            >
                                {muted ? <VolumeX size={18} /> : <Volume2 size={18} style={{ color: 'var(--primary)' }} />}
                            </button>
                            
                            {/* Live HUD Counter */}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <Trophy size={14} style={{ color: 'var(--primary)' }} />
                                <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 'bold' }}>
                                    Resolvidos: {puzzlesSolved} | Pontos: {getLiveScore()}/5
                                </span>
                            </div>
                        </div>

                        {/* Glowing Timer */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            margin: '0 auto 1.2rem auto', padding: '6px 16px', background: timeLeft <= 30 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 232, 31, 0.05)',
                            borderRadius: '20px', border: timeLeft <= 30 ? '1px solid var(--danger)' : '1px solid rgba(255, 232, 31, 0.2)',
                            width: 'fit-content', boxShadow: timeLeft <= 30 ? '0 0 12px rgba(239, 68, 68, 0.2)' : 'none',
                        }}>
                            <Hourglass size={14} style={{ color: timeLeft <= 30 ? 'var(--danger)' : 'var(--primary)' }} />
                            <span style={{ fontSize: '0.8rem', color: timeLeft <= 30 ? 'var(--danger)' : 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                Tempo Restante:
                            </span>
                            <span style={{
                                fontSize: '1.15rem', fontWeight: 'bold',
                                color: timeLeft <= 30 ? 'var(--danger)' : 'var(--primary)',
                                fontFamily: 'monospace'
                            }}>
                                {formatTime(timeLeft)}
                            </span>
                        </div>

                        {/* Interactive puzzle viewport */}
                        <div style={{
                            margin: '1rem 0', padding: '1.2rem', background: 'rgba(0,0,0,0.4)', borderRadius: '16px',
                            border: '1px dashed rgba(255,255,255,0.1)', position: 'relative'
                        }}>
                            {puzzleMode === 'GEAR' ? (
                                <div className="portal-container">
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                        Alinhe os 3 conectores no topo:
                                    </p>
                                    <div className="portal-core">
                                        <div className="portal-energy-field" />
                                        
                                        <svg className="gear-svg" viewBox="0 0 300 300">
                                            <defs>
                                                <filter id="neon-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                                    <feMerge>
                                                        <feMergeNode in="blur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                                <radialGradient id="portal-gradient-center" cx="50%" cy="50%" r="50%">
                                                    <stop offset="0%" stopColor="#FFE81F" />
                                                    <stop offset="60%" stopColor="#eab308" />
                                                    <stop offset="100%" stopColor="#854d0e" />
                                                </radialGradient>
                                            </defs>
                                            
                                            <line x1="150" y1="20" x2="150" y2="120" stroke="rgba(255, 232, 31, 0.5)" strokeWidth="3" strokeDasharray="3 3" pointerEvents="none" />
                                            
                                            {/* Outer Ring */}
                                            <g className="gear-ring-element" style={{ transform: `rotate(${rotations[2] * 90}deg)` }} onClick={() => handleRingClick(2)}>
                                                <circle cx="150" cy="150" r="110" fill="none" stroke="#6366f1" strokeWidth="12" strokeDasharray="20 40 10 30" filter="url(#neon-glow-filter)" />
                                                <circle cx="150" cy="40" r="6" fill="#FFE81F" filter="url(#neon-glow-filter)" />
                                            </g>

                                            {/* Middle Ring */}
                                            <g className="gear-ring-element" style={{ transform: `rotate(${rotations[1] * 90}deg)` }} onClick={() => handleRingClick(1)}>
                                                <circle cx="150" cy="150" r="80" fill="none" stroke="#a855f7" strokeWidth="10" strokeDasharray="40 15 20 20" filter="url(#neon-glow-filter)" />
                                                <circle cx="150" cy="70" r="6" fill="#FFE81F" filter="url(#neon-glow-filter)" />
                                            </g>

                                            {/* Inner Ring */}
                                            <g className="gear-ring-element" style={{ transform: `rotate(${rotations[0] * 90}deg)` }} onClick={() => handleRingClick(0)}>
                                                <circle cx="150" cy="150" r="50" fill="none" stroke="#ec4899" strokeWidth="8" strokeDasharray="30 20" filter="url(#neon-glow-filter)" />
                                                <circle cx="150" cy="100" r="6" fill="#FFE81F" filter="url(#neon-glow-filter)" />
                                            </g>

                                            <circle cx="150" cy="150" r="22" fill="url(#portal-gradient-center)" filter="url(#neon-glow-filter)" />
                                            <polygon points="150,138 158,150 150,162 142,150" fill="#000" />
                                        </svg>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                                        {[2, 1, 0].map(idx => (
                                            <button
                                                key={idx}
                                                onClick={() => handleRingClick(idx)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                                    color: '#fff', fontSize: '0.7rem', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer'
                                                }}
                                            >
                                                Girar {idx === 2 ? 'Externo' : idx === 1 ? 'Médio' : 'Interno'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="portal-container">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                                            Encontre os pares:
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                            {matchedNames.length} / {memorySymbols.length} Pares
                                        </p>
                                    </div>
                                    
                                    <div className="memory-grid">
                                        {cards.map((card, idx) => {
                                            const isFlipped = flippedIndices.includes(idx) || matchedNames.includes(card.name);
                                            const isMatched = matchedNames.includes(card.name);
                                            
                                            return (
                                                <div 
                                                    key={card.id} 
                                                    onClick={() => handleCardClick(idx)}
                                                    className={`memory-card ${isFlipped ? 'flipped' : ''} ${isMatched ? 'matched' : ''}`}
                                                    style={{ height: '70px', minWidth: '70px' }}
                                                >
                                                    <div className="memory-card-front">
                                                        <HelpCircle size={22} style={{ color: 'rgba(255,255,255,0.2)' }} />
                                                    </div>
                                                    <div className="memory-card-back">
                                                        <card.Icon size={24} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <button 
                                        onClick={startMemoryGame}
                                        style={{
                                            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
                                            fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer', marginTop: '5px'
                                        }}
                                    >
                                        Reiniciar Grid
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mid-Game actions */}
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem' }}>
                            <button
                                onClick={() => {
                                    playSynthSound('click', muted);
                                    finishAndSavePoints();
                                }}
                                className="btn btn-primary"
                                style={{ flex: 1, justifyContent: 'center', padding: '0.8rem', gap: '0.4rem', fontSize: '0.85rem' }}
                            >
                                <CheckCircle size={14} />
                                Finalizar e Salvar
                            </button>

                            <button
                                onClick={skipAndPlayLater}
                                style={{
                                    flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff', padding: '0.8rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold',
                                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                                }}
                            >
                                <ZapOff size={14} style={{ color: 'var(--primary)' }} />
                                Jogar Depois
                            </button>
                        </div>
                    </motion.div>
                ) : portalState === 'ATTEMPTED' ? (
                    // 3. LOCK OUT SCREEN WITH DETAILED STATS (Puzzles solved divided by time spent!)
                    <motion.div 
                        key="attempted-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="glass-card" 
                        style={{ padding: '2.5rem', width: '100%', maxWidth: '460px', zIndex: 10, textAlign: 'center' }}
                    >
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h1 style={{ fontSize: '2.4rem', color: 'var(--primary)', textShadow: '0 0 12px rgba(255, 232, 31, 0.4)', fontWeight: '900', marginBottom: '0.2rem' }}>
                                RANKING SENAI
                            </h1>
                            <p style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>
                                Portal de Guildas
                            </p>
                        </div>

                        {/* Status Icon & Message */}
                        <div style={{
                            margin: '1.5rem 0', padding: '2rem 1.5rem', background: 'rgba(0,0,0,0.5)', borderRadius: '20px',
                            border: localStorage.getItem('portalAttemptResult') === 'SUCCESS' 
                                ? '1px solid rgba(74, 222, 128, 0.3)' 
                                : '1px solid rgba(239, 68, 68, 0.3)',
                            boxShadow: localStorage.getItem('portalAttemptResult') === 'SUCCESS'
                                ? '0 0 20px rgba(74, 222, 128, 0.1)'
                                : '0 0 20px rgba(239, 68, 68, 0.1)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem'
                        }}>
                            {localStorage.getItem('portalAttemptResult') === 'SUCCESS' ? (
                                <>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--success)', boxShadow: '0 0 15px rgba(74, 222, 128, 0.3)' }}>
                                        <Trophy size={32} style={{ color: 'var(--success)' }} />
                                    </div>
                                    
                                    <h3 style={{ color: 'var(--success)', fontSize: '1.2rem', margin: 0, fontFamily: 'Poller One, sans-serif' }}>
                                        Portal Concluído!
                                    </h3>
                                    
                                    {/* Points score display */}
                                    <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)', textShadow: '0 0 10px rgba(255, 232, 31, 0.4)', fontFamily: 'Poller One, sans-serif', margin: '5px 0' }}>
                                        {localStorage.getItem('portalAttemptScore')} / 5 Pontos
                                    </div>

                                    {/* Division Stats breakdown: puzzles solved / time spent */}
                                    <div style={{
                                        width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                                        fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Puzzles Concluídos:</span>
                                            <strong style={{ color: '#fff' }}>{localStorage.getItem('portalAttemptPuzzles')}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Tempo Utilizado:</span>
                                            <strong style={{ color: '#fff' }}>{formatTime(Number(localStorage.getItem('portalAttemptTimeSpent')))}</strong>
                                        </div>
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                                        
                                        {/* Dynamic division breakdown ratio */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fator de Divisão (Acerto/Tempo):</span>
                                            <strong style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                                {(Number(localStorage.getItem('portalAttemptPuzzles')) / Math.max(1, Number(localStorage.getItem('portalAttemptTimeSpent')))).toFixed(4)} P/s
                                            </strong>
                                        </div>
                                    </div>

                                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', margin: 0, lineHeight: '1.4' }}>
                                        Parabéns! Sua recompensa foi registrada. Volte amanhã para resolver novos portais e pontuar!
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--danger)', boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)' }}>
                                        <Shield size={32} style={{ color: 'var(--danger)' }} />
                                    </div>
                                    <h3 style={{ color: 'var(--danger)', fontSize: '1.2rem', margin: 0, fontFamily: 'Poller One, sans-serif' }}>
                                        Desafio Esgotado!
                                    </h3>
                                    
                                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--danger)', fontFamily: 'Poller One, sans-serif', margin: '5px 0' }}>
                                        0 / 5 Pontos
                                    </div>

                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', margin: 0, lineHeight: '1.5' }}>
                                        O tempo esgotou sem puzzles resolvidos. Você poderá tentar novas runas de guilda amanhã!
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Action buttons */}
                        <button 
                            onClick={() => {
                                playSynthSound('unlock', muted);
                                setPortalState('UNLOCKED');
                            }}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '1rem', gap: '0.5rem', marginBottom: '0.5rem' }}
                        >
                            ENTRAR NA GUILDA (LOGAR)
                            <LogIn size={18} />
                        </button>
                    </motion.div>
                ) : (
                    // 4. UNLOCKED CYBERPUNK LOGIN FORM CARD
                    <motion.div 
                        key="login-form-card"
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="glass-card" 
                        style={{ padding: '2.5rem', width: '100%', maxWidth: '450px', zIndex: 10 }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h1 style={{ fontSize: '2.3rem', marginBottom: '0.4rem', color: 'var(--primary)', textShadow: '0 0 10px rgba(255, 232, 31, 0.3)', fontWeight: '900' }}>
                                RANKING SENAI
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {mustChange ? 'Alteração de Senha Obrigatória' :
                                    mode === 'REGISTER' ? 'Crie sua ficha de Aventureiro' : 'Acesse sua conta para ver o Ranking'}
                            </p>
                        </div>

                        {!mustChange && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', padding: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                {['ALUNO', 'PROFESSOR', 'ADMIN'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => { 
                                            playSynthSound('click', muted);
                                            setRole(r); 
                                            setMode('LOGIN'); 
                                        }}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                            background: role === r ? 'var(--primary)' : 'transparent',
                                            color: role === r ? '#000' : 'rgba(255,255,255,0.5)',
                                            fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {mustChange ? (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251,191,36,0.2)' }}>
                                        <p style={{ color: 'var(--warning)', fontWeight: 'bold' }}>Segurança em Primeiro Lugar!</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mestres devem trocar a senha no primeiro acesso.</p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><Lock size={14} /> Nova Senha</label>
                                        <input
                                            className="input-field"
                                            type="password"
                                            placeholder="Sua nova senha secreta"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '1rem' }}>
                                        SALVAR E CONTINUAR
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '1.2rem' }}>
                                    {mode === 'REGISTER' && (
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><User size={14} /> Seu Nome</label>
                                            <input
                                                className="input-field"
                                                placeholder="Ex: João da Silva"
                                                value={formData.nome}
                                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                                required
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><Mail size={14} /> E-mail</label>
                                        <input
                                            className="input-field"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><Lock size={14} /> Senha</label>
                                        <input
                                            className="input-field"
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>

                                    {mode === 'REGISTER' && (
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}><Code size={14} /> Código da Turma</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    className="input-field"
                                                    placeholder="Código fornecido pelo professor"
                                                    value={formData.codigo}
                                                    onChange={e => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                                                    required
                                                    style={{ marginBottom: 0, flex: 1 }}
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        playSynthSound('click', muted);
                                                        setShowQRScanner(true);
                                                    }}
                                                    className="btn" 
                                                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '0 1rem', width: 'auto' }}
                                                >
                                                    <Camera size={18} style={{ color: '#fff' }} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '1rem', gap: '0.5rem' }}>
                                        {mode === 'REGISTER' ? 'CRIAR CONTA' : 'ENTRAR NA GUILDA'}
                                        <LogIn size={18} />
                                    </button>

                                    {role === 'ALUNO' && (
                                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                            {mode === 'LOGIN' ? (
                                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                                    Não tem conta? <span onClick={() => { playSynthSound('click', muted); setMode('REGISTER'); }} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>Cadastre-se aqui</span>
                                                </p>
                                            ) : (
                                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                                    Já tem conta? <span onClick={() => { playSynthSound('click', muted); setMode('LOGIN'); }} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>Faça login</span>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>

                        {/* Back to Portal Gate button */}
                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <button
                                onClick={() => {
                                    playSynthSound('click', muted);
                                    // Reset to ATTEMPTED state if already attempted today, otherwise CLOSED
                                    const todayStr = new Date().toDateString();
                                    const lastAttemptDate = localStorage.getItem('portalLastAttemptDate');
                                    if (lastAttemptDate === todayStr) {
                                        setPortalState('ATTEMPTED');
                                    } else {
                                        setPortalState('CLOSED');
                                    }
                                }}
                                style={{
                                    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
                                    fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                                }}
                            >
                                <ArrowLeft size={12} />
                                Voltar para o Portal
                            </button>
                        </div>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.2rem' }}>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                                Desenvolvido por <strong>Johnny Oliveira</strong>
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal do Scanner */}
            {showQRScanner && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
                }} onClick={() => setShowQRScanner(false)}>
                    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px', width: '100%', background: 'var(--bg-dark)' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Escanear Código</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Aponte a câmera para o QR Code da sala.</p>
                        
                        <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', border: '2px solid var(--primary)' }}>
                            <Scanner 
                                onScan={(result) => {
                                    if (result && result.length > 0) {
                                        setFormData({ ...formData, codigo: result[0].rawValue.toUpperCase() });
                                        setShowQRScanner(false);
                                    }
                                }}
                                onError={(error) => console.log(error)}
                            />
                        </div>

                        <button 
                            type="button" 
                            onClick={() => {
                                playSynthSound('click', muted);
                                setShowQRScanner(false);
                            }} 
                            className="btn" 
                            style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.1)' }}
                        >
                            CANCELAR
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
