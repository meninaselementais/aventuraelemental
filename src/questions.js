export const SUBJECTS = {
  math: { name: 'Matemática', short: 'MATEMÁTICA', icon: '＋' },
  portuguese: { name: 'Língua Portuguesa', short: 'PORTUGUÊS', icon: 'Ab' },
  science: { name: 'Ciências', short: 'CIÊNCIAS', icon: '♧' },
  history: { name: 'História e Geografia', short: 'HISTÓRIA E GEOGRAFIA', icon: '⌂' },
  english: { name: 'Inglês', short: 'INGLÊS', icon: 'Aa' },
  mix: { name: 'Modo MIX', short: 'MIX DE MATÉRIAS', icon: '✦' }
};

const choice = (prompt, answer, wrong, hint) => ({ prompt, answer, choices: [answer, ...wrong], hint, inputMode: 'choice' });
const typed = (prompt, answer, hint = 'DIGITE A RESPOSTA') => ({ prompt, answer: String(answer), hint, inputMode: 'typed' });

const BANKS = {
  portuguese: [
    [
      choice('Qual texto usamos para deixar um recado curto?', 'Bilhete', ['Receita', 'Cartaz', 'Dicionário'], 'LEITURA'),
      choice('Qual texto ensina a preparar um alimento?', 'Receita', ['Bilhete', 'Poema', 'Notícia'], 'LEITURA'),
      choice('Qual texto pode anunciar uma festa na escola?', 'Cartaz', ['Receita', 'Bilhete', 'Lista de compras'], 'LEITURA'),
      choice('Em uma receita, onde aparecem os itens necessários?', 'Ingredientes', ['Assinatura', 'Título do livro', 'Endereço'], 'INTERPRETAÇÃO'),
      choice('No bilhete, quem escreve costuma colocar o quê no final?', 'Assinatura', ['Preço', 'Ingrediente', 'Legenda'], 'INTERPRETAÇÃO')
    ],
    [
      choice('Qual palavra está escrita corretamente?', 'Cachorro', ['Cachoro', 'Caxorro', 'Cachor'], 'R OU RR'),
      choice('Complete: A ba__iga do gato.', 'Barriga', ['Bariga', 'Bahriga', 'Báriga'], 'R OU RR'),
      choice('Qual palavra tem R com som forte no início?', 'Rua', ['Arara', 'Barata', 'Pirata'], 'R OU RR'),
      choice('Complete: A menina é ca__inhosa.', 'Carinhosa', ['Carrinhosa', 'Carriñosa', 'Carihosa'], 'R OU RR'),
      choice('Qual palavra precisa de RR?', 'Terra', ['Pirata', 'Arara', 'Coroa'], 'R OU RR')
    ],
    [
      choice('Qual é o plural de flor?', 'Flores', ['Flors', 'Flora', 'Florzinhas'], 'SINGULAR E PLURAL'),
      choice('Qual é o singular de cadernos?', 'Caderno', ['Caderna', 'Cadernais', 'Cadernos'], 'SINGULAR E PLURAL'),
      choice('A palavra “meninas” está em qual número?', 'Plural', ['Singular', 'Diminutivo', 'Aumentativo'], 'SINGULAR E PLURAL'),
      choice('Qual frase está no plural?', 'Os gatos dormem.', ['O gato dorme.', 'A gata dormiu.', 'Um gato dorme.'], 'SINGULAR E PLURAL'),
      choice('Complete: Uma bola, duas ___.', 'Bolas', ['Bola', 'Bolases', 'Bolão'], 'SINGULAR E PLURAL')
    ],
    [
      choice('“Ontem eu brinquei” está em qual tempo?', 'Passado', ['Presente', 'Futuro', 'Infinitivo'], 'TEMPOS VERBAIS'),
      choice('“Amanhã estudarei” está em qual tempo?', 'Futuro', ['Passado', 'Presente', 'Diminutivo'], 'TEMPOS VERBAIS'),
      choice('“Agora eu leio” está em qual tempo?', 'Presente', ['Passado', 'Futuro', 'Plural'], 'TEMPOS VERBAIS'),
      choice('Qual verbo termina em -AR?', 'Cantar', ['Comer', 'Partir', 'Vender'], 'AR, ER E IR'),
      choice('Qual verbo termina em -IR?', 'Sorrir', ['Brincar', 'Comer', 'Correr'], 'AR, ER E IR')
    ],
    [
      choice('Qual é o diminutivo de casa?', 'Casinha', ['Casarão', 'Caseiro', 'Casas'], 'AUMENTATIVO E DIMINUTIVO'),
      choice('Qual é o aumentativo de gato?', 'Gatão', ['Gatinho', 'Gataria', 'Gatos'], 'AUMENTATIVO E DIMINUTIVO'),
      choice('Qual palavra começa com H?', 'Hoje', ['Oje', 'Choje', 'Lhoje'], 'H, CH, LH E NH'),
      choice('Complete: O coe__o come cenoura.', 'Coelho', ['Coenho', 'Coechio', 'Coelo'], 'H, CH, LH E NH'),
      choice('Complete: O ni__o está no galho.', 'Ninho', ['Nilho', 'Nio', 'Nichо'], 'H, CH, LH E NH')
    ]
  ],
  science: [
    [
      choice('Qual parte da planta fica geralmente dentro do solo?', 'Raiz', ['Folha', 'Flor', 'Fruto'], 'PARTES DA PLANTA'),
      choice('Qual parte sustenta folhas, flores e frutos?', 'Caule', ['Raiz', 'Semente', 'Terra'], 'PARTES DA PLANTA'),
      choice('Qual parte da planta capta luz para produzir alimento?', 'Folha', ['Raiz', 'Pedra', 'Fruto'], 'PARTES DA PLANTA'),
      choice('O que pode dar origem a uma nova planta?', 'Semente', ['Pedra', 'Areia', 'Galho seco'], 'CICLO DA PLANTA'),
      choice('Do que uma planta precisa para crescer?', 'Água e luz', ['Plástico e tinta', 'Somente pedras', 'Escuro total'], 'CUIDADOS COM A PLANTA')
    ],
    [
      choice('A laranja nasce em qual planta?', 'Laranjeira', ['Bananeira', 'Macieira', 'Mangueira'], 'É PÉ DE QUÊ?'),
      choice('A banana nasce em qual planta?', 'Bananeira', ['Laranjeira', 'Goiabeira', 'Pereira'], 'É PÉ DE QUÊ?'),
      choice('A manga nasce em qual planta?', 'Mangueira', ['Videira', 'Limoeiro', 'Cafeeiro'], 'É PÉ DE QUÊ?'),
      choice('A uva nasce geralmente em uma…', 'Videira', ['Bananeira', 'Palmeira', 'Samambaia'], 'É PÉ DE QUÊ?'),
      choice('Qual alimento é uma raiz?', 'Cenoura', ['Alface', 'Tomate', 'Ervilha'], 'PARTES QUE COMEMOS')
    ],
    [
      choice('O solo é formado por fragmentos de rochas e também por…', 'Matéria orgânica', ['Plástico', 'Vidro', 'Metal'], 'O SOLO'),
      choice('Qual solo deixa a água passar rapidamente?', 'Arenoso', ['Argiloso', 'Humoso', 'Congelado'], 'TIPOS DE SOLO'),
      choice('Qual solo costuma ser pegajoso quando molhado?', 'Argiloso', ['Arenoso', 'Pedregoso', 'Seco'], 'TIPOS DE SOLO'),
      choice('O húmus vem principalmente de…', 'Restos de seres vivos', ['Garrafas', 'Pedras novas', 'Tinta'], 'O SOLO'),
      choice('Minhocas ajudam o solo porque criam caminhos para…', 'Ar e água', ['Plástico e vidro', 'Fogo e fumaça', 'Sal e açúcar'], 'VIDA NO SOLO')
    ],
    [
      choice('O desgaste do solo causado por água e vento chama-se…', 'Erosão', ['Plantação', 'Irrigação', 'Polinização'], 'CUIDADOS COM O SOLO'),
      choice('Qual atitude ajuda a proteger o solo?', 'Manter plantas no terreno', ['Retirar toda vegetação', 'Jogar lixo', 'Queimar sempre'], 'CUIDADOS COM O SOLO'),
      choice('Por que não devemos jogar lixo no chão?', 'Pode contaminar o solo', ['Deixa o solo mais fértil', 'Faz nascer árvores', 'Produz água limpa'], 'CUIDADOS COM O SOLO'),
      choice('As raízes ajudam a evitar erosão porque…', 'Seguram o solo', ['Queimam a terra', 'Retiram todo o ar', 'Criam plástico'], 'CUIDADOS COM O SOLO'),
      choice('Qual ser vivo pode decompor folhas no solo?', 'Fungo', ['Brinquedo', 'Pedra', 'Copo'], 'VIDA NO SOLO')
    ],
    [
      choice('Uma planta murchou em solo muito seco. O que fazer primeiro?', 'Regar adequadamente', ['Cobrir com plástico', 'Retirar as folhas', 'Colocar no escuro'], 'INVESTIGAÇÃO'),
      choice('Para comparar dois solos, o que devemos observar?', 'Cor, textura e água', ['Somente o nome', 'Preço do vaso', 'Cor da parede'], 'INVESTIGAÇÃO'),
      choice('Qual sequência mostra o começo do ciclo de uma planta?', 'Semente, broto, planta', ['Planta, pedra, semente', 'Flor, plástico, broto', 'Solo, copo, pedra'], 'CICLO DA PLANTA'),
      choice('Se a água fica parada sobre um solo, ele pode ser mais…', 'Argiloso', ['Arenoso', 'Cheio de ar', 'Feito de plástico'], 'TIPOS DE SOLO'),
      choice('Folhas secas podem virar adubo por meio da…', 'Decomposição', ['Evaporação', 'Congelação', 'Iluminação'], 'MATÉRIA ORGÂNICA')
    ]
  ],
  history: [
    [
      choice('Onde há mais plantações e criação de animais?', 'No campo', ['Na cidade', 'No shopping', 'No aeroporto'], 'CAMPO E CIDADE'),
      choice('Onde encontramos muitos prédios e avenidas?', 'Na cidade', ['No campo', 'Na floresta', 'Na fazenda'], 'CAMPO E CIDADE'),
      choice('Qual paisagem é comum no campo?', 'Pasto e plantação', ['Muitos semáforos', 'Metrô', 'Arranha-céus'], 'PAISAGENS'),
      choice('Qual elemento é comum na cidade?', 'Semáforo', ['Curral', 'Pomar', 'Celeiro'], 'PAISAGENS'),
      choice('Campo e cidade são lugares…', 'Diferentes e conectados', ['Exatamente iguais', 'Sem moradores', 'Sem trabalhos'], 'CAMPO E CIDADE')
    ],
    [
      choice('Quem cultiva alimentos no campo?', 'Agricultor', ['Motorista de ônibus', 'Porteiro', 'Semaforista'], 'TRABALHOS'),
      choice('Quem cuida da criação de animais?', 'Pecuarista', ['Carteiro', 'Dentista', 'Bibliotecário'], 'TRABALHOS'),
      choice('Qual trabalho é muito encontrado na cidade?', 'Motorista de ônibus', ['Colhedor de café', 'Criador de gado', 'Tratorista rural'], 'TRABALHOS'),
      choice('Quem pode vender na cidade os alimentos do campo?', 'Comerciante', ['Espantalho', 'Trator', 'Celeiro'], 'TRABALHOS'),
      choice('O trabalho de professores existe…', 'No campo e na cidade', ['Somente no campo', 'Somente em fábricas', 'Em lugar nenhum'], 'TRABALHOS')
    ],
    [
      choice('O leite produzido no campo pode ser levado à cidade para…', 'Ser vendido e consumido', ['Virar pedra', 'Ser jogado fora', 'Parar o trânsito'], 'RELAÇÕES'),
      choice('Máquinas fabricadas na cidade podem ajudar…', 'O trabalho no campo', ['A secar os rios', 'A apagar plantações', 'A impedir colheitas'], 'RELAÇÕES'),
      choice('Como produtos do campo chegam à cidade?', 'Por meios de transporte', ['Somente pelo vento', 'Por mágica', 'Nunca chegam'], 'TRANSPORTES'),
      choice('Qual produto costuma vir do campo?', 'Arroz', ['Semáforo', 'Elevador', 'Asfalto'], 'PRODUTOS'),
      choice('Campo e cidade dependem um do outro por causa de…', 'Produtos e serviços', ['Somente jogos', 'Ausência de pessoas', 'Falta de estradas'], 'RELAÇÕES')
    ],
    [
      choice('Qual transporte pode levar uma colheita até a cidade?', 'Caminhão', ['Balanço', 'Elevador', 'Carrinho de bebê'], 'TRANSPORTES'),
      choice('Uma estrada liga duas localidades. Ela facilita…', 'O deslocamento de pessoas e produtos', ['O crescimento de árvores', 'A chuva', 'O dia e a noite'], 'CONEXÕES'),
      choice('Uma cidade pode crescer e mudar sua paisagem com…', 'Novas construções', ['Somente sementes', 'Apenas animais', 'Ausência de moradores'], 'TRANSFORMAÇÕES'),
      choice('Qual serviço da cidade também atende pessoas do campo?', 'Hospital', ['Semáforo', 'Prédio vazio', 'Outdoor'], 'SERVIÇOS'),
      choice('Feiras aproximam campo e cidade porque…', 'Vendem produtos dos agricultores', ['Fecham as estradas', 'Retiram o solo', 'Impedem o comércio'], 'RELAÇÕES')
    ],
    [
      choice('Uma família rural vende verduras na feira urbana. Isso mostra…', 'Relação entre campo e cidade', ['Que os lugares não se comunicam', 'Que não há trabalho', 'Que toda cidade é rural'], 'ANÁLISE'),
      choice('Se uma estrada é bloqueada, o que pode acontecer?', 'Produtos podem atrasar', ['A colheita chega mais rápido', 'A distância diminui', 'Os caminhões voam'], 'ANÁLISE'),
      choice('Qual ação valoriza trabalhadores do campo?', 'Respeitar quem produz alimentos', ['Desperdiçar comida', 'Poluir plantações', 'Fechar todas as feiras'], 'CIDADANIA'),
      choice('Campo e cidade possuem escolas porque…', 'Todos têm direito à educação', ['Somente adultos estudam', 'Não existem crianças', 'Escolas produzem frutas'], 'CIDADANIA'),
      choice('Para melhorar a relação entre campo e cidade é importante…', 'Ter transportes e comércio responsáveis', ['Desperdiçar produtos', 'Poluir rios', 'Impedir trocas'], 'CIDADANIA')
    ]
  ],
  english: [
    [
      choice('What is your name?', 'My name is Ana.', ['I am eight years old.', 'It is blue.', 'He is Pedro.'], 'NAME'),
      choice('How old are you?', 'I am eight years old.', ['My name is Leo.', 'She is my friend.', 'It is a pencil.'], 'AGE'),
      choice('Maria is a girl. ___ is eight.', 'She', ['He', 'It', 'They'], 'HE OR SHE'),
      choice('What color is the sun in this drawing? ☀', 'Yellow', ['Blue', 'Purple', 'Black'], 'COLORS'),
      choice('Which letter comes after B?', 'C', ['A', 'D', 'F'], 'ALPHABET')
    ],
    [
      choice('Which object do we use to write?', 'Pencil', ['Chair', 'Door', 'Backpack'], 'SCHOOL OBJECTS'),
      choice('What number is “fourteen”?', '14', ['12', '16', '20'], 'NUMBERS 11–20'),
      choice('Complete: ___ is one book on the desk.', 'There', ['These', 'Those', 'Who'], 'THERE IS'),
      choice('How many pencils? ✏ ✏ ✏', 'Three', ['Two', 'Four', 'Five'], 'HOW MANY'),
      choice('Where is the book? It is ___ the table.', 'On', ['Blue', 'Seven', 'She'], 'WHERE IS')
    ],
    [
      choice('What is this? 🧸', 'This is a teddy bear.', ['These are cars.', 'She is a doll.', 'It is twelve.'], 'TOYS'),
      choice('Complete: ___ are my blocks.', 'These', ['This', 'He', 'Where'], 'THIS OR THESE'),
      choice('Choose one toy.', 'This is a ball.', ['These are balls.', 'Those is ball.', 'This are balls.'], 'THIS'),
      choice('Choose many toys.', 'These are dolls.', ['This is a doll.', 'These is a doll.', 'She are dolls.'], 'THESE'),
      choice('Whose ball is this? It belongs to Ben.', 'It is Ben’s ball.', ['It is blue.', 'There are two.', 'She is Ben.'], 'WHOSE')
    ],
    [
      choice('There ___ two erasers in the box.', 'are', ['is', 'am', 'be'], 'THERE IS / ARE'),
      choice('There ___ one ruler on the desk.', 'is', ['are', 'am', 'they'], 'THERE IS / ARE'),
      choice('How many books are there? 📘 📘 📘 📘', 'There are four.', ['There is one.', 'They are blue.', 'This is a book.'], 'HOW MANY'),
      choice('The backpack is under the chair. Where is it?', 'Under the chair', ['On the desk', 'In the book', 'Next to blue'], 'WHERE IS'),
      choice('Who is he?', 'He is my brother.', ['She is my sister.', 'It is a pencil.', 'These are toys.'], 'WHO IS HE?')
    ],
    [
      choice('The girl says: “My name is Ana. I am eight.” How old is Ana?', 'She is eight.', ['She is ten.', 'He is eight.', 'It is eight.'], 'READING'),
      choice('There are fifteen crayons. What is the number?', '15', ['13', '18', '20'], 'READING'),
      choice('Two dolls are on the bed. Which sentence is correct?', 'These are dolls.', ['This is a doll.', 'There is one doll.', 'He is a doll.'], 'READING'),
      choice('The car belongs to Lucy. Whose car is this?', 'It is Lucy’s car.', ['It is a red.', 'There are Lucy.', 'She is a car.'], 'READING'),
      choice('Tom has a green kite. What color is the kite?', 'Green', ['Blue', 'Yellow', 'Purple'], 'READING')
    ]
  ]
};

