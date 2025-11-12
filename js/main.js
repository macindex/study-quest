// js/main.js
// Variáveis globais para armazenar as questões
let questions = [];
let countQuestions = 0;
let actualQuestion = { id: 0 };
let answers = [];
let shuffledQuestions = []; // Array para armazenar as questões com alternativas embaralhadas
let stats = {
    correct: 0,
    incorrect: 0,
    unanswered: 0
};

// NOVA VARIÁVEL: Para controlar qual arquivo JSON carregar
let currentQuestionFile = 'questions.json'; // Padrão

// NOVA FUNÇÃO: Detectar qual arquivo JSON carregar baseado na URL
function detectQuestionFile() {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('quest-drap.html') || currentPage.includes('questoes-drap.html')) {
        return 'questions.json';
    } else if (currentPage.includes('quest-poo.html') || currentPage.includes('questoes-poo.html')) {
        return 'qpoo.json';
    } else {
        return 'questions.json'; // Padrão
    }
}

// MODIFICADA: Função para carregar questões do arquivo JSON
async function loadQuestions() {
    try {
        // Determinar qual arquivo carregar baseado na página atual
        currentQuestionFile = detectQuestionFile();
        
        const response = await fetch(currentQuestionFile);
        const data = await response.json();
        questions = data.questoes || data.questions; // Suporte para ambos os formatos
        
        // Embaralhar as alternativas de todas as questões
        shuffledQuestions = processAndShuffleQuestions(questions);
        
        // Atualizar título da página
        if (data.titulo) {
            document.title = data.titulo + " | ExamTopics";
        }
        
        // Inicializar estatísticas com todas as questões como não respondidas
        stats.unanswered = shuffledQuestions.length;
        
        // Criar container de estatísticas
        createStatsContainer();
        
        // Inicializar a primeira questão
        getQuestion(0);
    } catch (error) {
        console.error('Erro ao carregar questões:', error);
        // Fallback: tentar carregar o arquivo alternativo
        if (currentQuestionFile === 'questions.json') {
            console.log('Tentando carregar qpoo.json como fallback...');
            currentQuestionFile = 'qpoo.json';
            loadQuestions(); // Recursão para tentar o outro arquivo
        } else if (currentQuestionFile === 'qpoo.json') {
            console.log('Tentando carregar questions.json como fallback...');
            currentQuestionFile = 'questions.json';
            loadQuestions(); // Recursão para tentar o outro arquivo
        }
    }
}

// Função para embaralhar array (Algoritmo Fisher-Yates)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// ATUALIZAR a função updateStatsDisplay para não recriar o botão:
function updateStatsDisplay() {
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
        // Atualizar apenas as estatísticas, mantendo o botão existente
        const statsDisplay = statsContainer.querySelector('.stats-display');
        if (statsDisplay) {
            statsDisplay.innerHTML = `
                <span class="stat-correct">✓ ${stats.correct}</span>
                <span class="stat-incorrect">✗ ${stats.incorrect}</span>
                <span class="stat-unanswered">? ${stats.unanswered}</span>
            `;
        }
    }
}

// NOVA FUNÇÃO: Permitir clique em toda a área da alternativa
function initializeChoiceClickEvents() {
    // Seleciona todos os itens de múltipla escolha
    const choiceItems = document.querySelectorAll('.multi-choice-item');
    
    choiceItems.forEach(item => {
        // Remove event listener anterior se existir para evitar duplicação
        item.removeEventListener('click', handleChoiceClick);
        // Adiciona o event listener para clique
        item.addEventListener('click', handleChoiceClick);
    });
}

// Função para lidar com o clique na alternativa
function handleChoiceClick(event) {
    // Encontra o input radio dentro do item clicado
    const radioInput = this.querySelector('input[type="radio"]');
    
    // Se encontrou um radio input
    if (radioInput) {
        // Marca o radio como selecionado
        radioInput.checked = true;
        
        // Dispara o evento change no radio para garantir que outras funções sejam notificadas
        const changeEvent = new Event('change', { bubbles: true });
        radioInput.dispatchEvent(changeEvent);
        
        // Dispara o evento click no radio também
        const clickEvent = new Event('click', { bubbles: true });
        radioInput.dispatchEvent(clickEvent);
        
        // Obtém o ID do radio para salvar a resposta
        const radioId = radioInput.id.split('')[1];
        addQuestionsToAnswerArray({ 
            id: actualQuestion.id, 
            selected: parseInt(radioId) 
        });
    }
}

