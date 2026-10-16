// CONTEÚDO DEMONSTRATIVO. Substitua por acordos, códigos e regras validados.
// Não há consulta a parceiros, validação de elegibilidade ou resgate real.
export const BENEFITS = [
  {
    id: 'cinemark', brand: 'Cinemark', category: 'Bomboniere', reference: 'CA / 001',
    title: 'O combo também entra em cena.', highlight: '50% no AstraBar',
    image: '/parcerias/pipoca.jpg', imageAlt: 'Saquinhos de pipoca de cinema em tons de vermelho e branco',
    perks: [
      { value: '50%', label: 'em combos selecionados do AstraBar', note: 'A pipoca e a bebida já fazem parte do programa.' },
      { value: '15%', label: 'na pipoca avulsa', note: 'Para quem prefere montar o próprio pedido.' },
      { value: '10%', label: 'em bebidas selecionadas', note: 'Um complemento para acompanhar a sessão.' },
    ],
    description: 'Um desconto para acompanhar os créditos, a pipoca e aquela conversa depois do filme.',
    eligibility: 'Para assinantes do programa de fidelidade do parceiro.',
    code: 'DEMO-ASTRABAR50',
    rules: ['Uma utilização por CPF, por sessão, em um dos benefícios apresentados.', 'Assinatura ativa no programa do parceiro. Produtos e unidades selecionados.', 'Descontos não cumulativos com outras ofertas.'],
  },
  {
    id: 'nubank', brand: 'Nubank', category: 'Ingressos', reference: 'CA / 002',
    title: 'Seu próximo filme, por menos.', highlight: '30% no ingresso',
    image: '/parcerias/tela-cinema.jpg', imageAlt: 'Público ocupando as poltronas vermelhas de uma sala de cinema',
    perks: [
      { value: '30%', label: 'no valor do ingresso inteiro', note: 'Para escolher o filme que você estava esperando.' },
      { value: '10%', label: 'em compras selecionadas no AstraBar', note: 'Do ingresso à pipoca, a vantagem acompanha você.' },
      { value: '02', label: 'ingressos com desconto por sessão', note: 'O segundo lugar também pode entrar na história.' },
    ],
    description: 'Escolha a sessão, encontre sua poltrona e deixe um espaço no orçamento para a próxima estreia.',
    eligibility: 'Para pagamentos com cartão elegível do parceiro.',
    code: null,
    rules: ['Pagamento com cartão elegível do parceiro, em sessões e produtos selecionados.', 'Até dois ingressos por CPF, por sessão, na mesma compra.', 'Não cumulativo com meia-entrada ou outras promoções. Não inclui taxas de serviço.'],
  },
  {
    id: 'astra', brand: 'CineAstra', category: 'Experiências', reference: 'CA / 003',
    title: 'A estreia merece companhia.', highlight: '20% para a dupla',
    image: '/parcerias/projetor.jpg', imageAlt: 'Projetor de cinema com luz atravessando a sala escura',
    perks: [
      { value: '20%', label: 'na compra de dois ingressos inteiros', note: 'Duas poltronas, uma mesma sessão e muita história.' },
      { value: '15%', label: 'no combo para compartilhar', note: 'Porque a pipoca também pode ser a dois.' },
      { value: '01', label: 'cupom para usar no mesmo pedido', note: 'Os benefícios da dupla entram juntos na compra.' },
    ],
    description: 'Dois lugares, uma boa história. Uma condição especial para dividir a tela grande com alguém.',
    eligibility: 'Na compra de dois ingressos inteiros na mesma sessão.',
    code: 'DEMO-ASTRADUO20',
    rules: ['Os dois ingressos e o combo devem fazer parte do mesmo pedido.', 'Válido para salas e sessões selecionadas, sujeito à disponibilidade.', 'Não acumulável com meia-entrada ou outras campanhas.'],
  },
];

export const CATEGORIES = ['Todos', 'Ingressos', 'Bomboniere', 'Experiências'];

export const STEPS = [
  { title: 'Encontre a sua parceria', description: 'Explore as ofertas e confira qual combina com você. Cada benefício informa quem pode usar e o que está incluído.', icon: 'search' },
  { title: 'Confira as condições', description: 'Os benefícios e as condições estão no próprio cartão. Veja se a parceria pede um cupom, uma assinatura ativa ou uma forma de pagamento específica.', icon: 'ticket' },
  { title: 'Aplique na sua compra', description: 'Informe o cupom ou selecione o pagamento elegível. Confira o desconto no resumo antes de pagar e aproveite a sessão.', icon: 'check' },
];

export const FAQ = [
  ['Posso usar mais de um benefício na mesma compra?', 'Os descontos apresentados não são cumulativos. Consulte as condições de cada parceria e escolha o benefício que faz mais sentido para a sua compra.'],
  ['Todas as ofertas precisam de cupom?', 'Algumas usam um código promocional. Outras dependem de uma assinatura ativa ou de uma forma de pagamento específica. O modo de utilização aparece nos detalhes de cada benefício.'],
  ['O desconto vale para qualquer sessão?', 'Depende da oferta. Salas especiais, pré-estreias, horários e unidades podem ter regras próprias. Essas condições devem aparecer nos detalhes de cada benefício antes da compra.'],
  ['Como sei se o desconto foi aplicado?', 'Confira o resumo da compra antes de confirmar o pagamento. O benefício e o valor final precisam estar identificados. Se houver alguma diferença, revise as condições da oferta antes de continuar.'],
];