const MATH = [
  [
    typed('8 + 7 = ?', 15, 'SOMA  +'), typed('15 − 6 = ?', 9, 'DIMINUIR  −'), typed('2 × 4 = ?', 8, 'VEZES  ×'),
    typed('23 + 12 = ?', 35, 'SOMA  +'), typed('30 − 17 = ?', 13, 'DIMINUIR  −')
  ],
  [
    typed('47 + 36 = ?', 83, 'SOMA ATÉ 100'), typed('92 − 48 = ?', 44, 'SUBTRAÇÃO ATÉ 100'), typed('6 × 4 = ?', 24, 'MULTIPLICAÇÃO'),
    typed('Há 3 caixas com 5 lápis em cada. Quantos lápis?', 15, 'PROBLEMA'), typed('125 + 74 = ?', 199, 'SOMA')
  ],
  [
    typed('245 + 132 = ?', 377, 'UNIDADE DE MILHAR'), typed('700 − 268 = ?', 432, 'SUBTRAÇÃO'), typed('8 × 7 = ?', 56, 'TABUADA'),
    typed('Uma loja vendeu 120 bolas de manhã e 85 à tarde. Quantas vendeu?', 205, 'PROBLEMA'), typed('“Quatrocentos e vinte” em algarismos:', 420, 'NÚMERO POR EXTENSO')
  ],
  [
    typed('Tabela: maçãs 12, bananas 8. Quantas frutas ao todo?', 20, 'TABELAS'), typed('Um gráfico mostra 25 gatos e 18 cães. Quantos animais?', 43, 'GRÁFICOS'),
    typed('1 metro tem quantos centímetros?', 100, 'COMPRIMENTO'), typed('Meia hora tem quantos minutos?', 30, 'TEMPO'), typed('9 × 8 = ?', 72, 'MULTIPLICAÇÃO')
  ],
  [
    typed('Uma escola tinha 650 livros e recebeu mais 275. Quantos livros agora?', 925, 'PROBLEMA'), typed('1.000 − 468 = ?', 532, 'UNIDADE DE MILHAR'),
    typed('Uma fita de 2 metros tem quantos centímetros?', 200, 'COMPRIMENTO'), typed('Uma aula começa às 8h e termina às 10h. Quantas horas dura?', 2, 'TEMPO'),
    typed('Há 7 pacotes com 9 figurinhas. Quantas figurinhas?', 63, 'PROBLEMA')
  ]
];

