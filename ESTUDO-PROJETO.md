# Guia de estudo — Placar Pokémon (defesa / perguntas do professor)

Este documento resume **arquitetura**, **decisões técnicas** e **perguntas frequentes** para preparares a apresentação ou uma conversa sobre o desenvolvimento.

---

## 1. O que é o produto (em uma frase)

Aplicação web (**React** + **TypeScript**, build com **Vite**) que regista **alunos**, **tarefas** e **notas por tarefa**, calcula o **total de pontos**, determina o **estágio evolutivo** do Pokémon (a cada **100 pontos**) e mostra **placar geral**, **por tipo** e **planilha** de desempenho. Os dados podem ficar só no **navegador** ou na **nuvem (Firebase Firestore)** para sincronização entre dispositivos.

---

## 2. Stack tecnológica

| Peça | Uso |
|------|-----|
| **React 19** | Interface (componentes, estado) |
| **TypeScript** | Tipagem e organização do código |
| **Vite** | Servidor de desenvolvimento e `build` para produção (`dist/`) |
| **Firebase Firestore** (opcional) | Base de dados em tempo real na nuvem |
| **localStorage** (fallback) | Persistência local quando não há Firebase configurado |
| **Sprites** | Imagens via URLs públicas (PokeAPI, geração III / estilo próximo ao GBA) |

Variáveis de ambiente: `VITE_FIREBASE_*` — o Vite só inclui no bundle variáveis que começam por `VITE_`.

---

## 3. Estrutura de pastas (mapa mental)

```
src/
  App.tsx              → Navegação entre telas (home vs consola)
  main.tsx             → Entrada React
  index.css            → Estilos globais (tema “GBA”)
  audio/               → Sons (Web Audio API, etc.)
  context/             → DataContext: estado global dos dados
  db/                  → Camada de dados (local vs Firebase)
    index.ts           → createDatabase(): escolhe Firebase ou local
    types.ts           → Tipos Student, Task, TaskScore, Team, DatabaseApi
    localDatabase.ts   → localStorage + BroadcastChannel
    firestoreDatabase.ts → Firestore + onSnapshot
    firebaseConfig.ts  → Lê import.meta.env.VITE_FIREBASE_*
  domain/              → Regras de negócio (sem UI)
    pokemon.ts         → Lista de Pokémon, tipos, nomes por estágio
    evolution.ts       → Cálculo do estágio a partir dos pontos
    scores.ts          → Totais, standings, sprites por estágio
    matricula.ts       → Validação da matrícula (7 dígitos)
  hooks/               → useEvolutionQueue (fila de animações de evolução)
  ui/                  → EvolutionOverlay, GameAudioHud
  views/               → Telas (screens.tsx, PlanilhaScreen.tsx)
```

---

## 4. Modelo de dados (conceito)

- **Aluno** (`Student`): nome, matrícula (7 números), `pokemonKey` (uma linha da lista), `createdAt`.
- **Tarefa** (`Task`): título, `maxPoints`, `createdAt`.
- **Nota** (`TaskScore`): `studentId` + `taskId` + `points` (`updatedAt`). Uma linha por par aluno–tarefa (substituição ao atualizar).
- **Equipe** (`Team`): nome, lista de `studentIds`, `createdAt`.

No **Firestore**, coleções típicas: `students`, `tasks`, `taskScores`, `teams`. IDs de documentos gerados pelo Firebase ou compostos (ex.: `taskScores` usa id `studentId__taskId` com `/` sanitizado).

---

## 5. Como o app escolhe “local” vs “Firebase”

Ficheiro `src/db/index.ts`:

1. **Se** `firebaseConfig` tiver `apiKey`, `projectId` e `appId` (via `VITE_FIREBASE_*`) → usa **Firestore**.
2. **Senão** → usa **localDatabase** (`localStorage`).

Isto significa: o mesmo código em produção; só muda a **configuração** (no `.env` local ou nas **Environment Variables** da Vercel) e **redeploy** após alterar variáveis.

---

## 6. Regras de negócio importantes

### 6.1 Um Pokémon por aluno

No cadastro, o aluno escolhe **um** `pokemonKey` entre `POKEMON_LIST` em `domain/pokemon.ts`. Não há multi-seleção.

### 6.2 Pontuação por tarefa

Cada nota liga **um aluno** a **uma tarefa** com um valor de pontos, respeitando o máximo da tarefa (`maxPoints`).

