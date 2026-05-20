import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from './DataContext';
import { Trophy, Users, Star, Plus, Send, LogOut, Award, BookOpen, RefreshCw, Key, Image as ImageIcon, UserCircle, CheckCircle, MessageCircle, Megaphone, Lock, ShieldAlert, Filter, TrendingUp, TrendingDown, Minus, Trash2, Camera, Upload, Target, QrCode, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import BoletimAluno from './BoletimAluno';

const TechParticles = () => {
    const particles = useMemo(() => {
        const symbols = ['0', '1', '</>', 'code', 'const', 'let', 'JSON', 'git', 'fn()', 'class', 'SENAI', 'TI'];
        return Array.from({ length: 25 }).map((_, idx) => ({
            id: idx,
            symbol: symbols[Math.floor(Math.random() * symbols.length)],
            left: `${Math.random() * 95}%`,
            delay: `${Math.random() * 8}s`,
            duration: `${6 + Math.random() * 8}s`,
            fontSize: `${0.7 + Math.random() * 0.9}rem`,
        }));
    }, []);

    return (
        <div className="projector-particles-container">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="projector-particle"
                    style={{
                        left: p.left,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                        fontSize: p.fontSize,
                    }}
                >
                    {p.symbol}
                </div>
            ))}
        </div>
    );
};

const Sparkline = ({ up }) => {
    const points = useMemo(() => {
        const baseline = 15;
        const segments = 6;
        const stepX = 15;
        const vals = [];
        for (let i = 0; i <= segments; i++) {
            const x = i * stepX;
            let y;
            if (up) {
                y = baseline + (segments - i) * 3 - Math.random() * 5;
            } else {
                y = baseline + i * 3 - Math.random() * 5;
            }
            y = Math.max(2, Math.min(28, y));
            vals.push(`${x},${y}`);
        }
        return `M ${vals.join(' L ')}`;
    }, [up]);

    return (
        <svg className={`sparkline-svg ${up ? 'up' : 'down'}`} viewBox="0 0 90 30">
            <path d={points} />
        </svg>
    );
};

const StockTickerTape = ({ ranking }) => {
    const scrollContent = useMemo(() => {
        if (!ranking || ranking.length === 0) {
            return "🚀 MERCADO DE GUILDAS: Nenhuma movimentação recente registrada nas cotações de XP. | ⚠️ AVISO: Complete o Portal Diário de 3 minutos para somar até 5 pontos de XP!";
        }
        return ranking.map((r, i) => {
            const rankDelta = r.posicao_anterior ? (r.posicao_anterior - (i + 1)) : 0;
            const up = rankDelta >= 0;
            const emoji = up ? '▲' : '▼';
            const pct = rankDelta !== 0 ? Math.abs(rankDelta * 2.5).toFixed(1) : (Math.random() * 2 + 0.5).toFixed(1);
            return `⚡ ${r.nome} (${r.turmaNome}) [${r.xp} XP] ${emoji} ${pct}% |`;
        }).join('  ');
    }, [ranking]);

    return (
        <div className="stock-ticker-tape">
            <div className="stock-ticker-tape-scroll">
                {scrollContent}
            </div>
        </div>
    );
};

