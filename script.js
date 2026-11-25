// Central de Utilidades — cálculos feitos diretamente nos cartões da página.

const moeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function mostrarResultado(formulario, mensagem, erro = false) {
  const resultado = formulario.querySelector('.resultado');
  resultado.textContent = mensagem;
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
      mensagem = `Economia: ${moeda(resultado.economia)} · Preço final: ${moeda(resultado.precoFinal)}`;
      break;
    }
    case 'parcelas': {
      const total = numeroDoCampo(formulario, 'total');
      const quantidade = numeroDoCampo(formulario, 'quantidade');
      if (total === null || quantidade === null || total < 0 || !Number.isInteger(quantidade) || quantidade < 1) {
        mostrarResultado(formulario, 'Informe um valor válido e um número inteiro de parcelas maior que zero.', true);
        return;
      }
      mensagem = `${quantidade} parcela(s) de ${moeda(total / quantidade)} sem juros.`;
      break;
    }
    case 'investimento': {
      const inicial = numeroDoCampo(formulario, 'inicial');
      const aporte = numeroDoCampo(formulario, 'aporte');
      const taxa = numeroDoCampo(formulario, 'taxa');
      const meses = numeroDoCampo(formulario, 'meses');
      if ([inicial, aporte, taxa, meses].some((valor) => valor === null || valor < 0) || !Number.isInteger(meses) || meses < 1) {
        mostrarResultado(formulario, 'Preencha valores válidos. O período deve ser um número inteiro de meses.', true);
        return;
      }
      const resultado = simularInvestimento(inicial, aporte, taxa, meses);
      mensagem = `Saldo: ${moeda(resultado.saldoFinal)} · Investido: ${moeda(resultado.totalInvestido)} · Rendimento: ${moeda(resultado.rendimento)}`;
      break;
    }
    case 'despesas': {
      const total = calcularTotalDespesas(formulario);
      const pessoas = numeroDoCampo(formulario, 'pessoas');
      if (total === null || pessoas === null || !Number.isInteger(pessoas) || pessoas < 1) {
        mostrarResultado(formulario, 'Dê um nome e valor válido para cada despesa e informe ao menos uma pessoa.', true);
        return;
      }
      const itens = [...formulario.querySelectorAll('.linha-despesa')].map((item) => {
        const nome = item.querySelector('[name="nomeDespesa"]').value.trim();
        const valor = item.querySelector('[name="valorDespesa"]').valueAsNumber;
        return `${nome}: ${moeda(valor)}`;
      });
      mensagem = `${itens.join(' · ')}. Total: ${moeda(total)}. Cada pessoa paga ${moeda(total / pessoas)}.`;
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

document.querySelector('[data-adicionar-despesa]').addEventListener('click', (evento) => {
  const formulario = evento.currentTarget.closest('form');
  const lista = formulario.querySelector('[data-lista-despesas]');
  const linha = document.createElement('div');
  linha.className = 'linha-despesa';
  linha.innerHTML = '<label>Despesa<input name="nomeDespesa" type="text" placeholder="Ex.: Transporte" required></label><label>Valor (R$)<input name="valorDespesa" type="number" min="0" step="0.01" placeholder="Ex.: 25,00" required></label><button class="remover-despesa" type="button" aria-label="Remover despesa">×</button>';
  lista.append(linha);
  mostrarResultado(formulario, '');
});

document.querySelector('[data-lista-despesas]').addEventListener('click', (evento) => {
  if (!evento.target.matches('.remover-despesa')) return;
  const formulario = evento.target.closest('form');
  evento.target.closest('.linha-despesa').remove();
  mostrarResultado(formulario, '');
});
