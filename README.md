# Aventura das ELEMENTAIS

Protótipo de aventura matemática 3D em terceira pessoa para crianças de 8 anos, pensado para celular em posição horizontal.

## Como jogar

1. Instale as dependências com `npm install`.
2. Inicie o jogo com `npm run dev`.
3. Abra o endereço exibido pelo terminal no celular ou computador.

No celular, use o controle esquerdo para mover a Elemental e arraste o lado direito para girar a câmera. No computador, use **WASD** ou as setas, arraste o mouse para girar a câmera e pressione **E** perto do painel.

## Regras implementadas

- Cada porta possui um painel com uma conta de matemática.
- A criança escolhe entre quatro respostas e tem três tentativas.
- Depois de três erros, a porta desaparece e surge em outro lugar com uma nova conta.
- Uma resposta correta abre a porta e leva à próxima sala.
- A cada cinco salas, começa um novo nível.
- A dificuldade progride entre soma, subtração e multiplicação; não há contas de divisão.
- As salas alternam entre formatos quadrados, retangulares, redondos, pequenos e grandes.
- Existem temas como corredores dourados, fogo, água, carvão e cristais.
- A mesma conta permanece ao fechar e reabrir o painel.
- Cinco matérias disponíveis: Matemática, Língua Portuguesa, Ciências, História e Geografia e Inglês.
- Cada matéria possui 5 níveis com 5 perguntas em cada nível (25 desafios por matéria).
- Matemática usa quatro alternativas no nível 1 e respostas digitadas do nível 2 ao 5.
- Os conteúdos seguem as matérias do 3º ano enviadas como referência.
- O jogo pode ser instalado no celular como PWA após uma compilação de produção.

## Gerar a versão final

Execute `npm run build`. Os arquivos prontos ficarão na pasta `dist`.