const DashboardAdmin = () => {
    const {
        logout, user, token, classes, selectedClass, setSelectedClass,
        addActivity, setStudentGrade, ranking, refreshAll, loading,
        createClass, deleteClass, updateProfile, activities, students, sendMessage, messages, resetStudentPassword, deleteStudent, uploadFile,
        missions, addMission, deleteMission, gradeMission
    } = useData();

    const [tab, setTab] = useState('ranking');
    const [selectedMissionForGrading, setSelectedMissionForGrading] = useState(null);
    const [showNewClass, setShowNewClass] = useState(false);
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(user?.foto_url || '');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [boletimAlunoId, setBoletimAlunoId] = useState(null);
    const fileInputRef = useRef(null);

    // Helper to get full image URL
    const getFullImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        const baseUrl = window.location.origin.includes('localhost:5000')
            ? 'http://localhost:3001'
            : window.location.origin;
        return `${baseUrl}${url}`;
    };

    const [newTurma, setNewTurma] = useState({ nome: '', materia: '', observacao: '' });
    const [newActivity, setNewActivity] = useState({ titulo: '', descricao: '', nota_maxima: 10 });
    const [profileData, setProfileData] = useState({
        foto_url: user?.foto_url || '',
        bio: user?.bio || '',
        mensagem_incentivo: user?.mensagem_incentivo || ''
    });

    const [selectedActivity, setSelectedActivity] = useState(null);
    const [editGrades, setEditGrades] = useState({});

    // Mission state
    const [newMission, setNewMission] = useState({ titulo: '', descricao: '', recompensa: 0, prazo: '' });

    // Messaging state
    const [msgTarget, setMsgTarget] = useState('turma'); // 'turma' or alumnoId
    const [msgContent, setMsgContent] = useState('');

    // Admin filters
    const [adminFilterProfessor, setAdminFilterProfessor] = useState('all');

    useEffect(() => {
        if (user) {
            setProfileData({
                foto_url: user.foto_url || '',
                bio: user.bio || '',
                mensagem_incentivo: user.mensagem_incentivo || ''
            });
            setPreviewUrl(user.foto_url || '');
        }
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleCreateTurma = async (e) => {
        e.preventDefault();
        try {
            await createClass(newTurma.nome, newTurma.materia, newTurma.observacao);
            setNewTurma({ nome: '', materia: '', observacao: '' });
            setShowNewClass(false);
            alert('Turma criada com sucesso!');
        } catch (err) {
            alert('Falha ao criar turma: ' + err.message);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            let finalFotoUrl = profileData.foto_url;

            if (selectedFile) {
                // Convert image file directly to a permanent Base64 string to prevent container-wipe expiries
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(selectedFile);
                });
                finalFotoUrl = base64;
            }

            await updateProfile({ ...profileData, foto_url: finalFotoUrl });
            setShowProfileEdit(false);
            setSelectedFile(null);
            alert('Perfil atualizado com sucesso!');
        } catch (err) {
            alert('Falha ao atualizar perfil: ' + err.message);
        }
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        if (!selectedClass) return alert('Selecione uma turma primeiro');
        try {
            await addActivity(newActivity);
            setNewActivity({ titulo: '', descricao: '', nota_maxima: 10 });
            alert('Atividade lançada com sucesso!');
        } catch (err) {
            alert('Falha ao lançar atividade');
        }
    };

    const handleSetGrade = async (studentId, activityId) => {
        const value = editGrades[`${studentId}-${activityId}`];
        if (value === undefined || value === '') return;
        try {
            await setStudentGrade(studentId, activityId, value);
            // Removido o alert para não interromper o professor ao digitar várias notas
            // Pode ser adicionado um toast de sucesso no futuro
        } catch (err) {
            alert('Erro ao salvar nota');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!msgContent.trim()) return;
        try {
            const data = { conteudo: msgContent };
            if (msgTarget === 'turma') {
                if (!selectedClass) return alert('Selecione uma turma');
                data.turmaId = selectedClass.id;
            } else {
                data.alunoId = parseInt(msgTarget);
            }
            await sendMessage(data);
            setMsgContent('');
            alert('Mensagem enviada!');
        } catch (err) {
            alert('Erro ao enviar mensagem');
        }
    };

    const handleDeleteTurma = async () => {
        if (!selectedClass) return;
        if (window.confirm(`ATENÇÃO: Deseja realmente excluir a guilda "${selectedClass.nome}"? Isso excluirá todos os alunos, notas e tudo vinculado a ela permanentemente!`)) {
            try {
                await deleteClass(selectedClass.id);
                alert('Guilda excluída com sucesso!');
            } catch (err) {
                alert('Erro ao excluir guilda: ' + err.message);
            }
        }
    };

    const handleResetPassword = async (id, nome) => {
        if (window.confirm(`Deseja resetar a senha de ${nome} para 'senai123'?`)) {
            try {
                await resetStudentPassword(id);
                alert('Senha resetada com sucesso para senai123');
            } catch (err) {
                alert('Erro ao resetar senha');
            }
        }
    };

    const handleDeleteStudent = async (id, nome) => {
        if (window.confirm(`Deseja realmente excluir o aluno ${nome} da turma? Esta ação não pode ser desfeita.`)) {
            try {
                await deleteStudent(id);
                alert('Aluno excluído com sucesso!');
            } catch (err) {
                alert('Erro ao excluir aluno: ' + err.message);
            }
        }
    };

    const handleAddMission = async (e) => {
        e.preventDefault();
        if (!selectedClass) return alert('Selecione uma turma primeiro');
        try {
            await addMission(newMission);
            setNewMission({ titulo: '', descricao: '', recompensa: 0, prazo: '' });
            alert('Missão criada com sucesso!');
        } catch (err) {
            alert('Falha ao criar missão: ' + err.message);
        }
    };

    const handleDeleteMission = async (id, titulo) => {
        if (window.confirm(`Tem certeza que deseja excluir a missão "${titulo}"?`)) {
            try {
                await deleteMission(id);
                alert('Missão excluída com sucesso!');
            } catch (err) {
                alert('Erro ao excluir missão: ' + err.message);
            }
        }
    };

    const handleSaveMissionGrade = async (alunoId, valor) => {
        if (!selectedMissionForGrading) return;
        try {
            await gradeMission(selectedMissionForGrading.id, alunoId, valor);
            // Mostrar feedback visual (opcional, por enquanto o alert serve)
            // alert('Nota salva!'); 
        } catch (err) {
            alert('Erro ao salvar nota: ' + err.message);
        }
    };

    const filteredStudents = students.filter(s => !selectedClass || s.turmaId === selectedClass.id);
    const filteredActivities = activities.filter(a => !selectedClass || a.turmaId === selectedClass.id);
    const filteredMessages = messages.filter(m => !selectedClass || m.turmaId === selectedClass.id || (m.aluno && filteredStudents.some(s => s.id === m.alunoId)));
    const filteredMissions = missions.filter(m => !selectedClass || m.turmaId === selectedClass.id);

    // Ranking filtering logic
    const filteredRanking = useMemo(() => {
        if (user?.role === 'ADMIN') {
            if (adminFilterProfessor === 'all') return ranking;
            return ranking.filter(r => r.professorId === parseInt(adminFilterProfessor));
        }
        // For PROFESSOR, filter by selected class
        if (!selectedClass) return [];
        return ranking.filter(r => r.turmaId === selectedClass.id);
    }, [ranking, user?.role, adminFilterProfessor, selectedClass]);

    const professorsList = useMemo(() => {
        if (user?.role !== 'ADMIN') return [];
        const uniqueProfessors = [];
        const map = new Map();
        for (const item of ranking) {
            if (!map.has(item.professorId)) {
                map.set(item.professorId, true);
                uniqueProfessors.push({ id: item.professorId, nome: item.professorNome });
            }
        }
        return uniqueProfessors;
    }, [ranking, user?.role]);

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div onClick={() => setShowProfileEdit(true)} style={{ position: 'relative', cursor: 'pointer' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--secondary)', background: 'rgba(255,255,255,0.05)' }}>
                            {user?.foto_url ? <img src={getFullImageUrl(user.foto_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle size={30} style={{ margin: '15px' }} />}
                        </div>
                        <div style={{ position: 'absolute', top: '0', right: '0', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '4px' }}>
                            <Camera size={12} color="white" />
                        </div>
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>RANKING SENAI</h1>
                        <h2 style={{ fontSize: '1.1rem', color: 'var(--secondary)' }}>{user?.role === 'ADMIN' ? 'Administrador Supremo' : `Mestre ${user?.nome}`}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                            <div className="glass-card" style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <BookOpen size={16} color="var(--primary)" />
                                <select
                                    style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
                                    value={selectedClass?.id || ''}
                                    onChange={(e) => {
                                        const id = parseInt(e.target.value);
                                        const found = classes.find(c => c.id === id);
                                        if (found) setSelectedClass(found);
                                    }}
                                >
                                    <option value="" disabled>Selecionar Turma</option>
                                    {classes.map(c => <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.nome}</option>)}
                                </select>
                            </div>
                            {user?.role !== 'ADMIN' && (
                                <button onClick={() => setShowNewClass(true)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                                    <Plus size={16} /> NOVA TURMA
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={refreshAll} className="btn glass-card" disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                    <button onClick={logout} className="btn btn-logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {showProfileEdit && (
                <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Camera size={20} /> Perfil do Mestre
                    </h3>
                    <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--secondary)', cursor: 'pointer', position: 'relative' }}
                            >
                                {previewUrl ? <img src={getFullImageUrl(previewUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle size={60} style={{ margin: '30px', color: 'var(--text-muted)' }} />}
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                                    <Upload color="white" size={30} />
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                        </div>

                        <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '-0.8rem' }}>URL da Foto (opcional se fez upload)</label>
                        <input className="input-field" placeholder="https://..." value={profileData.foto_url} onChange={e => {
                            setProfileData({ ...profileData, foto_url: e.target.value });
                            if (e.target.value) setPreviewUrl(e.target.value);
                        }} />

                        <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '-0.8rem' }}>Bio / História</label>
                        <textarea className="input-field" placeholder="Sua Bio / História" value={profileData.bio} onChange={e => setProfileData({ ...profileData, bio: e.target.value })} style={{ minHeight: '100px' }} />

                        <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '-0.8rem' }}>Mensagem de Incentivo</label>
                        <input className="input-field" placeholder="Mensagem de Incentivo" value={profileData.mensagem_incentivo} onChange={e => setProfileData({ ...profileData, mensagem_incentivo: e.target.value })} />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>SALVAR PERFIL</button>
                            <button type="button" onClick={() => setShowProfileEdit(false)} className="btn glass-card" style={{ flex: 1 }}>CANCELAR</button>
                        </div>
                    </form>
                </div>
            )}

            {showNewClass && (
                <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem', maxWidth: '500px', margin: '0 auto 3rem auto' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Criar Nova Turma</h3>
                    <form onSubmit={handleCreateTurma} style={{ display: 'grid', gap: '1.2rem' }}>
                        <input className="input-field" placeholder="Nome da Turma" value={newTurma.nome} onChange={e => setNewTurma({ ...newTurma, nome: e.target.value })} required />
                        <input className="input-field" placeholder="Matéria" value={newTurma.materia} onChange={e => setNewTurma({ ...newTurma, materia: e.target.value })} />
                        <textarea className="input-field" placeholder="Observações da Turma" value={newTurma.observacao} onChange={e => setNewTurma({ ...newTurma, observacao: e.target.value })} />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>CRIAR TURMA</button>
                            <button type="button" onClick={() => setShowNewClass(false)} className="btn glass-card" style={{ flex: 1 }}>CANCELAR</button>
                        </div>
                    </form>
                </div>
            )}

            {selectedClass && (
                <div className="glass-card" style={{ padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--secondary)' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>CÓDIGO DE ACESSO</p>
                            <h2 style={{ letterSpacing: '2px', color: 'var(--warning)' }}>{selectedClass.codigo}</h2>
                        </div>
                        <div style={{ height: '40px', width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <button
                            onClick={() => setShowQRModal(true)}
                            className="btn btn-warning-outline"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <QrCode size={14} /> EXIBIR QR CODE
                        </button>
                        <button
                            onClick={handleDeleteTurma}
                            className="btn btn-danger-outline"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                            <Trash2 size={14} /> EXCLUIR GUILDA
                        </button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h3 style={{ margin: 0 }}>{selectedClass.nome}</h3>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>{selectedClass.materia}</p>
                    </div>
                </div>
            )}

            <nav style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setTab('ranking')} className={`btn ${tab === 'ranking' ? 'btn-active' : ''}`}><Trophy size={18} /> Ranking</button>
                <button onClick={() => setTab('atividades')} className={`btn ${tab === 'atividades' ? 'btn-active' : ''}`}><Plus size={18} /> Atividades/Notas</button>
                <button onClick={() => setTab('missoes')} className={`btn ${tab === 'missoes' ? 'btn-active' : ''}`}><Target size={18} /> Missões</button>
                <button onClick={() => setTab('mensagens')} className={`btn ${tab === 'mensagens' ? 'btn-active' : ''}`}><MessageCircle size={18} /> Mensagens</button>
                <button onClick={() => setTab('alunos')} className={`btn ${tab === 'alunos' ? 'btn-active' : ''}`}><Users size={18} /> Alunos</button>
            </nav>

            <main className="glass-card" style={{ padding: '2.5rem' }}>
                {tab === 'ranking' && (
                    <div>
                        {user?.role === 'ADMIN' && (
                            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Filter size={16} color="var(--primary)" />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Filtrar por Mestre:</span>
                                    <select
                                        className="input-field"
                                        style={{ width: 'auto', padding: '0.2rem', marginBottom: 0 }}
                                        value={adminFilterProfessor}
                                        onChange={e => setAdminFilterProfessor(e.target.value)}
                                    >
                                        <option value="all">TODOS OS MESTRES</option>
                                        {professorsList.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                    </select>
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                    Mostrando {filteredRanking.length} aventureiros
                                </div>
                            </div>
                        )}
                        {!selectedClass && user?.role !== 'ADMIN' ? (
                            <div style={{ position: 'relative', overflow: 'hidden', minHeight: '520px', padding: '1rem 0' }}>
                                {/* Floating binary/code tech particle streams */}
                                <TechParticles />
                                
                                {/* Top flashing warning notice bar */}
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '0.8rem 1.2rem', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#ff4d4d', fontWeight: 'bold', zIndex: 10, position: 'relative', boxShadow: '0 0 15px rgba(239, 68, 68, 0.1)' }}>
                                    <ShieldAlert size={20} className="pulse" />
                                    <marquee scrollamount="4" style={{ margin: 0, fontStyle: 'italic' }}>
                                        ⚠️ AVISO DA GUILDA DE TI: Portal de Desafios Diários ativado! Lembre os alunos de realizarem o puzzle de 3 minutos para acumular até +5 pontos extras no Ranking. Novas missões de elite disponíveis!
                                    </marquee>
                                </div>

                                <div className="prof-projector-wrapper">
                                    {/* Left Card: Pointing finger illustration with glowing neon border */}
                                    <div className="prof-projector-avatar-card">
                                        <img src="/professor_avatar.jpg" className="prof-projector-avatar-img" alt="Professor de TI SENAI" />
                                        <div className="prof-projector-avatar-overlay"></div>
                                        <div className="prof-projector-avatar-content">
                                            <div style={{ background: 'rgba(255, 232, 31, 0.15)', border: '1px solid var(--primary)', display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900', color: 'var(--primary)', marginBottom: '0.5rem', fontFamily: "'Poller One', sans-serif" }}>
                                                MESTRE OFICIAL
                                            </div>
                                            <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.2rem 0', textShadow: '0 2px 10px rgba(0,0,0,0.5)', color: 'white' }}>
                                                Mestre {user?.nome || 'Johnny'}
                                            </h2>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', margin: 0, textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
                                                PROFESSOR DE TI - SENAI
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Side: Informações da Guilda, Bio & Stock Ticker Summary */}
                                    <div className="prof-projector-info-section">
                                        <div>
                                            <h3 style={{ color: 'var(--primary)', fontSize: '1.4rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 232, 31, 0.2)', paddingBottom: '0.5rem' }}>
                                                SOBRE A GUILDA / MIM
                                            </h3>
                                            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#e0e0e0', marginBottom: '1rem' }}>
                                                Seja muito bem-vindo ao ecossistema tecnológico do **Ranking SENAI**! Este painel avançado foi concebido especificamente para projeção direta em sala de aula, criando um ambiente imersivo de competição saudável.
                                            </p>
                                            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#e0e0e0' }}>
                                                A dinâmica funciona como uma **Bolsa de Valores das Guildas**: o engajamento diário, resolução de missões cooperativas de código e acertos rápidos no portal valorizam o portfólio da turma, movendo os indicadores de XP em tempo real!
                                            </p>
                                            
                                            <div style={{ marginTop: '1.5rem' }}>
                                                <h4 style={{ fontSize: '0.8rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Rituais Ativos da Guilda</h4>
                                                <div className="ritual-pill">
                                                    <strong style={{ color: 'var(--primary)' }}>⚡ Portal Diário (Wordle-like)</strong>
                                                    <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: '0.2rem 0 0 0' }}>Estudantes resolvem desafios de código sob pressão. 3 min max, renderiza até +5 pontos.</p>
                                                </div>
                                                <div className="ritual-pill">
                                                    <strong style={{ color: 'var(--primary)' }}>🏆 Quotas e Gráficos da Bolsa</strong>
                                                    <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: '0.2rem 0 0 0' }}>Análise dinâmica de quem subiu e caiu no ranking, gerando indicadores de volatilidade de XP.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                                    <Trophy size={20} color="var(--primary)" />
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '0.85rem' }}>Bolsa de Valores Ativa</h4>
                                                    <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6 }}>Selecione uma turma para carregar as cotações</p>
                                                </div>
                                            </div>
                                            <div style={{ animation: 'pulse 2s infinite' }}>
                                                <span className="stock-badge-up">LIVE CONNECTED</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {/* Stock exchange style scrolling ticker tape */}
                                <StockTickerTape ranking={filteredRanking} />

                                <div className="stock-market-board">
                                    <TechParticles />
                                    <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: "'Poller One', sans-serif", position: 'relative', zIndex: 2 }}>
                                        💰 COTAÇÕES DE XP DA GUILDA: {selectedClass ? selectedClass.nome : 'GERAL'}
                                    </h3>
                                    <div style={{ overflowX: 'auto', position: 'relative', zIndex: 2 }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '2px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                                    <th style={{ padding: '1rem' }}>TICKER / POSIÇÃO</th>
                                                    <th style={{ padding: '1rem' }}>ATIVO / ALUNO</th>
                                                    <th style={{ padding: '1rem', textAlign: 'center' }}>TENDÊNCIA (GRÁFICO)</th>
                                                    <th style={{ padding: '1rem', textAlign: 'center' }}>VARIAÇÃO (24H)</th>
                                                    <th style={{ padding: '1rem' }}>GUILDA (TURMA)</th>
                                                    {user?.role === 'ADMIN' && <th style={{ padding: '1rem' }}>MESTRE</th>}
                                                    <th style={{ padding: '1rem', textAlign: 'right' }}>VALOR DE MERCADO</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredRanking.map((r, i) => {
                                                    const rankDelta = r.posicao_anterior ? (r.posicao_anterior - (i + 1)) : 0;
                                                    const isUp = rankDelta > 0;
                                                    const isDown = rankDelta < 0;
                                                    const pct = rankDelta !== 0 ? Math.abs(rankDelta * 2.5).toFixed(1) : "0.0";
                                                    
                                                    return (
                                                        <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isUp ? 'rgba(74, 222, 128, 0.02)' : isDown ? 'rgba(239, 68, 68, 0.02)' : 'transparent', transition: 'background 0.3s ease' }}>
                                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                                                <span style={{ fontSize: '1.1rem', marginRight: '6px', color: isUp ? '#4ade80' : isDown ? '#ef4444' : '#ffffff' }}>
                                                                    {i + 1}º
                                                                </span>
                                                                {rankDelta !== 0 ? (
                                                                    isUp ? (
                                                                        <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 'bold' }}>▲ {Math.abs(rankDelta)}</span>
                                                                    ) : (
                                                                        <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>▼ {Math.abs(rankDelta)}</span>
                                                                    )
                                                                ) : (
                                                                    <span style={{ color: 'var(--secondary)', fontSize: '0.75rem', opacity: 0.5 }}>—</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                                <div style={{ width: '35px', height: '35px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.1)' }}>
                                                                    {r.foto_url ? <img src={getFullImageUrl(r.foto_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle size={14} style={{ margin: '10px' }} />}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                        {r.estado_humor && <span title="Humor do dia">{r.estado_humor}</span>}
                                                                        {r.nome}
                                                                    </div>
                                                                    <span style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '0.5px' }}>CO-DER #{r.id}</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                <Sparkline up={isUp || rankDelta === 0} />
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                                {rankDelta !== 0 ? (
                                                                    isUp ? (
                                                                        <span className="stock-badge-up">▲ +{pct}%</span>
                                                                    ) : (
                                                                        <span className="stock-badge-down">▼ -{pct}%</span>
                                                                    )
                                                                ) : (
                                                                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', opacity: 0.7 }}>— 0.0%</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{r.turmaNome}</td>
                                                            {user?.role === 'ADMIN' && <td style={{ padding: '1rem', color: 'var(--secondary)' }}>{r.professorNome}</td>}
                                                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '900', color: '#FFFFFF', fontSize: '1.05rem', textShadow: '0 0 8px rgba(255,255,255,0.2)' }}>
                                                                $ {r.xp.toLocaleString()} XP
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'alunos' && (
                    <div>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={20} /> Alunos da Guilda</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>
                                        <th style={{ padding: '1rem' }}>NOME</th>
                                        <th style={{ padding: '1rem' }}>E-MAIL</th>
                                        <th style={{ padding: '1rem' }}>TURMA</th>
                                        <th style={{ padding: '1rem' }}>AÇÕES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
                                                    {s.foto_url ? <img src={getFullImageUrl(s.foto_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle size={14} style={{ margin: '8px' }} />}
                                                </div>
                                                {s.estado_humor && <span style={{ marginRight: '6px' }} title="Humor do dia">{s.estado_humor}</span>}
                                                {s.nome}
                                            </td>
                                            <td style={{ padding: '1rem', opacity: 0.8 }}>{s.email || '—'}</td>
                                            <td style={{ padding: '1rem' }}>{s.turma?.nome}</td>
                                            <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <div 
                                                    role="button"
                                                    onClick={() => setBoletimAlunoId(s.id)} 
                                                    className="btn" 
                                                    style={{ 
                                                        padding: '0.4rem 0.8rem', 
                                                        fontSize: '0.7rem', 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '0.4rem', 
                                                        background: 'rgba(255,232,31,0.15)', 
                                                        border: '1px solid rgba(255,232,31,0.4)', 
                                                        color: '#ffe81f',
                                                        cursor: 'pointer',
                                                        borderRadius: '8px',
                                                        fontWeight: 'bold',
                                                        userSelect: 'none',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,232,31,0.25)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,232,31,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                >
                                                    <FileText size={14} /> BOLETIM
                                                </div>
                                                <div 
                                                    role="button"
                                                    onClick={() => handleResetPassword(s.id, s.nome)} 
                                                    className="btn btn-warning-outline" 
                                                    style={{ 
                                                        padding: '0.4rem 0.8rem', 
                                                        fontSize: '0.7rem', 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '0.4rem',
                                                        cursor: 'pointer',
                                                        borderRadius: '8px',
                                                        userSelect: 'none',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                                >
                                                    <ShieldAlert size={14} /> REDEFINIR SENHA
                                                </div>
                                                <div 
                                                    role="button"
                                                    onClick={() => handleDeleteStudent(s.id, s.nome)} 
                                                    className="btn btn-danger-outline" 
                                                    style={{ 
                                                        padding: '0.4rem 0.8rem', 
                                                        fontSize: '0.7rem', 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '0.4rem',
                                                        cursor: 'pointer',
                                                        borderRadius: '8px',
                                                        userSelect: 'none',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                                >
                                                    <Trash2 size={14} /> EXCLUIR
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStudents.length === 0 && (
                                        <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>{selectedClass ? 'Nenhum aluno encontrado para esta turma.' : 'Selecione uma turma para ver os alunos.'}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'atividades' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', minWidth: 0 }}>
                        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Lançar Nova Missão</h3>
                            <form onSubmit={handleAddActivity} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Título</label>
                                    <input className="input-field" placeholder="Ex: Prova de Backend" value={newActivity.titulo} onChange={e => setNewActivity({ ...newActivity, titulo: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Nota Máxima</label>
                                    <input className="input-field" type="number" value={newActivity.nota_maxima} onChange={e => setNewActivity({ ...newActivity, nota_maxima: e.target.value })} />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={!selectedClass}>LANÇAR MISSÃO</button>
                            </form>
                            {!selectedClass && <p style={{ color: 'var(--danger)', fontSize: '0.7rem', marginTop: '0.5rem' }}>* Selecione uma turma primeiro para lançar atividades.</p>}
                        </div>

                        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', width: '100%', overflow: 'hidden' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Avaliar Aventureiros</h3>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingBottom: '1rem' }}>
                                {filteredActivities.map(a => (
                                    <button
                                        key={a.id}
                                        onClick={() => setSelectedActivity(a)}
                                        className={`btn btn-activity-select ${selectedActivity?.id === a.id ? 'active' : ''}`}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {a.titulo}
                                    </button>
                                ))}
                                {filteredActivities.length === 0 && <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>{selectedClass ? 'Nenhuma atividade lançada para esta turma.' : 'Selecione uma turma para ver as missões.'}</p>}
                            </div>

                            {selectedActivity && (
                                <div style={{ marginTop: '2rem', overflowX: 'auto', width: '100%' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                                <th style={{ padding: '1rem' }}>ALUNO</th>
                                                <th style={{ padding: '1rem' }}>NOTA ATUAL</th>
                                                <th style={{ padding: '1rem' }}>NOVA NOTA</th>
                                                <th style={{ padding: '1rem' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStudents.map(s => {
                                                const grade = selectedActivity.notas?.find(g => g.alunoId === s.id);
                                                const hasGrade = grade || editGrades[`${s.id}-${selectedActivity.id}`];
                                                
                                                return (
                                                    <tr key={s.id} style={{
                                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                        background: hasGrade
                                                            ? 'rgba(34, 197, 94, 0.12)'
                                                            : 'rgba(239, 68, 68, 0.03)',
                                                        borderLeft: hasGrade
                                                            ? '4px solid #22c55e'
                                                            : '4px solid #ef4444',
                                                        transition: 'all 0.3s ease'
                                                    }}>
                                                        <td style={{ padding: '1rem', fontWeight: hasGrade ? '600' : 'normal', color: hasGrade ? 'white' : 'var(--text-muted)' }}>{s.nome}</td>
                                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                                                            {grade ? (
                                                                <span style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', padding: '0.3rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.4)' }}>
                                                                    ✓ {grade.valor}
                                                                </span>
                                                            ) : (
                                                                <span style={{ background: 'rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.8)', padding: '0.3rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.75rem' }}>
                                                                    pendente
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <input
                                                                className="input-field"
                                                                type="number"
                                                                step="0.1"
                                                                placeholder="0.0"
                                                                style={{ 
                                                                    width: '80px', 
                                                                    padding: '0.4rem',
                                                                    background: hasGrade ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                                    border: hasGrade ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)',
                                                                    color: hasGrade ? '#4ade80' : 'white',
                                                                    fontWeight: 'bold',
                                                                    transition: 'all 0.3s ease'
                                                                }}
                                                                value={editGrades[`${s.id}-${selectedActivity.id}`] || (grade ? grade.valor : '')}
                                                                onChange={e => setEditGrades({ ...editGrades, [`${s.id}-${selectedActivity.id}`]: e.target.value })}
                                                                onBlur={() => handleSetGrade(s.id, selectedActivity.id)}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <button 
                                                                onClick={() => handleSetGrade(s.id, selectedActivity.id)} 
                                                                className="btn btn-secondary-outline" 
                                                                style={{ 
                                                                    padding: '0.4rem 1rem', 
                                                                    fontSize: '0.8rem',
                                                                    border: hasGrade ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.2)', 
                                                                    color: hasGrade ? '#4ade80' : 'white'
                                                                }}
                                                            >
                                                                SALVAR
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'mensagens' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
                        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Send size={20} /> Enviar Mensagem</h3>
                            <form onSubmit={handleSendMessage} style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', display: 'block' }}>Para quem?</label>
                                    <select className="input-field" value={msgTarget} onChange={e => setMsgTarget(e.target.value)} style={{ padding: '0.5rem' }}>
                                        <option value="turma">📣 Todos da Turma Selecionada</option>
                                        <optgroup label="Alunos Individuais">
                                            {filteredStudents.map(s => <option key={s.id} value={s.id}>👤 {s.nome}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                                <textarea className="input-field" placeholder="Escreva sua mensagem aqui..." value={msgContent} onChange={e => setMsgContent(e.target.value)} style={{ minHeight: '120px' }} />
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!selectedClass && msgTarget === 'turma'}>ENVIAR MENSAGEM</button>
                            </form>
                        </div>
                        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Histórico de Recados</h3>
                            <div style={{ maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {filteredMessages.map(m => (
                                    <div key={m.id} className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderLeft: m.turmaId ? '4px solid var(--primary)' : '4px solid var(--secondary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: m.turmaId ? 'var(--primary)' : 'var(--secondary)' }}>
                                                {m.turmaId ? '📣 PARA TURMA' : `👤 PARA: ${m.aluno?.nome}`}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{new Date(m.data_criacao).toLocaleString()}</span>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', margin: 0 }}>{m.conteudo}</p>
                                    </div>
                                ))}
                                {filteredMessages.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5 }}>{selectedClass ? 'Nenhuma mensagem enviada nesta turma.' : 'Selecione uma turma para ver o histórico.'}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'missoes' && (
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={20} /> Criar Nova Missão</h3>
                            <form onSubmit={handleAddMission} style={{ display: 'grid', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', display: 'block' }}>Título da Missão</label>
                                        <input className="input-field" placeholder="Ex: Completar Projeto Final" value={newMission.titulo} onChange={e => setNewMission({ ...newMission, titulo: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', display: 'block' }}>Recompensa (XP)</label>
                                        <input className="input-field" type="number" placeholder="0" value={newMission.recompensa} onChange={e => setNewMission({ ...newMission, recompensa: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', display: 'block' }}>Descrição</label>
                                    <textarea className="input-field" placeholder="Descreva os objetivos da missão..." value={newMission.descricao} onChange={e => setNewMission({ ...newMission, descricao: e.target.value })} style={{ minHeight: '80px' }} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.3rem', display: 'block' }}>Prazo (Opcional)</label>
                                    <input className="input-field" type="datetime-local" value={newMission.prazo} onChange={e => setNewMission({ ...newMission, prazo: e.target.value })} />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={!selectedClass}>CRIAR MISSÃO</button>
                                {!selectedClass && <p style={{ color: 'var(--danger)', fontSize: '0.7rem', marginTop: '-0.5rem' }}>* Selecione uma turma primeiro.</p>}
                            </form>
                        </div>

                        <div>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={20} /> Missões Ativas</h3>
                            {filteredMissions.length === 0 ? (
                                <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>{selectedClass ? 'Nenhuma missão criada para esta turma.' : 'Selecione uma turma para ver as missões.'}</p>
                            ) : (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {filteredMissions.map(m => (
                                        <div key={m.id} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderLeft: '4px solid var(--primary)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Target size={18} /> {m.titulo}
                                                    </h4>
                                                    <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>{m.descricao}</p>
                                                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', opacity: 0.6 }}>
                                                        <span>🎁 Recompensa: {m.recompensa} XP</span>
                                                        {m.prazo && <span>⏰ Prazo: {new Date(m.prazo).toLocaleString()}</span>}
                                                        <span>👤 Criado por: {m.professor?.nome}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => setSelectedMissionForGrading(m)}
                                                        className="btn btn-secondary-outline"
                                                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}
                                                    >
                                                        <Star size={14} /> AVALIAR
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMission(m.id, m.titulo)}
                                                        className="btn btn-danger-outline"
                                                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                    >
                                                        <Trash2 size={14} /> EXCLUIR
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {selectedMissionForGrading && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
                    <div className="glass-card" style={{ width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', background: '#1a1a1a', border: '1px solid var(--primary)' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <Star fill="gold" color="gold" /> Avaliar Missão: {selectedMissionForGrading.titulo}
                        </h3>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        <th style={{ textAlign: 'left', padding: '1rem' }}>ALUNO</th>
                                        <th style={{ textAlign: 'center', padding: '1rem' }}>NOTA (0-10)</th>
                                        <th style={{ textAlign: 'center', padding: '1rem' }}>XP GERADO (3x)</th>
                                        <th style={{ textAlign: 'right', padding: '1rem' }}>AÇÃO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => (
                                        <StudentGradeRow
                                            key={student.id}
                                            student={student}
                                            missionId={selectedMissionForGrading.id}
                                            onSave={handleSaveMissionGrade}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={() => setSelectedMissionForGrading(null)}
                            className="btn btn-secondary"
                            style={{ marginTop: '2rem', width: '100%' }}
                        >
                            FECHAR AVALIAÇÃO
                        </button>
                    </div>
                </div>
            )}

            <footer style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                <p>Gerenciador de Ranking - SENAI</p>
            </footer>

            {/* Modal de QR Code */}
            {showQRModal && selectedClass && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
                }} onClick={() => setShowQRModal(false)}>
                    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', width: '100%', background: 'var(--bg-dark)' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Escanear Código</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Aventureiros podem escanear este QR Code para entrar automaticamente na guilda.</p>
                        
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', display: 'inline-block', marginBottom: '2rem' }}>
                            <QRCodeSVG value={selectedClass.codigo} size={220} bgColor={"#ffffff"} fgColor={"#000000"} />
                        </div>
                        
                        <h1 style={{ letterSpacing: '4px', color: 'var(--warning)', fontSize: '2.5rem', marginBottom: '2rem' }}>
                            {selectedClass.codigo}
                        </h1>

                        <button onClick={() => setShowQRModal(false)} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                            FECHAR
                        </button>
                    </div>
                </div>
            )}

            {boletimAlunoId && (
                <BoletimAluno
                    alunoId={boletimAlunoId}
                    token={token}
                    onClose={() => setBoletimAlunoId(null)}
                />
            )}
        </div>
    );
};

const StudentGradeRow = ({ student, missionId, onSave }) => {
    // Encontrar nota existente para esta missão
    const existingGrade = student.notas_missoes?.find(n => n.missaoId === missionId);
    const [grade, setGrade] = useState(existingGrade?.valor || '');
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        if (grade === '' || isNaN(grade)) return;
        await onSave(student.id, grade);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
                    {student.foto_url ? <img src={student.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserCircle size={30} color="var(--text-muted)" />}
                </div>
                <span>{student.nome}</span>
            </td>
            <td style={{ padding: '1rem', textAlign: 'center' }}>
                <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    className="input-field"
                    style={{ width: '80px', textAlign: 'center', padding: '0.4rem' }}
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    onBlur={handleSave}
                    placeholder="-"
                />
            </td>
            <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--warning)' }}>
                {grade ? `+${(parseFloat(grade) * 3).toFixed(0)} XP` : '-'}
            </td>
            <td style={{ padding: '1rem', textAlign: 'right' }}>
                <button
                    onClick={handleSave}
                    className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', minWidth: '80px' }}
                >
                    {saved ? <CheckCircle size={14} /> : 'SALVAR'}
                </button>
            </td>
        </tr>
    );
};

export default DashboardAdmin;
