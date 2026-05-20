import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const DataContextInternal = createContext(null);

export const useData = () => {
  const context = useContext(DataContextInternal);
  if (!context) {
    return {
      user: null, loading: false, classes: [], students: [], activities: [], missions: [],
      messages: [], ranking: [], login: async () => false, logout: () => { },
      registerStudent: async () => { }, createClass: async () => { },
      joinClass: async () => { }, addActivity: async () => { }, addMission: async () => { },
      setStudentGrade: async () => { }, gradeMission: async () => { }, sendMessage: async () => { },
      updateProfile: async () => { }, approveEnrollment: async () => { }, refreshAll: () => { }
    };
  }
  return context;
};

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const DataProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('eduGameToken'));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('eduGameUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [activities, setActivities] = useState([]);
  const [missions, setMissions] = useState([]);
  const [grades, setGrades] = useState({});
  const [ranking, setRanking] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      logout();
    }
    return res;
  }, [token, logout]);

  const refreshAll = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      const promises = [
        user.role === 'ALUNO'
          ? Promise.resolve([])
          : authFetch(`${API_URL}/turmas`).then(r => r.json()),
        authFetch(`${API_URL}/ranking`).then(r => r.json()),
        authFetch(`${API_URL}/atividades`).then(r => r.json()),
        authFetch(`${API_URL}/mensagens`).then(r => r.json()),
        authFetch(`${API_URL}/missoes`).then(r => r.json())
      ];

      if (user.role === 'ALUNO') {
        promises.push(authFetch(`${API_URL}/minhas-notas`).then(r => r.json()));
      } else if (user.role === 'PROFESSOR' || user.role === 'ADMIN') {
        promises.push(authFetch(`${API_URL}/alunos`).then(r => r.json()));
      }

      const [resClasses, resRank, resActivities, resMessages, resMissions, resExtra] = await Promise.all(promises);

      setClasses(Array.isArray(resClasses) ? resClasses : []);
      setRanking(Array.isArray(resRank) ? resRank : []);
      setActivities(Array.isArray(resActivities) ? resActivities : []);
      setMessages(Array.isArray(resMessages) ? resMessages : []);
      setMissions(Array.isArray(resMissions) ? resMissions : []);

      if (user.role === 'ALUNO') {
        setGrades(resExtra || []);
        
        // Downward sync: Check if portal challenge is already completed on the server
        try {
          const statusRes = await authFetch(`${API_URL}/aluno/status-desafio`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.completado) {
              const todayStr = new Date().toDateString();
              localStorage.setItem('portalLastAttemptDate', todayStr);
              localStorage.setItem('portalAttemptResult', 'SUCCESS');
              // Ensure we have some display data so the card doesn't break
              if (!localStorage.getItem('portalAttemptScore')) {
                localStorage.setItem('portalAttemptScore', '5');
                localStorage.setItem('portalAttemptPuzzles', '5');
                localStorage.setItem('portalAttemptTimeSpent', '180');
              }
            }
          }
        } catch (e) {
          console.error("Failed to sync portal status down:", e);
        }
      } else {
        setStudents(Array.isArray(resExtra) ? resExtra : []);
      }

      if (Array.isArray(resClasses) && resClasses.length > 0 && !selectedClass) {
        setSelectedClass(resClasses[0]);
      }
    } catch (e) {
      console.error("refreshAll fail", e);
    } finally {
      setLoading(false);
      setNeedsRefresh(false);
    }
  }, [user, authFetch, selectedClass]);

  useEffect(() => {
    if (token) localStorage.setItem('eduGameToken', token);
    else localStorage.removeItem('eduGameToken');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('eduGameUser', JSON.stringify(user));
    else localStorage.removeItem('eduGameUser');
  }, [user]);

  useEffect(() => {
    if (user && needsRefresh) refreshAll();
  }, [user, needsRefresh, refreshAll]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha no login');

      setToken(data.token);
      setUser(data.user);

      // Automagically sync today's portal challenge score
      if (data.user.role === 'ALUNO') {
        const todayStr = new Date().toDateString();
        const lastAttemptDate = localStorage.getItem('portalLastAttemptDate');
        const attemptResult = localStorage.getItem('portalAttemptResult');
        const attemptScore = localStorage.getItem('portalAttemptScore');
        
        if (lastAttemptDate === todayStr && attemptResult === 'SUCCESS' && attemptScore) {
          try {
            await fetch(`${API_URL}/aluno/completar-desafio`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.token}`
              },
              body: JSON.stringify({ score: parseInt(attemptScore) || 0 })
            });
            console.log("Desafio diário sincronizado com o servidor!");
          } catch (err) {
            console.error("Falha ao sincronizar desafio diário:", err);
          }
        }
      }

      setNeedsRefresh(true);
      return data.user;
    } catch (e) {
      console.error("Login Error:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    user, token, login, logout, loading,
    classes, selectedClass, setSelectedClass, missions, students, activities, grades, ranking, messages,
    registerStudent: async (data) => {
      const res = await fetch(`${API_URL}/auth/register-aluno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setToken(result.token);
      setUser(result.user);

      // Automagically sync today's portal challenge score for newly registered users
      if (result.user.role === 'ALUNO') {
        const todayStr = new Date().toDateString();
        const lastAttemptDate = localStorage.getItem('portalLastAttemptDate');
        const attemptResult = localStorage.getItem('portalAttemptResult');
        const attemptScore = localStorage.getItem('portalAttemptScore');
        
        if (lastAttemptDate === todayStr && attemptResult === 'SUCCESS' && attemptScore) {
          try {
            await fetch(`${API_URL}/aluno/completar-desafio`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${result.token}`
              },
              body: JSON.stringify({ score: parseInt(attemptScore) || 0 })
            });
            console.log("Desafio diário sincronizado com o servidor!");
          } catch (err) {
            console.error("Falha ao sincronizar desafio diário:", err);
          }
        }
      }

      setNeedsRefresh(true);
    },
    createClass: async (name, materia, observacao) => {
      const res = await authFetch(`${API_URL}/turmas`, {
        method: 'POST', body: JSON.stringify({ nome: name, materia, observacao })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setNeedsRefresh(true);
      return result;
    },
    deleteClass: async (id) => {
      const res = await authFetch(`${API_URL}/turmas/${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setNeedsRefresh(true);
      setSelectedClass(null);
      return result;
    },
    joinClass: async (codigo) => {
      const res = await authFetch(`${API_URL}/alunos/entrar-turma`, {
        method: 'POST',
        body: JSON.stringify({ codigo })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro ao entrar na turma");
      setUser(prev => ({ ...prev, ...result }));
      setNeedsRefresh(true);
      return result;
    },
    updateProfile: async (data) => {
      const res = await authFetch(`${API_URL}/professor/perfil`, {
        method: 'PATCH', body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setUser(prev => ({ ...prev, ...result }));
      return result;
    },
    updateStudentProfile: async (data) => {
      const res = await authFetch(`${API_URL}/aluno/perfil`, {
        method: 'PATCH', body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setUser(prev => ({ ...prev, ...result }));
      return result;
    },
    addActivity: async (a) => {
      if (!selectedClass) throw new Error("Selecione uma turma");
      const res = await authFetch(`${API_URL}/atividades`, {
        method: 'POST',
        body: JSON.stringify({ ...a, turmaId: selectedClass.id })
      });
      const result = await res.json();
      if (res.ok) setNeedsRefresh(true);
      else throw new Error(result.error);
    },
    addMission: async (m) => {
      if (!selectedClass) throw new Error("Selecione uma turma");
      const res = await authFetch(`${API_URL}/missoes`, {
        method: 'POST',
        body: JSON.stringify({ ...m, turmaId: selectedClass.id })
      });
      const result = await res.json();
      if (res.ok) setNeedsRefresh(true);
      else throw new Error(result.error);
    },
    deleteMission: async (id) => {
      const res = await authFetch(`${API_URL}/missoes/${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setNeedsRefresh(true);
      return result;
    },
    setStudentGrade: async (alunoId, atividadeId, valor) => {
      const res = await authFetch(`${API_URL}/notas`, {
        method: 'POST',
        body: JSON.stringify({ alunoId, atividadeId, valor })
      });
      if (res.ok) setNeedsRefresh(true);
    },
    updateProfessorPassword: async (password) => {
      const res = await authFetch(`${API_URL}/professor/change-password`, {
        method: 'PATCH',
        body: JSON.stringify({ password })
      });
      if (!res.ok) throw new Error("Falha ao alterar senha");
      setUser(prev => ({ ...prev, primeiro_acesso: false }));
    },
    updateStudentPassword: async (password) => {
      const res = await authFetch(`${API_URL}/aluno/change-password`, {
        method: 'PATCH',
        body: JSON.stringify({ password })
      });
      if (!res.ok) throw new Error("Falha ao alterar senha");
    },
    resetStudentPassword: async (id) => {
      const res = await authFetch(`${API_URL}/admin/alunos/${id}/reset-senha`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error("Falha ao resetar senha");
      setNeedsRefresh(true);
      return await res.json();
    },
    deleteStudent: async (id) => {
      const res = await authFetch(`${API_URL}/alunos/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Falha ao excluir aluno");
      setNeedsRefresh(true);
      return await res.json();
    },
    uploadFile: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Falha no upload");
      return result.url;
    },
    sendMessage: async (data) => {
      const res = await authFetch(`${API_URL}/mensagens`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Falha ao enviar mensagem");
      setNeedsRefresh(true);
      return await res.json();
    },
    markMessageAsRead: async (id) => {
      const res = await authFetch(`${API_URL}/mensagens/${id}/lida`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error("Falha ao marcar mensagem como lida");
      setNeedsRefresh(true);
      return await res.json();
    },
    gradeMission: async (missionId, alunoId, valor) => {
      const res = await authFetch(`${API_URL}/missoes/${missionId}/avaliar`, {
        method: 'POST',
        body: JSON.stringify({ alunoId, valor })
      });
      if (!res.ok) throw new Error("Falha ao avaliar missão");
      setNeedsRefresh(true);
      return await res.json();
    },
    sendEmojiReaction: async (atividadeId, reacao_emoji) => {
      const res = await authFetch(`${API_URL}/notas/reacao`, {
        method: 'PATCH',
        body: JSON.stringify({ atividadeId, reacao_emoji })
      });
      if (!res.ok) throw new Error("Falha ao enviar reação");
      setNeedsRefresh(true);
      return await res.json();
    },
    refreshAll: () => setNeedsRefresh(true)
  }), [user, token, loading, classes, selectedClass, students, activities, missions, grades, ranking, messages, authFetch]);

  return (
    <DataContextInternal.Provider value={value}>
      {children}
    </DataContextInternal.Provider>
  );
};
