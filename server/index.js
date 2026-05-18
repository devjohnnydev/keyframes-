import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'senai-secret-key-2024';

// Helper for unique class code
const generateUniqueCode = async () => {
    let code;
    let exists = true;
    while (exists) {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const check = await prisma.turma.findUnique({ where: { codigo: code } });
        if (!check) exists = false;
    }
    return code;
};

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Serve public directory statically
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '../dist')));

// --- MIDDLEWARES ---

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Token inválido ou expirado' });
    }
};

const authorize = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
    }
    next();
};

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --- INITIALIZATION ---

async function initAdmin() {
    const adminEmail = 'johnny.oliveira@sp.senai.br';
    const existing = await prisma.administrador.findUnique({ where: { email: adminEmail } });
    if (!existing) {
        const hashedPass = await bcrypt.hash('46431194', 10);
        await prisma.administrador.create({
            data: {
                nome: 'Johnny Oliveira',
                email: adminEmail,
                senha_hash: hashedPass
            }
        });
        console.log('Super Admin created!');
    }
}
initAdmin().catch(console.error);

app.post('/api/upload', authenticate, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    
    // Converte o arquivo para Base64 para persistência no banco de dados sem depender do file system local
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64String = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
    
    // Remove o arquivo local após a conversão
    fs.unlinkSync(req.file.path);

    res.json({ url: base64String });
});

// --- AUTH ROUTES ---

app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Admin Login
    const admin = await prisma.administrador.findUnique({ where: { email } });
    if (admin && await bcrypt.compare(password, admin.senha_hash)) {
        const token = jwt.sign({ id: admin.id, role: 'ADMIN', name: admin.nome }, JWT_SECRET);
        return res.json({ token, user: { ...admin, role: 'ADMIN' } });
    }

    // 2. Professor Login
    const professor = await prisma.professor.findUnique({ where: { email } });
    if (professor && await bcrypt.compare(password, professor.senha_hash)) {
        const token = jwt.sign({ id: professor.id, role: 'PROFESSOR', name: professor.nome }, JWT_SECRET);
        return res.json({ token, user: { ...professor, role: 'PROFESSOR' } });
    }

    // 3. Aluno Login
    const student = await prisma.aluno.findUnique({
        where: { email },
        include: { turma: true, professor: true }
    });
    if (student && student.senha_hash && await bcrypt.compare(password, student.senha_hash)) {
        const token = jwt.sign({ id: student.id, role: 'ALUNO', name: student.nome }, JWT_SECRET);
        return res.json({ token, user: { ...student, role: 'ALUNO' } });
    }

    res.status(401).json({ error: 'E-mail ou senha incorretos' });
}));

// --- ADMIN ROUTES ---

app.get('/api/admin/professores', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
    const professores = await prisma.professor.findMany();
    res.json(professores);
}));

app.post('/api/admin/professores', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
    const { nome, email, senha } = req.body;
    const defaultPassword = senha || 'senaisaopaulo';
    const hashedPass = await bcrypt.hash(defaultPassword, 10);
    const codigo = await generateUniqueCode();

    const professor = await prisma.professor.create({
        data: {
            nome,
            email,
            senha_hash: hashedPass,
            codigo_turma: codigo, // Mantido apenas para compatibilidade legada se necessário
            primeiro_acesso: true
        }
    });

    // Criar a turma inicial
    await prisma.turma.create({
        data: {
            nome: `Turma Inicial - ${nome}`,
            codigo: codigo,
            professorId: professor.id,
            materia: 'Boas-vindas'
        }
    });

    res.json(professor);
}));

app.post('/api/admin/professores/:id/reset-senha', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const hashedPass = await bcrypt.hash('senaisaopaulo', 10);
    await prisma.professor.update({
        where: { id: parseInt(id) },
        data: { senha_hash: hashedPass, primeiro_acesso: true }
    });
    res.json({ message: "Senha resetada para padrão (senaisaopaulo) com sucesso" });
}));