function mathChoices(answer, index) {
  const offsets = [[-2, 3, 5], [-3, 2, 6], [-2, 4, 8], [-5, 4, 10], [-4, 3, 7]][index];
  return [answer, ...offsets.map(offset => Math.max(0, answer + offset))];
}

function shuffled(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getQuestion(subject, level, index) {
  const safeLevel = Math.max(1, Math.min(5, level));
  const safeIndex = Math.max(0, Math.min(4, index));
  if (subject === 'mix') {
    const mixedSubjects = ['math', 'portuguese', 'science', 'history', 'english'];
    const questionSubject = mixedSubjects[(safeIndex + safeLevel - 1) % mixedSubjects.length];
    const mixedQuestion = getQuestion(questionSubject, safeLevel, safeIndex);
    return {
      ...mixedQuestion,
      subject: questionSubject,
      hint: `${SUBJECTS[questionSubject].short} • ${mixedQuestion.hint || ''}`
    };
  }
  let item;
  if (subject === 'math') {
    item = { ...MATH[safeLevel - 1][safeIndex] };
    if (safeLevel === 1) {
      item.inputMode = 'choice';
      item.choices = mathChoices(Number(item.answer), safeIndex);
    }
  } else {
    item = { ...BANKS[subject][safeLevel - 1][safeIndex] };
  }
  if (item.choices) item.choices = shuffled(item.choices);
  item.subject = subject;
  return item;
}

export function normalizeAnswer(value) {
  return String(value).trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.!?]/g, '').replace(/\s+/g, ' ');
}
