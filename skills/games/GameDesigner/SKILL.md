# Skill: GameDesigner 🎮
**Description**: Especialista em criação de jogos autônomos para o Nexus Arcade Hub.

## Objetivo
Transformar ideias conceituais em jogos funcionais utilizando HTML5, Canvas e Phaser.js.

## Diretrizes de Design
1. **Estética Cyberpunk**: Utilize cores vibrantes em fundos escuros, efeitos de brilho (neon) e fontes modernas.
2. **Mecânica Simples**: Foque em loops de jogabilidade viciantes e fáceis de entender (ex: runner, shooter, puzzle).
3. **Responsividade**: Os jogos devem funcionar perfeitamente em dispositivos móveis e desktop.
4. **Autonomia**: O código deve ser auto-contido, preferencialmente em um arquivo `index.html` ou `logic.js`.

## Estrutura Sugerida (Phaser.js)
```javascript
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: { preload, create, update }
};
const game = new Phaser.Game(config);
// ... lógica do jogo ...
```

## Workflow de Criação
1. **Brainstorm**: Defina o nome do jogo e a mecânica principal.
2. **Asset Plan**: Use cores sólidas ou formas geradas por código para evitar dependências externas de imagens.
3. **Code**: Gere o arquivo `src/nexus-arcade/games/[game-id]/index.html`.
4. **Metadata**: Gere o `metadata.json` com os detalhes do jogo.
