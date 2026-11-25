// Central de Utilidades — cálculos com formulários e com prompt()/alert().

const moeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function mostrarResultado(formulario, mensagem, erro = false) {
  const resultado = document.querySelector(`#painel-${formulario.dataset.formulario} .resultado`);
  resultado.textContent = mensagem;
  resultado.classList.remove('vazio');
  resultado.classList.toggle('erro', erro);
}

function numeroDoCampo(formulario, nome) {
  const campo = formulario.elements.namedItem(nome);
  const valor = campo.valueAsNumber;
  if (campo.value.trim() === '' || !Number.isFinite(valor)) return null;
  return valor;
}

function calcularDesconto(preco, percentual) {
  const economia = preco * percentual / 100;
  return { economia, precoFinal: preco - economia };
}

function simularInvestimento(inicial, aporteMensal, taxaPercentual, meses) {
  let saldo = inicial;
  let totalInvestido = inicial;
  for (let mes = 1; mes <= meses; mes++) {
    saldo *= 1 + taxaPercentual / 100;
    saldo += aporteMensal;
    totalInvestido += aporteMensal;
  }
  return { saldoFinal: saldo, totalInvestido, rendimento: saldo - totalInvestido };
}

function calcularTotalDespesas(formulario) {
  let total = 0;
  const itens = formulario.querySelectorAll('.linha-despesa');
  if (itens.length === 0) return null;
  for (const item of itens) {
    const nome = item.querySelector('[name="nomeDespesa"]').value.trim();
    const valor = item.querySelector('[name="valorDespesa"]').valueAsNumber;
    if (!nome || !Number.isFinite(valor) || valor < 0) return null;
    total += valor;
  }
  return total;
}

function executarCalculo(formulario) {
  const tipo = formulario.dataset.formulario;
  let mensagem;
  switch (tipo) {
    case 'desconto': {
      const preco = numeroDoCampo(formulario, 'preco');
      const percentual = numeroDoCampo(formulario, 'percentual');
      if (preco === null || percentual === null || preco < 0 || percentual < 0 || percentual > 100) {
        mostrarResultado(formulario, 'Informe um preço válido e um desconto entre 0% e 100%.', true);
        return;
      }
      const resultado = calcularDesconto(preco, percentual);
      mensagem = `Preço original: ${moeda(preco)}\nEconomia: ${moeda(resultado.economia)}\nPreço final: ${moeda(resultado.precoFinal)}`;
      break;
    }
    case 'parcelas': {
      const total = numeroDoCampo(formulario, 'total');
      const quantidade = numeroDoCampo(formulario, 'quantidade');
      if (total === null || quantidade === null || total < 0 || !Number.isInteger(quantidade) || quantidade < 1) {
        mostrarResultado(formulario, 'Informe um valor válido e um número inteiro de parcelas maior que zero.', true);
        return;
      }
      mensagem = `Valor total: ${moeda(total)}\n${quantidade} parcela(s) de ${moeda(total / quantidade)}, sem juros.`;
      break;
    }
    case 'investimento': {
      const inicial = numeroDoCampo(formulario, 'inicial');
      const aporte = numeroDoCampo(formulario, 'aporte');
      const taxa = numeroDoCampo(formulario, 'taxa');
      const meses = numeroDoCampo(formulario, 'meses');
      if ([inicial, aporte, taxa, meses].some((valor) => valor === null || valor < 0) || !Number.isInteger(meses) || meses < 1) {
        mostrarResultado(formulario, 'Preencha valores não negativos. O período deve ser um número inteiro de meses.', true);
        return;
      }
      const resultado = simularInvestimento(inicial, aporte, taxa, meses);
      mensagem = `Saldo final: ${moeda(resultado.saldoFinal)}\nTotal investido: ${moeda(resultado.totalInvestido)}\nRendimento: ${moeda(resultado.rendimento)}`;
      break;
    }
    case 'despesas': {
      const total = calcularTotalDespesas(formulario);
      const pessoas = numeroDoCampo(formulario, 'pessoas');
      if (total === null || pessoas === null || !Number.isInteger(pessoas) || pessoas < 1) {
        mostrarResultado(formulario, 'Dê nome e valor válido a cada despesa e informe ao menos uma pessoa.', true);
        return;
      }
      const itens = [...formulario.querySelectorAll('.linha-despesa')].map((item) => {
        const nome = item.querySelector('[name="nomeDespesa"]').value.trim();
        const valor = item.querySelector('[name="valorDespesa"]').valueAsNumber;
        return `${nome}: ${moeda(valor)}`;
      });
      mensagem = `${itens.join(' · ')}\nTotal: ${moeda(total)}\nCada pessoa paga: ${moeda(total / pessoas)}`;
      break;
    }
    default:
      mostrarResultado(formulario, 'Não foi possível identificar essa ferramenta.', true);
      return;
  }
  mostrarResultado(formulario, mensagem);
}