app.post('/api/admin/alunos/:id/reset-senha', authenticate, authorize(['ADMIN', 'PROFESSOR']), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const hashedPass = await bcrypt.hash('senai123', 10);
    await prisma.aluno.update({
        where: { id: parseInt(id) },
        data: { senha_hash: hashedPass }
    });
    res.json({ message: "Senha resetada para 'senai123'" });
}));

app.delete('/api/admin/professores/:id', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
    const { id } = req.params;
    // O Cascade Delete no Prisma cuidará das Turmas, Alunos, Atividades, etc.
    await prisma.professor.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Professor e todos os dados vinculados excluídos com sucesso" });
}));

// --- PROFESSOR ROUTES ---

app.patch('/api/professor/change-password', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { password } = req.body;
    const hashedPass = await bcrypt.hash(password, 10);
    await prisma.professor.update({
        where: { id: req.user.id },
        data: { senha_hash: hashedPass, primeiro_acesso: false }
    });
    res.json({ message: "Senha alterada com sucesso" });
}));

app.patch('/api/professor/perfil', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { foto_url, bio, mensagem_incentivo } = req.body;
    const updated = await prisma.professor.update({
        where: { id: req.user.id },
        data: { foto_url, bio, mensagem_incentivo }
    });
    res.json(updated);
}));

app.post('/api/turmas', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { nome, materia, observacao } = req.body;
    const codigo = await generateUniqueCode();

    const turma = await prisma.turma.create({
        data: {
            nome,
            materia,
            observacao,
            codigo,
            professorId: req.user.id
        }
    });
    res.json(turma);
}));

app.get('/api/turmas', authenticate, authorize(['ADMIN', 'PROFESSOR']), asyncHandler(async (req, res) => {
    if (req.user.role === 'ADMIN') {
        return res.json(await prisma.turma.findMany({ include: { professor: true } }));
    }
    const turmas = await prisma.turma.findMany({
        where: { professorId: req.user.id }
    });
    res.json(turmas);
}));

app.delete('/api/turmas/:id', authenticate, authorize(['ADMIN', 'PROFESSOR']), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const turmaId = parseInt(id);

    const turma = await prisma.turma.findUnique({ where: { id: turmaId } });
    if (!turma) return res.status(404).json({ error: "Turma não encontrada" });

    if (req.user.role === 'PROFESSOR' && turma.professorId !== req.user.id) {
        return res.status(403).json({ error: "Você não tem permissão para excluir esta turma" });
    }

    await prisma.turma.delete({ where: { id: turmaId } });
    res.json({ message: "Turma e todos os alunos vinculados excluídos com sucesso" });
}));

app.get('/api/alunos', authenticate, authorize(['ADMIN', 'PROFESSOR']), asyncHandler(async (req, res) => {
    const { turmaId } = req.query;
    const where = {};
    if (req.user.role === 'PROFESSOR') {
        where.professorId = req.user.id;
    }
    if (turmaId) {
        where.turmaId = parseInt(turmaId);
    }

    const alunos = await prisma.aluno.findMany({
        where,
        include: {
            turma: true,
            notas_missoes: true
        }
    });
    res.json(alunos);
}));

app.delete('/api/alunos/:id', authenticate, authorize(['ADMIN', 'PROFESSOR']), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const alunoId = parseInt(id);

    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });
    if (!aluno) return res.status(404).json({ error: "Aluno não encontrado" });

    if (req.user.role === 'PROFESSOR' && aluno.professorId !== req.user.id) {
        return res.status(403).json({ error: "Você não tem permissão para excluir este aluno" });
    }

    await prisma.aluno.delete({ where: { id: alunoId } });
    res.json({ message: "Aluno removido com sucesso" });
}));

