# 🏆 SENAI · Sistema de Ranking de Guildas & Gamificação

O **Sistema de Ranking de Guildas** é uma plataforma educacional gamificada de alto impacto, concebida sob medida para o ecossistema de TI do **SENAI**. Ela transforma a rotina de estudos em um ambiente dinâmico e imersivo, assemelhando-se a uma **Bolsa de Valores de Aprendizado (Guild XP Stock Exchange)**. Alunos ganham experiência (XP) e sobem de nível com base em suas notas em tarefas, missões cooperativas e resoluções diárias de desafios de código rápidos.

---

## 🚀 Novas Funcionalidades Premium Integradas

### 1. 🌌 Sistema de Partículas Tecnológicas Interativas (`TechParticles`)
* **Visual Imersivo**: Fluxo constante de partículas de código binário (`0`, `1`, `</>`, `code`, `const`, `let`, `JSON`, `git`, `fn()`, `class`, `SENAI`, `TI`) que flutuam dinamicamente pelo painel.
* **Projeção em Sala**: Perfeitamente otimizado para projeção contínua em projetores e Smart TVs de sala de aula.
* **Integração no Ranking**: As partículas rodam tanto no painel projetado do Professor quanto no **Hall da Fama (Membros da Guilda)** na visão individual do aluno, sem interferir na usabilidade graças ao controle estrito de camadas (`z-index`).

### 2. 📈 Bolsa de Valores das Guildas
* **Cotações de XP ao Vivo**: Exibe o desempenho dos estudantes como se fossem ativos em uma bolsa financeira.
* **Mini-gráficos de Tendência (Sparklines)**: Gráficos vetoriais SVG desenhados em tempo real que mostram a volatilidade de XP de cada aluno de acordo com o progresso recente.
* **Indicadores de Variação (24h)**: Mostra variações percentuais dinâmicas baseadas na movimentação recente de posições no ranking.
* **Ticker Tape Rolante**: Barra horizontal de cotação contínua (estilo Wall Street) com o XP atual de todos os aventureiros da sala.

### 3. 🛡️ Proteção de Vulnerabilidade Escolar (Anonimato de Posições)
* **Gamificação Saudável**: Para incentivar a competição sadia sem expor alunos abaixo do topo, o ranking **revela a posição exata apenas para os 5 primeiros aventureiros**.
* **Proteção Individual**: Alunos classificados a partir do 6º lugar são exibidos de forma anônima com um traço elegante (`—`) nas listagens públicas gerais, preservando sua privacidade e integridade pedagógica.

### 4. 🖨️ Boletim Escolar Oficial (Otimizado para Sulfite A4)
* **Impressão Ecológica**: Tema de impressão com alto contraste (preto sobre branco puro) projetado para **economizar 100% de cartuchos de tinta preta e toners**, eliminando fundos escuros do layout da tela.
* **Impressão Multipágina Inteligente**: Graças ao fluxo estático do layout de impressão (`position: static !important`), tabelas longas e descrições detalhadas de missões quebram naturalmente por múltiplas folhas A4 sulfite sem cortes verticais orizontais na folha 1.
* **Layout Limpo de Identificação**: O nome do aluno e as informações de cabeçalho são desenhados **uma única vez** no topo do documento, eliminando repetições e cabeçalhos redundantes no papel impresso.
* **Média Geral Ponderada**: Exibe uma seção destacada no boletim com a **Média Geral de Rendimento (Notas de Atividades + Notas de Missões)** calculada em tempo real com indicador de status colorido (Ótimo, Bom, Recuperar).
* **Botões de Ação Dinâmicos**: Botão de fechar do modal em vermelho de alta visibilidade (`#ef4444`) e botões de impressão em verde esmeralda com micro-animações de hover para máxima usabilidade.

### 5. 🖼️ Motor de Upload de Fotos Permanente (Base64)
* **Persistência Infinita**: Fotos enviadas por alunos ou mestres são automaticamente convertidas para Base64 (`data:image/...`) no lado do cliente e armazenadas no PostgreSQL no formato `TEXT`.
* **Zero Expirabilidade**: As fotos **nunca expiram nem desaparecem**, mesmo após reinicializações do servidor ou atualizações de containers na nuvem, garantindo a consistência visual perpétua da guilda.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
* **React 19 & Vite**: Arquitetura rápida baseada em estados declarativos modernos.
* **Lucide React & QRCode.react**: Ícones elegantes e gerador dinâmico de QR Code para login rápido.
* **Vanilla CSS3 (Glassmorphic Theme)**: Tema futurista inspirado em ficção científica cibernética com transparências e desfoques de fundo (`backdrop-filter`).

### Backend
* **Node.js & Express.js**: API REST robusta para gerenciar sessões, notas, turmas e logs.
* **Prisma ORM**: Comunicação estruturada, tipada e migrações ágeis.
* **PostgreSQL**: Banco de dados relacional oficial.

---

## 🏁 Como Rodar a Plataforma

1. **Instalação das Dependências**:
   ```bash
   # Na pasta raiz (Frontend)
   npm install
   
   # Na pasta do servidor (Backend)
   cd server
   npm install
   ```

2. **Configuração das Variáveis de Ambiente**:
   Crie um arquivo `.env` dentro da pasta `server/` com a URL do seu PostgreSQL:
   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/ranking_db?schema=public"
   JWT_SECRET="sua_chave_secreta_aqui"
   PORT=3001
   ```

3. **Migração do Banco de Dados**:
   ```bash
   npx prisma db push
   ```

4. **Execução em Desenvolvimento**:
   ```bash
   # Na pasta raiz (inicia simultaneamente o client Vite e o server Express)
   npm run dev
   ```

---

*Desenvolvido com carinho e engenharia de elite para as Guildas de TI do SENAI. Que o XP esteja com você!* ⚡
