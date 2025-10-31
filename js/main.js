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

// Função para processar e embaralhar as questões
function processAndShuffleQuestions(originalQuestions) {
    return originalQuestions.map(question => {
        // Encontrar a alternativa correta original
        const originalCorrectIndex = question.alternativas.findIndex(alt => alt.correta === true);
        const originalCorrectAlternative = question.alternativas[originalCorrectIndex];
        
        // Embaralhar as alternativas
        const shuffledAlternatives = shuffleArray(question.alternativas);
        
        // Encontrar a nova posição da alternativa correta
        const newCorrectIndex = shuffledAlternatives.findIndex(alt => 
            alt.letra === originalCorrectAlternative.letra && 
            alt.texto === originalCorrectAlternative.texto
        );
        
        // Atualizar a propriedade correta nas alternativas embaralhadas
        shuffledAlternatives.forEach((alt, index) => {
            alt.correta = (index === newCorrectIndex);
        });
        
        return {
            ...question,
            alternativas: shuffledAlternatives,
            originalCorrectIndex: originalCorrectIndex, // Guardar para referência se necessário
            shuffledCorrectIndex: newCorrectIndex // Nova posição da correta
        };
    });
}

// Carregar questões do arquivo JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        questions = data.questions;
        
        // Embaralhar as alternativas de todas as questões
        shuffledQuestions = processAndShuffleQuestions(questions);
        
        // Atualizar título da página
        document.title = data.titulo + " | ExamTopics";
        
        // Inicializar estatísticas com todas as questões como não respondidas
        stats.unanswered = shuffledQuestions.length;
        
        // Criar container de estatísticas
        createStatsContainer();
        
        // Inicializar a primeira questão
        getQuestion(0);
    } catch (error) {
        console.error('Erro ao carregar questões:', error);
    }
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
    
    // Preencher as alternativas (agora embaralhadas)
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
    // Event listeners para os radios
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.addEventListener('click', function() {
            const radioId = this.id.split('')[1];
            addQuestionsToAnswerArray({ id: actualQuestion.id, selected: parseInt(radioId) });
        });
    });

    // Event listeners para os botões de navegação
    document.getElementById('prevBtn').addEventListener('click', function() {
        if (countQuestions > 0) {
            countQuestions -= 1;
            getQuestion(countQuestions);
            // ATUALIZAÇÃO: Resetar botões de solução ao voltar para questão anterior
            resetSolutionButtons();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', function() {
        if (countQuestions < shuffledQuestions.length - 1) {
            countQuestions += 1;
            getQuestion(countQuestions);
            // ATUALIZAÇÃO: Resetar botões de solução ao avançar para próxima questão
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
        $('input:radio').click(function () {
            const radioId = $(this).attr('id').split('')[1];
            addQuestionsToAnswerArray({ id: actualQuestion.id, selected: parseInt(radioId) });
        });

        $('#prevBtn').click(function () {
            if (countQuestions > 0) {
                countQuestions -= 1;
                getQuestion(countQuestions);
                // ATUALIZAÇÃO: Resetar botões de solução ao voltar para questão anterior
                resetSolutionButtons();
            }
        });

        $('#nextBtn').click(function () {
            if (countQuestions < shuffledQuestions.length - 1) {
                countQuestions += 1;
                getQuestion(countQuestions);
                // ATUALIZAÇÃO: Resetar botões de solução ao avançar para próxima questão
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