### 6.3 Evolução a cada 100 pontos

Ficheiro `domain/evolution.ts`:

- `evolutionStageIndex(totalPoints, chainLength)`:
  - `totalPoints` = soma dos pontos do aluno em todas as tarefas.
  - `stage = floor(totalPoints / 100)` (um estágio a mais a cada 100 pontos).
  - Cap no último estágio da cadeia (`evolutionChain` no Pokémon).

Cada Pokémon tem `evolutionChain` (IDs da Pokédex) e `stageNamesPt` (nomes em português por estágio).

### 6.4 Placar geral e por tipo

- **Geral:** ordenação por total de pontos (desempate por nome).
- **Por tipo:** filtra pelo **tipo primário** do Pokémon (`primaryType` em `pokemon.ts`).

### 6.5 “Tempo real”

- **Firestore:** `onSnapshot` atualiza os dados quando a base muda → vários clientes veem alterações ao mesmo tempo.
- **Só localStorage:** dados **não** são partilhados entre dispositivos; `BroadcastChannel` sincroniza **abas** no mesmo navegador.

---

## 7. Fluxo da interface (telas)

- **Home (GBA):** atalhos para Placar, Registros, Equipes, Lista geral, Planilha.
- **Registros:** submenus Aluno / Tarefa / Atribuir pontos.
- **Placar (Pokédex):** Geral, Por tipo, Por equipe.
- **Planilha:** tabela dinâmica com colunas por tarefa (ordem de criação), total e 1.º Pokémon.
- **Evolução:** quando o total passa de um patamar de 100 pontos, aparece overlay (`EvolutionOverlay`) com animação.

---

## 8. Perguntas que o professor pode fazer (e respostas curtas)

**P: “Por que React?”**  
R: Componentização da UI, estado reativo e ecossistema maduro; combina bem com TypeScript e Vite.

**P: “Onde estão guardados os dados?”**  
R: Com Firebase (variáveis `VITE_FIREBASE_*`), no **Cloud Firestore**. Sem isso, no **localStorage** do navegador.

**P: “Como garantem pontuação por tarefa?”**  
R: Modelo `TaskScore` com `studentId` + `taskId` + `points`; uma operação por par (substituição).

**P: “Como funciona a evolução a cada 100 pontos?”**  
R: Função `evolutionStageIndex`: `floor(total/100)` limitado ao tamanho da cadeia; sprite e nome vêm do estágio atual.

**P: “O que é tempo real?”**  
R: Com Firestore, listeners (`onSnapshot`) atualizam a UI quando os dados mudam; todos os clientes ligados ao mesmo projeto veem o mesmo conjunto.

**P: “Por que Vite?”**  
R: Build rápido e `npm run build` gera ficheiros estáticos prontos para hospedar (Netlify, Vercel, etc.).

**P: “Segurança do Firebase?”**  
R: Em produção séria usa-se **autenticação** e regras restritivas; em demo académica pode usar-se regras abertas com consciência de risco.

**P: “Diferença entre Realtime Database e Firestore?”**  
R: Este projeto usa **Firestore** (documentos/coleções). O Realtime Database é outro produto (árvore JSON); o código não está a usar RTDB.

---

## 9. Comandos úteis para demonstrar

```bash
npm install    # dependências
npm run dev    # desenvolvimento local
npm run build  # gera dist/ para produção
```

---

## 10. Pontos de atenção (honestidade técnica)

- **APIs públicas do Firebase** no cliente são normais; a proteção é **Firestore Rules** (e autenticação).
- **Sprites de terceiros** (PokeAPI): mencionar uso educativo e créditos se o professor perguntar por direitos de imagem.
- **Planilha Google** do enunciado: inspiração de layout; os dados no app são os que registas na aplicação, não importação automática da folha.

---

## 11. Ficheiros para abrir se te perguntarem “onde está X?”

| Tema | Ficheiro |
|------|-----------|
| Escolha Firebase vs local | `src/db/index.ts` |
| Regras de evolução | `src/domain/evolution.ts` |
| Lista de Pokémon + tipos | `src/domain/pokemon.ts` |
| Totais e placar | `src/domain/scores.ts` |
| Persistência Firestore | `src/db/firestoreDatabase.ts` |
| Persistência local | `src/db/localDatabase.ts` |
| Estado global | `src/context/DataContext.tsx` |
| Navegação / telas | `src/App.tsx`, `src/views/screens.tsx` |

Boa defesa.