// Aluno registration
app.post('/api/auth/register-aluno', asyncHandler(async (req, res) => {
    const { nome, email, password, codigo } = req.body;
    const normalizedCode = codigo?.trim().toUpperCase();

    const existing = await prisma.aluno.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "E-mail já cadastrado" });

    const turma = await prisma.turma.findUnique({ where: { codigo: normalizedCode } });
    if (!turma) return res.status(404).json({ error: "Código de turma inválido" });

    const hashedPass = await bcrypt.hash(password, 10);

    const aluno = await prisma.aluno.create({
        data: {
            nome,
            email,
            senha_hash: hashedPass,
            professorId: turma.professorId,
            turmaId: turma.id
        },
        include: {
            turma: true,
            professor: true
        }
    });

    const token = jwt.sign({ id: aluno.id, role: 'ALUNO', name: aluno.nome }, JWT_SECRET);
    res.json({ token, user: { ...aluno, role: 'ALUNO' } });
}));

app.post('/api/alunos/entrar-turma', authenticate, authorize(['ALUNO']), asyncHandler(async (req, res) => {
    const { codigo } = req.body;
    const normalizedCode = codigo?.trim().toUpperCase();

    const turma = await prisma.turma.findUnique({
        where: { codigo: normalizedCode },
        include: { professor: true }
    });

    if (!turma) return res.status(404).json({ error: "Código de turma inválido" });

    const updatedAluno = await prisma.aluno.update({
        where: { id: req.user.id },
        data: {
            turmaId: turma.id,
            professorId: turma.professorId
        },
        include: {
            turma: true,
            professor: true
        }
    });

    res.json(updatedAluno);
}));

app.patch('/api/aluno/change-password', authenticate, authorize(['ALUNO']), asyncHandler(async (req, res) => {
    const { password } = req.body;
    const hashedPass = await bcrypt.hash(password, 10);
    await prisma.aluno.update({
        where: { id: req.user.id },
        data: { senha_hash: hashedPass }
    });
    res.json({ message: "Senha atualizada" });
}));

// --- GAME LOGIC (Missions, Activities, Grades) ---

app.post('/api/atividades', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { titulo, descricao, nota_maxima, turmaId } = req.body;

    // Verify ownership
    const turma = await prisma.turma.findFirst({ where: { id: parseInt(turmaId), professorId: req.user.id } });
    if (!turma) return res.status(403).json({ error: "Você não tem permissão para esta turma" });

    const atividade = await prisma.atividade.create({
        data: {
            titulo,
            descricao,
            nota_maxima: parseFloat(nota_maxima) || 10,
            turmaId: parseInt(turmaId)
        }
    });
    res.json(atividade);
}));

app.get('/api/atividades', authenticate, asyncHandler(async (req, res) => {
    const { turmaId } = req.query;
    const where = {};

    if (req.user.role === 'PROFESSOR') {
        where.turma = { professorId: req.user.id };
    } else if (req.user.role === 'ALUNO') {
        const student = await prisma.aluno.findUnique({ where: { id: req.user.id } });
        where.turmaId = student.turmaId;
    }

    if (turmaId) where.turmaId = parseInt(turmaId);

    const atividades = await prisma.atividade.findMany({
        where,
        include: { notas: true }
    });
    res.json(atividades);
}));

app.get('/api/minhas-notas', authenticate, authorize(['ALUNO']), asyncHandler(async (req, res) => {
    const notas = await prisma.nota.findMany({
        where: { alunoId: req.user.id },
        include: { atividade: true }
    });
    res.json(notas);
}));

app.get('/api/mensagens', authenticate, asyncHandler(async (req, res) => {
    const where = {};
    if (req.user.role === 'ALUNO') {
        const student = await prisma.aluno.findUnique({ where: { id: req.user.id } });

        // CORREÇÃO: Aluno só vê mensagens direcionadas especificamente para ele,
        // mensagens para SUA turma, ou decretos supremos globais
        where.OR = [
            // 1. Mensagens individuais para este aluno
            { alunoId: req.user.id },
            // 2. Mensagens para a turma deste aluno (SEM alunoId específico)
            { turmaId: student.turmaId, alunoId: null },
            // 3. Decretos supremos globais (sem aluno nem turma específicos)
            { tipo: 'decreto_supremo', alunoId: null, turmaId: null }
        ];
    } else if (req.user.role === 'PROFESSOR') {
        where.professorId = req.user.id;
    } else if (req.user.role === 'ADMIN') {
        where.adminId = req.user.id;
    }

    const mensagens = await prisma.mensagem.findMany({
        where,
        orderBy: { data_criacao: 'desc' },
        include: {
            professor: { select: { nome: true } },
            administrador: { select: { nome: true } },
            aluno: { select: { nome: true } },
            turma: { select: { nome: true } }
        }
    });
    res.json(mensagens);
}));