document.querySelectorAll('.formulario').forEach((formulario) => {
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    executarCalculo(formulario);
  });
});

function selecionarFerramenta(nome, rolar = false) {
  document.querySelectorAll('.aba').forEach((aba) => {
    const selecionada = aba.dataset.ferramenta === nome;
    aba.classList.toggle('ativa', selecionada);
    aba.setAttribute('aria-selected', String(selecionada));
    aba.tabIndex = selecionada ? 0 : -1;
  });
  document.querySelectorAll('.painel-ferramenta').forEach((painel) => {
    const selecionado = painel.id === `painel-${nome}`;
    painel.classList.toggle('ativa', selecionado);
    painel.hidden = !selecionado;
  });
  if (rolar) document.querySelector('#ferramentas').scrollIntoView({ behavior: 'smooth' });
}

document.querySelectorAll('.aba').forEach((aba) => {
  aba.addEventListener('click', () => selecionarFerramenta(aba.dataset.ferramenta));
  aba.addEventListener('keydown', (evento) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(evento.key)) return;
    evento.preventDefault();
    const abas = [...document.querySelectorAll('.aba')];
    const atual = abas.indexOf(aba);
    const passo = evento.key === 'ArrowRight' ? 1 : -1;
    const proxima = abas[(atual + passo + abas.length) % abas.length];
    selecionarFerramenta(proxima.dataset.ferramenta);
    proxima.focus();
  });
});

document.querySelectorAll('[data-abrir]').forEach((botao) => {
  botao.addEventListener('click', () => selecionarFerramenta(botao.dataset.abrir, true));
});

document.querySelector('[data-adicionar-despesa]').addEventListener('click', (evento) => {
  const formulario = evento.currentTarget.closest('form');
  const lista = formulario.querySelector('[data-lista-despesas]');
  const linha = document.createElement('div');
  linha.className = 'linha-despesa';
  linha.innerHTML = '<label>Nome da despesa<input name="nomeDespesa" type="text" placeholder="Ex.: Transporte" required></label><label>Valor (R$)<input name="valorDespesa" type="number" min="0" step="0.01" placeholder="Ex.: 25,00" required></label><button class="remover-despesa" type="button" aria-label="Remover despesa">×</button>';
  lista.append(linha);
  formulario.querySelector('.resultado').classList.add('vazio');
  formulario.querySelector('.resultado').textContent = 'Adicione as despesas e informe o número de pessoas.';
});

document.querySelector('[data-lista-despesas]').addEventListener('click', (evento) => {
  if (!evento.target.matches('.remover-despesa')) return;
  const formulario = evento.target.closest('form');
  evento.target.closest('.linha-despesa').remove();
  formulario.querySelector('.resultado').classList.add('vazio');
  formulario.querySelector('.resultado').textContent = 'Adicione as despesas e informe o número de pessoas.';
});

function pedirNumero(mensagem) {
  const resposta = prompt(mensagem);
  if (resposta === null) return null;
  const texto = resposta.trim().replace(',', '.');
  if (!texto || !Number.isFinite(Number(texto))) {
    alert('Digite um número válido.');
    return NaN;
  }
  return Number(texto);
}

