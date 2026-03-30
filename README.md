# Placar Pokémon

Site para marcar pontos por tarefa, com evolução do Pokémon a cada 100 pontos (até a última forma), placar geral e por tipo. Dá para usar só no navegador ou com Firebase para várias pessoas verem ao mesmo tempo.

## Rodar no PC

```bash
npm install
npm run dev
```

Abre o link que o terminal mostrar (costuma ser `http://localhost:5173`).

## Onde os dados ficam

**Sem `.env`** — tudo no `localStorage` e, se tiver mais de uma aba aberta no mesmo PC, as abas se atualizam entre si.

**Com Firebase** — cria um projeto no [console do Firebase](https://console.firebase.google.com/), liga o Firestore, copia `.env.example` para `.env`, preenche as variáveis `VITE_FIREBASE_*` e roda de novo. As regras de exemplo estão em `firestore.rules` (servem para demo; ajuste se for usar de verdade na rede).

## Publicar (build estático)

```bash
npm run build
```

A pasta `dist` é o site. Firebase Hosting, Netlify, Vercel ou qualquer hospedagem de arquivo estático funciona. Para placar ao vivo na internet, o build precisa das variáveis do Firebase no `.env`.

## Som

Efeitos são gerados no próprio navegador. Música: botão ♪; se existir `public/bgm.mp3`, ele tenta tocar isso, senão fica um loop simples tipo RPG 8-bit. 🔊/🔇 grava preferência no `localStorage`.

Não incluí trilhas de jogos comerciais por direitos autorais — use um `bgm.mp3` seu se quiser uma música específica.

## Sprites

Imagens vêm da [PokeAPI](https://pokeapi.co/) (geração III, estilo próximo ao GBA).