app.post('/api/mensagens', authenticate, authorize(['PROFESSOR', 'ADMIN']), asyncHandler(async (req, res) => {
    const { conteudo, alunoId, turmaId, tipo } = req.body;

    // DECRETO SUPREMO - Apenas ADMIN
    if (tipo === 'decreto_supremo') {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: "Apenas administradores podem enviar decretos supremos" });
        }

        const mensagem = await prisma.mensagem.create({
            data: {
                conteudo,
                tipo: 'decreto_supremo',
                adminId: req.user.id,
                // Sem alunoId/turmaId = mensagem global
                alunoId: alunoId ? parseInt(alunoId) : null,
                turmaId: turmaId ? parseInt(turmaId) : null
            }
        });
        return res.json(mensagem);
    }

    // MENSAGEM NORMAL - PROFESSOR
    if (req.user.role === 'PROFESSOR') {
        // Validar alunoId - só pode enviar para alunos de suas turmas
        if (alunoId) {
            const aluno = await prisma.aluno.findUnique({
                where: { id: parseInt(alunoId) }
            });
            if (!aluno || aluno.professorId !== req.user.id) {
                return res.status(403).json({
                    error: "Você só pode enviar mensagens para alunos de suas turmas"
                });
            }
        }

        // Validar turmaId - só pode enviar para suas turmas
        if (turmaId) {
            const turma = await prisma.turma.findUnique({
                where: { id: parseInt(turmaId) }
            });
            if (!turma || turma.professorId !== req.user.id) {
                return res.status(403).json({
                    error: "Você só pode enviar mensagens para suas turmas"
                });
            }
        }
    }

    // ADMIN pode enviar para qualquer aluno/turma (sem validação)

    const mensagem = await prisma.mensagem.create({
        data: {
            conteudo,
            tipo: tipo || 'normal',
            professorId: req.user.role === 'PROFESSOR' ? req.user.id : null,
            adminId: req.user.role === 'ADMIN' ? req.user.id : null,
            alunoId: alunoId ? parseInt(alunoId) : null,
            turmaId: turmaId ? parseInt(turmaId) : null
        }
    });
    res.json(mensagem);
}));

// Marcar mensagem como lida
app.patch('/api/mensagens/:id/lida', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar se a mensagem existe e pertence ao aluno
    const mensagem = await prisma.mensagem.findUnique({ where: { id: parseInt(id) } });
    if (!mensagem) {
        return res.status(404).json({ error: "Mensagem não encontrada" });
    }

    // Marcar como lida
    const mensagemAtualizada = await prisma.mensagem.update({
        where: { id: parseInt(id) },
        data: { lida: true }
    });

    res.json(mensagemAtualizada);
}));