// ATUALIZADA: Função para melhorar o estilo visual das alternativas clicáveis
function enhanceChoiceItemsStyle() {
    const choiceItems = document.querySelectorAll('.multi-choice-item');
    
    choiceItems.forEach(item => {
        // Adiciona estilo de cursor pointer
        item.style.cursor = 'pointer';
        
        // Adiciona efeito visual ao passar o mouse
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fa';
            this.style.transition = 'background-color 0.2s ease';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        
        // Adiciona efeito visual ao clicar
        item.addEventListener('mousedown', function() {
            this.style.backgroundColor = '#e9ecef';
        });
        
        item.addEventListener('mouseup', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
    });
}

// NOVA FUNÇÃO: Atualizar estatísticas apenas para questões com solução revelada
function updateStatsAfterReveal() {
    stats = {
        correct: 0,
        incorrect: 0,
        unanswered: 0
    };

    shuffledQuestions.forEach(question => {
        const userAnswer = answers.find(ans => ans.id === question.id);
        
        if (!userAnswer) {
            stats.unanswered++;
            return;
        }

        const correctIndex = question.alternativas.findIndex(alt => alt.correta === true);
        
        if (userAnswer.selected === correctIndex) {
            stats.correct++;
        } else {
            stats.incorrect++;
        }
    });

    updateStatsDisplay();
}

// NOVA FUNÇÃO: Zerar todas as estatísticas e respostas
function resetStats() {
    // Zerar o array de respostas
    answers = [];
    
    // Zerar as estatísticas
    stats = {
        correct: 0,
        incorrect: 0,
        unanswered: shuffledQuestions.length
    };
    
    // Atualizar o display das estatísticas
    updateStatsDisplay();
    
    // Limpar a seleção atual da questão
    clearRadios();
    
    // Recarregar a questão atual para refletir o reset
    getQuestion(countQuestions);
    
    // Mostrar mensagem de confirmação
    showResetConfirmation();
}

// NOVA FUNÇÃO: Mostrar confirmação de reset
function showResetConfirmation() {
    // Criar um alerta temporário
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info alert-dismissible fade show';
    alertDiv.innerHTML = `
        Estatísticas zeradas com sucesso!
        <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
        </button>
    `;
    
    // Inserir antes do container de estatísticas
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer && statsContainer.parentNode) {
        statsContainer.parentNode.insertBefore(alertDiv, statsContainer);
    }
    
    // Remover o alerta após 3 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
}

// NOVA FUNÇÃO: Resetar os botões de solução para o estado inicial
function resetSolutionButtons() {
    document.querySelector('.reveal-solution').classList.remove('d-none');
    document.querySelector('.hide-solution').classList.add('d-none');
    
    // Remover cores das alternativas
    const listItems = document.querySelectorAll('.multi-choice-item');
    listItems.forEach(item => {
        item.classList.remove('correct-choice', 'incorrect-choice');
    });
}

// ATUALIZAR a função createStatsContainer para usar o HTML existente:
function createStatsContainer() {
    // Verificar se o container já existe no HTML
    let statsContainer = document.getElementById('stats-container');
    
    if (!statsContainer) {
        // Criar apenas se não existir (fallback)
        statsContainer = document.createElement('div');
        statsContainer.id = 'stats-container';
        statsContainer.className = 'stats-container';
        statsContainer.innerHTML = `
            <div class="stats-content">
                <div class="stats-display">
                    <span class="stat-correct">✓ 0</span>
                    <span class="stat-incorrect">✗ 0</span>
                    <span class="stat-unanswered">? 0</span>
                </div>
            </div>
            <button id="resetStatsBtn" class="btn btn-warning btn-sm reset-stats-btn" 
                    onclick="resetStats()" title="Zerar todas as respostas e estatísticas" 
                    data-toggle="tooltip">
                ↻ Zerar Estatísticas
            </button>
        `;
        
        // Inserir antes dos botões de navegação
        const navigationContainer = document.querySelector('.navigation-buttons-container');
        if (navigationContainer && navigationContainer.parentNode) {
            navigationContainer.parentNode.insertBefore(statsContainer, navigationContainer);
        }
    }
    
    updateStatsDisplay();
    // Inicializar tooltips se jQuery estiver disponível
    if (typeof $ !== 'undefined') {
        $('#resetStatsBtn').tooltip();
    }
}