function executarPrompt(nome) {
  switch (nome) {
    case 'desconto': {
      const preco = pedirNumero('Preço original do produto (R$):');
      if (preco === null || Number.isNaN(preco)) return;
      const percentual = pedirNumero('Percentual de desconto (%):');
      if (percentual === null || Number.isNaN(percentual)) return;
      if (preco < 0 || percentual < 0 || percentual > 100) return alert('Informe um preço não negativo e um desconto entre 0% e 100%.');
      const resultado = calcularDesconto(preco, percentual);
      alert(`Preço original: ${moeda(preco)}\nDesconto: ${percentual}%\nEconomia: ${moeda(resultado.economia)}\nPreço final: ${moeda(resultado.precoFinal)}`);
      break;
    }
    case 'parcelas': {
      const total = pedirNumero('Valor total da compra (R$):');
      if (total === null || Number.isNaN(total)) return;
      const quantidade = pedirNumero('Quantidade de parcelas:');
      if (quantidade === null || Number.isNaN(quantidade)) return;
      if (total < 0 || !Number.isInteger(quantidade) || quantidade < 1) return alert('Informe um total não negativo e uma quantidade inteira de parcelas maior que zero.');
      alert(`Valor total: ${moeda(total)}\n${quantidade} parcela(s) de ${moeda(total / quantidade)}, sem juros.`);
      break;
    }
    case 'investimento': {
      const inicial = pedirNumero('Valor inicial do investimento (R$):');
      if (inicial === null || Number.isNaN(inicial)) return;
      const aporte = pedirNumero('Aporte mensal (R$):');
      if (aporte === null || Number.isNaN(aporte)) return;
      const taxa = pedirNumero('Rendimento mensal (%):');
      if (taxa === null || Number.isNaN(taxa)) return;
      const meses = pedirNumero('Período do investimento (meses):');
      if (meses === null || Number.isNaN(meses)) return;
      if ([inicial, aporte, taxa].some((valor) => valor < 0) || !Number.isInteger(meses) || meses < 1) return alert('Use valores não negativos e um período inteiro de pelo menos um mês.');
      const resultado = simularInvestimento(inicial, aporte, taxa, meses);
      alert(`Saldo final: ${moeda(resultado.saldoFinal)}\nTotal investido: ${moeda(resultado.totalInvestido)}\nRendimento: ${moeda(resultado.rendimento)}`);
      break;
    }
    case 'despesas': {
      let total = 0;
      let valor = 0;
      const despesas = [];
      do {
        const nomeDespesa = prompt('Nome da despesa (digite 0 no valor para encerrar):');
        if (nomeDespesa === null) return;
        valor = pedirNumero(`Valor de "${nomeDespesa || 'despesa'}" (R$), ou 0 para encerrar:`);
        if (valor === null || Number.isNaN(valor)) return;
        if (valor < 0) {
          alert('A despesa não pode ser negativa.');
        } else if (valor > 0 && !nomeDespesa.trim()) {
          alert('Digite um nome para a despesa.');
        } else if (valor > 0) {
          despesas.push(`${nomeDespesa.trim()}: ${moeda(valor)}`);
          total += valor;
        }
      } while (valor !== 0);
      const pessoas = pedirNumero('Quantas pessoas vão dividir as despesas?');
      if (pessoas === null || Number.isNaN(pessoas)) return;
      if (!Number.isInteger(pessoas) || pessoas < 1) return alert('Informe uma quantidade inteira de pessoas maior que zero.');
      alert(`${despesas.join('\n') || 'Nenhuma despesa informada.'}\nTotal: ${moeda(total)}\nCada pessoa paga: ${moeda(total / pessoas)}`);
      break;
    }
    default:
      alert('Escolha uma ferramenta válida.');
  }
}

document.querySelector('#modo-prompt').addEventListener('click', () => {
  const escolha = prompt('Central de Utilidades\n\n1 - Calculadora de descontos\n2 - Calculadora de parcelas\n3 - Simulador de investimentos\n4 - Divisor de despesas\n\nDigite o número da ferramenta:');
  if (escolha === null) return;
  const ferramentas = { '1': 'desconto', '2': 'parcelas', '3': 'investimento', '4': 'despesas' };
  executarPrompt(ferramentas[escolha.trim()]);
});
