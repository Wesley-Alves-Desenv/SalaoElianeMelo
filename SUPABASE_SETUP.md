# Configuração Supabase

## Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os detalhes:
   - **Project name**: `salao-eliane-melo`
   - **Database password**: (gere uma senha segura)
   - **Region**: Escolha a região mais próxima
5. Aguarde a criação do projeto

## Passo 2: Copiar Credenciais

1. No dashboard do Supabase, vá para **Settings > API**
2. Copie:
   - **Project URL** (ex: `https://your-project.supabase.co`)
   - **anon public key** (a chave pública)

## Passo 3: Atualizar `.env.local`

Abra o arquivo `.env.local` na raiz do projeto e atualize:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui
```

## Passo 4: Criar Tabelas no Supabase

Execute o SQL abaixo no SQL Editor do Supabase (**SQL > New Query**):

```sql
-- Services Table
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Professionals Table
CREATE TABLE professionals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'CLIENT',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  user_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  service_id TEXT NOT NULL REFERENCES services(id),
  professional_id TEXT NOT NULL REFERENCES professionals(id),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'Agendado',
  rating INTEGER,
  review_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Config Table
CREATE TABLE config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  days JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security) - opcional mas recomendado
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Permitir acesso público para leitura (ajuste conforme necessário)
CREATE POLICY "Allow public read on services" ON services FOR SELECT USING (true);
CREATE POLICY "Allow public read on professionals" ON professionals FOR SELECT USING (true);

## Deploy para Vercel

Siga estes passos para publicar o projeto no Vercel (adequado para aplicações Vite/React):

1. No Vercel, clique em "New Project" e conecte seu repositório Git (GitHub/GitLab/Bitbucket).
2. Em **Project Settings > General**, confirme que o framework detected é `vite` ou `other`.
3. Em **Build & Development Settings** configure:
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`

4. Adicione as variáveis de ambiente necessárias em **Settings > Environment Variables** (Repository > Production):
  - `VITE_SUPABASE_URL` = `https://<your-project>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `<anon-public-key>`
  - `GEMINI_API_KEY` = `<sua-chave-gemini-ou-google-genai>`

  Observação: variáveis `VITE_` são injetadas no build e estarão disponíveis no cliente.

5. Se o frontend fizer requisições ao Supabase, configure CORS no Supabase Dashboard → Settings → API → **Allow Origins** adicionando a URL do seu deploy (ex: `https://seu-projeto.vercel.app`).

6. Opcional: na raiz do projeto foi adicionada uma `vercel.json` para garantir que o build use `@vercel/static-build` e um roteamento de fallback para SPA (serve `index.html` em todas as rotas). Também foi adicionada uma `.vercelignore` para evitar publicar arquivos sensíveis.

7. Após salvar as variáveis e confirmar o build settings, clique em "Deploy" no Vercel. A primeira build pode demorar alguns minutos.

8. Verifique o deploy e abra a URL fornecida pelo Vercel. Teste flows críticos: criação de serviços, agendamentos e login administrativo.

Problemas comuns:
- Build falha por `VITE_*` undefined: confirme se adicionou as variáveis de ambiente ao ambiente correto (Production vs Preview) e re-deploy.
- Erro CORS ao chamar Supabase: verifique Allowed Origins no painel do Supabase.
- Chave errada/permissões: use a `anon public` key para operações públicas; para operações privilegiadas (inserções protegidas por RLS) ajuste as policies ou faça inserções via funções server-side.

Se quiser, posso adicionar um `README-deploy.md` com passos detalhados e comandos de verificação.
```

## Passo 5: Instalar Dependências

```bash
npm install
```

## Passo 6: Iniciar a Aplicação

```bash
npm run dev
```

## Funcionamento

- A aplicação tentará conectar ao Supabase na inicialização
- Se Supabase estiver configurado corretamente, os dados serão carregados do Supabase
- Se falhar, a aplicação usa **localStorage** como fallback com dados mock
- Isso garante que a aplicação funciona mesmo sem Supabase configurado

## Sincronização de Dados

Quando você cria/edita/deleta dados na aplicação:

1. **Se Supabase estiver configurado**: Os dados são salvos no Supabase E no localStorage (fallback)
2. **Se Supabase não estiver configurado**: Os dados são salvos apenas no localStorage

## Troubleshooting

### Erro: "VITE_SUPABASE_URL is not defined"
- Verifique se `.env.local` tem as variáveis corretas
- Reinicie o servidor dev (`npm run dev`)

### Erro de conexão ao Supabase
- Verifique se a URL e chave estão corretas
- Confirme que o projeto Supabase está ativo
- Verifique as políticas RLS nas tabelas

### Dados não aparecem
- Verifique o Console (F12) para mensagens de erro
- Confirme que as tabelas foram criadas no Supabase
- Tente recarregar a página