// ATUALIZADA: Função para processar e embaralhar as questões mantendo as letras fixas
function processAndShuffleQuestions(originalQuestions) {
    return originalQuestions.map(question => {
        // Criar um array com as letras fixas
        const letrasFixas = ['A', 'B', 'C', 'D', 'E'];
        
        // Encontrar a alternativa correta original
        const originalCorrectIndex = question.alternativas.findIndex(alt => alt.correta === true);
        const originalCorrectAlternative = question.alternativas[originalCorrectIndex];
        
        // Embaralhar apenas o conteúdo das alternativas (mantendo a ordem das letras)
        const alternativasSemLetras = question.alternativas.map(alt => ({
            texto: alt.texto,
            correta: alt.correta
        }));
        
        const shuffledContent = shuffleArray(alternativasSemLetras);
        
        // Reconstruir as alternativas com as letras fixas na ordem A, B, C, D, E
        const shuffledAlternatives = letrasFixas.map((letra, index) => {
            // Se existir conteúdo embaralhado para esta posição, usar ele
            if (index < shuffledContent.length) {
                return {
                    letra: letra,
                    texto: shuffledContent[index].texto,
                    correta: shuffledContent[index].correta
                };
            }
            // Caso contrário, manter a alternativa original (se existir)
            return question.alternativas[index] || { letra: letra, texto: '', correta: false };
        });
        
        // Encontrar a nova posição da alternativa correta
        const newCorrectIndex = shuffledAlternatives.findIndex(alt => 
            alt.texto === originalCorrectAlternative.texto && 
            alt.correta === true
        );
        
        // Garantir que apenas uma alternativa seja marcada como correta
        shuffledAlternatives.forEach((alt, index) => {
            alt.correta = (index === newCorrectIndex);
        });
        
        return {
            ...question,
            alternativas: shuffledAlternatives,
            originalCorrectIndex: originalCorrectIndex,
            shuffledCorrectIndex: newCorrectIndex
        };
    });
}

function clearRadios() {
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.checked = false;
    });
}

