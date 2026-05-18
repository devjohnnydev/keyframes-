import React, { useState } from 'react';
import { useData } from './DataContext';
import { LogIn, UserPlus, Mail, Lock, User, Code, ArrowLeft, Shield, Camera } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

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
                    nome: formData.nome,
                    email: formData.email,
                    password: formData.password,
                    codigo: formData.codigo
                });
                alert('Cadastro realizado com sucesso!');
                return;
            }

            let credentials = { email: formData.email, password: formData.password };
            const user = await login(credentials);

            if (user && user.role === 'PROFESSOR' && user.primeiro_acesso) {
                setMustChange(true);
            }
        } catch (e) {
            alert(e.message || 'Erro ao realizar ação');
        }
    };

    return (
        <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem', background: 'var(--bg-dark)' }}>
            <div className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: '450px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--primary)', textShadow: '0 0 10px rgba(255, 232, 31, 0.3)', fontWeight: '900' }}>
                        RANKING SENAI
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {mustChange ? 'Alteração de Senha Obrigatória' :
                            mode === 'REGISTER' ? 'Crie sua ficha de Aventureiro' : 'Acesse sua conta para ver o Ranking'}
                    </p>
                </div>

                {!mustChange && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', padding: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        {['ALUNO', 'PROFESSOR', 'ADMIN'].map(r => (
                            <button
                                key={r}
                                onClick={() => { setRole(r); setMode('LOGIN'); }}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                    background: role === r ? 'var(--primary)' : 'transparent',
                                    color: role === r ? '#000' : 'var(--text-muted)',
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
                            <div style={{ textAlign: 'center', marginBottom: '1rem', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px' }}>
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
                                            onClick={() => setShowQRScanner(true)}
                                            className="btn" 
                                            style={{ background: 'rgba(255,255,255,0.1)', padding: '0 1rem' }}
                                        >
                                            <Camera size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '1rem', gap: '0.5rem' }}>
                                {mode === 'REGISTER' ? 'CRIAR CONTA' : 'DECOLAR'}
                                <LogIn size={18} />
                            </button>

                            {role === 'ALUNO' && (
                                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                    {mode === 'LOGIN' ? (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            Não tem conta? <span onClick={() => setMode('REGISTER')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>Cadastre-se aqui</span>
                                        </p>
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            Já tem conta? <span onClick={() => setMode('LOGIN')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>Faça login</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        Desenvolvido por <strong>Johnny Oliveira</strong>
                    </p>
                </div>
            </div>
        </div>

        {/* Modal do Scanner */}
        {showQRScanner && (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)',
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

                    <button type="button" onClick={() => setShowQRScanner(false)} className="btn" style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.1)' }}>
                        CANCELAR
                    </button>
                </div>
            </div>
        )}
        </>
    );
};

export default Login;