app.post('/api/notas', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { alunoId, atividadeId, valor } = req.body;

    // Get info about the student and class to update ranks
    const studentInfo = await prisma.aluno.findUnique({ where: { id: parseInt(alunoId) } });
    if (!studentInfo) return res.status(404).json({ error: "Aluno não encontrado" });

    // 1. Snapshot current ranking for the whole class before the change
    const classAlunos = await prisma.aluno.findMany({
        where: { turmaId: studentInfo.turmaId },
        include: {
            notas: true,
            notas_missoes: true // Incluir notas de missões
        }
    });

    const currentRanking = classAlunos.map(a => {
        const xpAtividades = a.notas.reduce((acc, n) => acc + (n.valor * 10), 0);
        const xpMissoes = a.notas_missoes.reduce((acc, n) => acc + (n.valor * 3), 0);
        const totalXP = xpAtividades + xpMissoes;
        return { id: a.id, xp: totalXP };
    }).sort((a, b) => b.xp - a.xp);

    // Save current positions as posicao_anterior
    for (let i = 0; i < currentRanking.length; i++) {
        await prisma.aluno.update({
            where: { id: currentRanking[i].id },
            data: { posicao_anterior: i + 1 }
        });
    }

    // 2. Now update/create the grade
    const atividade = await prisma.atividade.findUnique({ where: { id: parseInt(atividadeId) } });

    const grade = await prisma.nota.upsert({
        where: { alunoId_atividadeId: { alunoId: parseInt(alunoId), atividadeId: parseInt(atividadeId) } },
        update: { valor: parseFloat(valor) },
        create: {
            alunoId: parseInt(alunoId),
            atividadeId: parseInt(atividadeId),
            valor: parseFloat(valor)
        }
    });

    // Create automatic notification (Mensagem)
    await prisma.mensagem.create({
        data: {
            conteudo: `Sua atividade "${atividade.titulo}" foi avaliada! Nota: ${valor}/${atividade.nota_maxima}. (+${parseFloat(valor) * 10} XP)`,
            professorId: req.user.id,
            alunoId: parseInt(alunoId)
        }
    });

    res.json(grade);
}));

// Aluno envia reação emoji para uma atividade
app.patch('/api/notas/reacao', authenticate, authorize(['ALUNO']), asyncHandler(async (req, res) => {
    const { atividadeId, reacao_emoji } = req.body;

    const nota = await prisma.nota.findUnique({
        where: { alunoId_atividadeId: { alunoId: req.user.id, atividadeId: parseInt(atividadeId) } }
    });

    if (!nota) return res.status(404).json({ error: 'Você ainda não tem nota nesta atividade' });

    const updated = await prisma.nota.update({
        where: { id: nota.id },
        data: { reacao_emoji }
    });

    res.json(updated);
}));

// --- MISSIONS ROUTES ---

app.post('/api/missoes', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { titulo, descricao, recompensa, prazo, turmaId } = req.body;

    // Verify ownership of the class
    const turma = await prisma.turma.findFirst({
        where: { id: parseInt(turmaId), professorId: req.user.id }
    });
    if (!turma) return res.status(403).json({ error: "Você não tem permissão para esta turma" });

    const missao = await prisma.missao.create({
        data: {
            titulo,
            descricao,
            recompensa: parseInt(recompensa) || 0,
            prazo: prazo ? new Date(prazo) : null,
            turmaId: parseInt(turmaId),
            professorId: req.user.id
        }
    });
    res.json(missao);
}));

app.post('/api/missoes/:id/avaliar', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { alunoId, valor } = req.body;
    const missaoId = parseInt(id);

    // Verify ownership
    const missao = await prisma.missao.findUnique({
        where: { id: missaoId },
        include: { turma: true }
    });

    if (!missao) return res.status(404).json({ error: "Missão não encontrada" });
    if (missao.professorId !== req.user.id && missao.turma.professorId !== req.user.id) {
        return res.status(403).json({ error: "Você não tem permissão para avaliar esta missão" });
    }

    // 1. Snapshot current ranking
    const classAlunos = await prisma.aluno.findMany({
        where: { turmaId: missao.turmaId },
        include: {
            notas: true,
            notas_missoes: true
        }
    });

    const currentRanking = classAlunos.map(a => {
        const xpAtividades = a.notas.reduce((acc, n) => acc + (n.valor * 10), 0);
        const xpMissoes = a.notas_missoes.reduce((acc, n) => acc + (n.valor * 3), 0);
        const totalXP = xpAtividades + xpMissoes;
        return { id: a.id, xp: totalXP };
    }).sort((a, b) => b.xp - a.xp);

    // Save current positions
    for (let i = 0; i < currentRanking.length; i++) {
        await prisma.aluno.update({
            where: { id: currentRanking[i].id },
            data: { posicao_anterior: i + 1 }
        });
    }

    // 2. Create/Update NotaMissao
    const notaMissao = await prisma.notaMissao.upsert({
        where: {
            alunoId_missaoId: {
                alunoId: parseInt(alunoId),
                missaoId: missaoId
            }
        },
        update: { valor: parseFloat(valor) },
        create: {
            alunoId: parseInt(alunoId),
            missaoId: missaoId,
            valor: parseFloat(valor)
        }
    });

    // 3. Create Notification
    const xpGanho = parseFloat(valor) * 3;
    await prisma.mensagem.create({
        data: {
            conteudo: `Sua missão "${missao.titulo}" foi avaliada! Nota: ${valor}. (+${xpGanho} XP)`,
            professorId: req.user.id,
            alunoId: parseInt(alunoId),
            turmaId: missao.turmaId // Opcional, mas ajuda no contexto
        }
    });

    res.json(notaMissao);
}));