function getQuestion(i) {
    // Mostrar todas as alternativas primeiro
    for (let x = 0; x < 5; x++) {
        const altElement = document.getElementById(`alternative${x}`).parentElement.parentElement;
        altElement.classList.remove('d-none');
    }
    
    const totalAlternatives = shuffledQuestions[i].alternativas.length;
    clearRadios();
    
    const titleSpan = document.getElementById('numQuestion');
    titleSpan.innerHTML = "Questão " + shuffledQuestions[i].id;
    
    const questionText = document.getElementById('questao');
    questionText.innerHTML = shuffledQuestions[i].pergunta;
    
    // Preencher as alternativas (agora embaralhadas mas com letras fixas)
    shuffledQuestions[i].alternativas.forEach((alternative, x) => {
        const altElement = document.getElementById(`alternative${x}`);
        altElement.textContent = alternative.letra + ". " + alternative.texto;
    });
    
    // Esconder alternativas extras que não são usadas
    for (let x = totalAlternatives; x < 5; x++) {
        const altElement = document.getElementById(`alternative${x}`).parentElement.parentElement;
        altElement.classList.add('d-none');
    }
    
    actualQuestion.id = shuffledQuestions[i].id;
    
    // Limpar as classes de cor
    const listItems = document.querySelectorAll('.multi-choice-item');
    listItems.forEach(item => {
        item.classList.remove('correct-choice', 'incorrect-choice');
    });
    
    // ATUALIZAÇÃO: Resetar os botões de solução ao carregar nova questão
    resetSolutionButtons();
    
    // ATUALIZAÇÃO: Inicializar eventos de clique nas alternativas
    setTimeout(() => {
        initializeChoiceClickEvents();
        enhanceChoiceItemsStyle();
    }, 50);
    
    // Atualizar estado dos botões de navegação
    updateNavigationButtons();
    
    // Restaurar resposta selecionada se existir
    if (answers[i] && shuffledQuestions[i].id === answers[i].id) {
        const radio = document.getElementById(`q${answers[i].selected}`);
        if (radio) {
            radio.checked = true;
        }
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // Botão Anterior
    if (countQuestions === 0) {
        prevBtn.classList.remove("btn-success");
        prevBtn.classList.add("btn-secondary");
        prevBtn.disabled = true;
    } else {
        prevBtn.classList.remove("btn-secondary");
        prevBtn.classList.add("btn-success");
        prevBtn.disabled = false;
    }
    
    // Botão Próxima
    if (countQuestions === shuffledQuestions.length - 1) {
        nextBtn.textContent = 'Concluir';
        nextBtn.classList.remove("btn-success");
        nextBtn.classList.add("btn-danger");
    } else if (countQuestions >= shuffledQuestions.length) {
        nextBtn.textContent = 'Ver Resultado';
        nextBtn.classList.remove("btn-success");
        nextBtn.classList.add("btn-danger");
        nextBtn.setAttribute('data-toggle', 'modal');
        nextBtn.setAttribute('data-target', '#exampleModal');
    } else {
        nextBtn.textContent = 'Próxima';
        nextBtn.classList.remove("btn-danger", "btn-secondary");
        nextBtn.classList.add("btn-success");
        nextBtn.removeAttribute('data-toggle');
        nextBtn.removeAttribute('data-target');
        nextBtn.disabled = false;
    }
}

function addQuestionsToAnswerArray(questionSelected) {
    const existingIndex = answers.findIndex(q => q.id === questionSelected.id);
    if (existingIndex === -1) {
        answers.push(questionSelected);
    } else {
        answers[existingIndex] = questionSelected;
    }
}

// Usando jQuery quando disponível, caso contrário usa JavaScript vanilla
function initializeEventListeners() {
    // Event listeners para os radios (mantido para compatibilidade)
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.addEventListener('click', function() {
            const radioId = this.id.split('')[1];
            addQuestionsToAnswerArray({ id: actualQuestion.id, selected: parseInt(radioId) });
        });
    });

    // ATUALIZAÇÃO: Inicializar eventos de clique nas alternativas
    initializeChoiceClickEvents();
    enhanceChoiceItemsStyle();

    // Event listeners para os botões de navegação
    document.getElementById('prevBtn').addEventListener('click', function() {
        if (countQuestions > 0) {
            countQuestions -= 1;
            getQuestion(countQuestions);
            resetSolutionButtons();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', function() {
        if (countQuestions < shuffledQuestions.length - 1) {
            countQuestions += 1;
            getQuestion(countQuestions);
            resetSolutionButtons();
        } else if (countQuestions === shuffledQuestions.length - 1) {
            countQuestions += 1;
            updateNavigationButtons();
        } else if (countQuestions >= shuffledQuestions.length) {
            calculateFinalResults();
        }
    });
}

// Função alternativa usando jQuery se disponível
function initializeWithJQuery() {
    if (typeof $ !== 'undefined') {
        // Mantém o evento original nos radios
        $('input:radio').click(function () {
            const radioId = $(this).attr('id').split('')[1];
            addQuestionsToAnswerArray({ id: actualQuestion.id, selected: parseInt(radioId) });
        });

        // ATUALIZAÇÃO: Evento de clique nas alternativas com jQuery
        $('.multi-choice-item').off('click').on('click', function() {
            const radioInput = $(this).find('input[type="radio"]');
            if (radioInput.length > 0) {
                radioInput.prop('checked', true);
                const radioId = radioInput.attr('id').split('')[1];
                addQuestionsToAnswerArray({ id: actualQuestion.id, selected: parseInt(radioId) });
            }
        });

        // Estilo com jQuery
        $('.multi-choice-item').css('cursor', 'pointer')
            .hover(
                function() { $(this).css('background-color', '#f8f9fa'); },
                function() { $(this).css('background-color', ''); }
            );

        // Restante do código permanece igual...
        $('#prevBtn').click(function () {
            if (countQuestions > 0) {
                countQuestions -= 1;
                getQuestion(countQuestions);
                resetSolutionButtons();
            }
        });

        $('#nextBtn').click(function () {
            if (countQuestions < shuffledQuestions.length - 1) {
                countQuestions += 1;
                getQuestion(countQuestions);
                resetSolutionButtons();
            } else if (countQuestions === shuffledQuestions.length - 1) {
                countQuestions += 1;
                updateNavigationButtons();
            } else if (countQuestions >= shuffledQuestions.length) {
                calculateFinalResults();
            }
        });
    } else {
        initializeEventListeners();
    }
}

// Modificar a função showSolution para também atualizar estatísticas
function showSolution() {
    document.querySelector('.hide-solution').classList.remove('d-none');
    
    // Encontrar a alternativa correta para a questão atual (nas alternativas embaralhadas)
    const currentQuestion = shuffledQuestions[countQuestions];
    const correctIndex = currentQuestion.alternativas.findIndex(alt => alt.correta === true);
    
    // Encontrar a alternativa selecionada pelo usuário
    const userAnswer = answers.find(ans => ans.id === currentQuestion.id);
    const userSelectedIndex = userAnswer ? userAnswer.selected : -1;
    
    // Aplicar cores às alternativas
    const listItems = document.querySelectorAll('.multi-choice-item');
    listItems.forEach((item, index) => {
        if (index < currentQuestion.alternativas.length) {
            if (index === correctIndex) {
                // Alternativa correta - verde
                item.classList.add('correct-choice');
            } else if (index === userSelectedIndex && index !== correctIndex) {
                // Alternativa selecionada pelo usuário mas incorreta - vermelho
                item.classList.add('incorrect-choice');
            }
        }
    });
    
    document.querySelector('.reveal-solution').classList.add('d-none');
    
    // ATUALIZAÇÃO: Atualizar estatísticas apenas quando a solução for revelada
    updateStatsAfterReveal();
}

// Modificar a função que calcula o resultado final
function calculateFinalResults() {
    const totalQuestions = shuffledQuestions.length;
    let totalCorrectAnswers = 0;
    
    shuffledQuestions.forEach(q => {
        q.alternativas.forEach((a, i) => {
            if (a.correta) {
                const questaoResolvida = answers.find(ans => ans.id === q.id);
                if (questaoResolvida?.selected === i) {
                    totalCorrectAnswers += 1;
                }
            }
        });
    });

    const percentage = Math.floor(totalCorrectAnswers / totalQuestions * 100);
    
    // Atualizar o modal com estatísticas detalhadas
    document.querySelector('.modal-body').innerHTML = `
        <div class="final-results">
            <div class="result-percentage">${percentage}%</div>
            <div class="result-stats">
                <div class="stat-item">
                    <span class="stat-label">Corretas:</span>
                    <span class="stat-value correct">${stats.correct}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Incorretas:</span>
                    <span class="stat-value incorrect">${stats.incorrect}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Não respondidas:</span>
                    <span class="stat-value unanswered">${stats.unanswered}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total:</span>
                    <span class="stat-value total">${totalQuestions}</span>
                </div>
            </div>
        </div>
    `;
    
    return percentage;
}

function hideSolution() {
    document.querySelector('.reveal-solution').classList.remove('d-none');
    
    // Remover cores das alternativas
    const listItems = document.querySelectorAll('.multi-choice-item');
    listItems.forEach(item => {
        item.classList.remove('correct-choice', 'incorrect-choice');
    });
    
    document.querySelector('.hide-solution').classList.add('d-none');
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Carregar questões do JSON
    loadQuestions();
    
    // Inicializar event listeners
    setTimeout(initializeWithJQuery, 100);
});