app.get('/api/missoes', authenticate, asyncHandler(async (req, res) => {
    const { turmaId } = req.query;
    const where = {};

    if (req.user.role === 'PROFESSOR') {
        where.turma = { professorId: req.user.id };
    } else if (req.user.role === 'ALUNO') {
        const student = await prisma.aluno.findUnique({ where: { id: req.user.id } });
        if (student?.turmaId) where.turmaId = student.turmaId;
    }

    if (turmaId) where.turmaId = parseInt(turmaId);

    const include = {
        professor: { select: { nome: true } },
        turma: { select: { nome: true } }
    };

    if (req.user.role === 'ALUNO') {
        include.notas = {
            where: { alunoId: req.user.id }
        };
    }

    const missoes = await prisma.missao.findMany({
        where,
        include,
        orderBy: { data_criacao: 'desc' }
    });
    res.json(missoes);
}));

app.delete('/api/missoes/:id', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const missaoId = parseInt(id);

    const missao = await prisma.missao.findUnique({
        where: { id: missaoId },
        include: { turma: true }
    });

    if (!missao) return res.status(404).json({ error: "Missão não encontrada" });

    // Check if user is the creator OR the owner of the class
    const canDelete = missao.professorId === req.user.id ||
        missao.turma.professorId === req.user.id;

    if (!canDelete) {
        return res.status(403).json({ error: "Você não tem permissão para excluir esta missão" });
    }

    await prisma.missao.delete({ where: { id: missaoId } });
    res.json({ message: "Missão excluída com sucesso" });
}));


app.get('/api/ranking', asyncHandler(async (req, res) => {
    const { turmaId } = req.query;

    const where = {};
    if (turmaId) where.turmaId = parseInt(turmaId);

    const alunos = await prisma.aluno.findMany({
        where,
        include: {
            notas: true,
            notas_missoes: true, // Incluir notas de missões
            professor: { select: { nome: true } },
            turma: { select: { nome: true } }
        }
    });

    const ranking = alunos.map(a => {
        const xpAtividades = a.notas.reduce((acc, n) => acc + (n.valor * 10), 0);
        // XP Missões = Nota * 3 (Peso 3x)
        const xpMissoes = a.notas_missoes.reduce((acc, n) => acc + (n.valor * 3), 0);
        const totalXP = xpAtividades + xpMissoes;

        return {
            id: a.id,
            nome: a.nome,
            foto_url: a.foto_url,
            info: a.info,
            xp: totalXP,
            level: Math.floor(Math.sqrt(totalXP / 100)) + 1,
            professorNome: a.professor?.nome || 'Nenhum',
            turmaNome: a.turma?.nome || 'Nenhuma',
            professorId: a.professorId,
            turmaId: a.turmaId,
            posicao_anterior: a.posicao_anterior,
            estado_humor: a.estado_humor
        };
    }).sort((a, b) => b.xp - a.xp);

    res.json(ranking);
}));

app.patch('/api/aluno/perfil', authenticate, authorize(['ALUNO']), asyncHandler(async (req, res) => {
    const { foto_url, info, nome, estado_humor } = req.body;
    const updated = await prisma.aluno.update({
        where: { id: req.user.id },
        data: { foto_url, info, nome, estado_humor }
    });
    res.json(updated);
}));

// --- APP SETUP ---

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Erro interno do servidor" });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
