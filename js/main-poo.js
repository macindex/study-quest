// js/main-poo.js - Versão CSP-Safe para POO
let questions = [];
let countQuestions = 0;
let actualQuestion = { id: 0 };
let answers = [];
let shuffledQuestions = [];
let stats = {
    correct: 0,
    incorrect: 0,
    unanswered: 0
};

// Carrega questões de POO
// No js/main-poo.js, modifique apenas esta função:
async function loadQuestions() {
    try {
        console.log('Carregando questões de POO...');
        const response = await fetch('qpoo.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        questions = data.questoes || data.questions;
        
        console.log(`Carregadas ${questions.length} questões de POO`);
        
        // Resto do código igual...
        shuffledQuestions = processAndShuffleQuestions(questions);
        stats.unanswered = shuffledQuestions.length;
        createStatsContainer();
        getQuestion(0);
        initializeEventListeners();
        
    } catch (error) {
        console.error('Erro ao carregar questões de POO:', error);
        const questaoElement = document.getElementById('questao');
        if (questaoElement) {
            questaoElement.innerHTML = 
                'Erro ao carregar questões de POO. Verifique se o arquivo qpoo.json existe.';
        }
    }
}

// Função para embaralhar array (CSP-Safe)
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Processa e embaralha questões
function processAndShuffleQuestions(originalQuestions) {
    return originalQuestions.map(question => {
        const letrasFixas = ['A', 'B', 'C', 'D', 'E'];
        const originalCorrectIndex = question.alternativas.findIndex(alt => alt.correta === true);
        const originalCorrectAlternative = question.alternativas[originalCorrectIndex];
        
        const alternativasSemLetras = question.alternativas.map(alt => ({
            texto: alt.texto,
            correta: alt.correta
        }));
        
        const shuffledContent = shuffleArray(alternativasSemLetras);
        
        const shuffledAlternatives = letrasFixas.map((letra, index) => {
            if (index < shuffledContent.length) {
                return {
                    letra: letra,
                    texto: shuffledContent[index].texto,
                    correta: shuffledContent[index].correta
                };
            }
            return question.alternativas[index] || { letra: letra, texto: '', correta: false };
        });
        
        const newCorrectIndex = shuffledAlternatives.findIndex(alt => 
            alt.texto === originalCorrectAlternative.texto && 
            alt.correta === true
        );
        
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

function updateStatsDisplay() {
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
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

function createStatsContainer() {
    updateStatsDisplay();
}

function clearRadios() {
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.checked = false;
    });
}

function getQuestion(i) {
    if (i < 0 || i >= shuffledQuestions.length) return;
    
    // Mostrar todas as alternativas primeiro
    for (let x = 0; x < 5; x++) {
        const altElement = document.getElementById(`alternative${x}`).parentElement.parentElement;
        altElement.classList.remove('d-none');
    }
    
    const totalAlternatives = shuffledQuestions[i].alternativas.length;
    clearRadios();
    
    const titleSpan = document.getElementById('numQuestion');
    titleSpan.innerHTML = "Questão POO " + shuffledQuestions[i].id;
    
    const questionText = document.getElementById('questao');
    questionText.innerHTML = shuffledQuestions[i].pergunta;
    
    // Preencher as alternativas
    shuffledQuestions[i].alternativas.forEach((alternative, x) => {
        const altElement = document.getElementById(`alternative${x}`);
        if (altElement) {
            altElement.textContent = alternative.letra + ". " + alternative.texto;
        }
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
    
    // Resetar os botões de solução
    resetSolutionButtons();
    
    // Atualizar estado dos botões de navegação
    updateNavigationButtons();
    
    // Restaurar resposta selecionada se existir
    const userAnswer = answers.find(ans => ans.id === shuffledQuestions[i].id);
    if (userAnswer) {
        const radio = document.getElementById(`q${userAnswer.selected}`);
        if (radio) {
            radio.checked = true;
        }
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!prevBtn || !nextBtn) return;
    
    // Botão Anterior
    if (countQuestions === 0) {
        prevBtn.disabled = true;
        prevBtn.classList.remove("btn-success");
        prevBtn.classList.add("btn-secondary");
    } else {
        prevBtn.disabled = false;
        prevBtn.classList.remove("btn-secondary");
        prevBtn.classList.add("btn-success");
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
    } else {
        nextBtn.textContent = 'Próxima';
        nextBtn.classList.remove("btn-danger", "btn-secondary");
        nextBtn.classList.add("btn-success");
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

function initializeEventListeners() {
    // Event listeners para os radios
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        radio.addEventListener('click', function() {
            const radioId = this.id.split('')[1];
            addQuestionsToAnswerArray({ id: actualQuestion.id, selected: parseInt(radioId) });
        });
    });

    // Event listeners para clique nas alternativas
    const choiceItems = document.querySelectorAll('.multi-choice-item');
    choiceItems.forEach(item => {
        item.addEventListener('click', function() {
            const radioInput = this.querySelector('input[type="radio"]');
            if (radioInput) {
                radioInput.checked = true;
                const radioId = radioInput.id.split('')[1];
                addQuestionsToAnswerArray({ id: actualQuestion.id, selected: parseInt(radioId) });
                
                // Disparar evento change
                const changeEvent = new Event('change', { bubbles: true });
                radioInput.dispatchEvent(changeEvent);
            }
        });
    });

    // Botão Anterior
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (countQuestions > 0) {
                countQuestions -= 1;
                getQuestion(countQuestions);
                resetSolutionButtons();
            }
        });
    }

    // Botão Próxima
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
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

    // Botão Revelar Solução
    const revealBtn = document.getElementById('revealSolutionBtn');
    if (revealBtn) {
        revealBtn.addEventListener('click', showSolution);
    }

    // Botão Ocultar Solução
    const hideBtn = document.getElementById('hideSolutionBtn');
    if (hideBtn) {
        hideBtn.addEventListener('click', hideSolution);
    }

    // Botão Reset Estatísticas
    const resetBtn = document.getElementById('resetStatsBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetStats);
    }
}

function showSolution() {
    const hideBtn = document.getElementById('hideSolutionBtn');
    const revealBtn = document.getElementById('revealSolutionBtn');
    
    if (hideBtn) hideBtn.classList.remove('d-none');
    if (revealBtn) revealBtn.classList.add('d-none');
    
    // Encontrar a alternativa correta
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
                item.classList.add('correct-choice');
            } else if (index === userSelectedIndex && index !== correctIndex) {
                item.classList.add('incorrect-choice');
            }
        }
    });
    
    updateStatsAfterReveal();
}

function hideSolution() {
    const hideBtn = document.getElementById('hideSolutionBtn');
    const revealBtn = document.getElementById('revealSolutionBtn');
    
    if (revealBtn) revealBtn.classList.remove('d-none');
    if (hideBtn) hideBtn.classList.add('d-none');
    
    // Remover cores das alternativas
    const listItems = document.querySelectorAll('.multi-choice-item');
    listItems.forEach(item => {
        item.classList.remove('correct-choice', 'incorrect-choice');
    });
}

function resetSolutionButtons() {
    const hideBtn = document.getElementById('hideSolutionBtn');
    const revealBtn = document.getElementById('revealSolutionBtn');
    
    if (revealBtn) revealBtn.classList.remove('d-none');
    if (hideBtn) hideBtn.classList.add('d-none');
    
    // Remover cores das alternativas
    const listItems = document.querySelectorAll('.multi-choice-item');
    listItems.forEach(item => {
        item.classList.remove('correct-choice', 'incorrect-choice');
    });
}

function updateStatsAfterReveal() {
    stats = { correct: 0, incorrect: 0, unanswered: 0 };

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

function resetStats() {
    answers = [];
    stats = {
        correct: 0,
        incorrect: 0,
        unanswered: shuffledQuestions.length
    };
    
    updateStatsDisplay();
    clearRadios();
    getQuestion(countQuestions);
    
    // Mostrar mensagem de confirmação
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info alert-dismissible fade show';
    alertDiv.innerHTML = `
        Estatísticas de POO zeradas com sucesso!
        <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
        </button>
    `;
    
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
    
    // Atualizar o modal
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = `
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
    }
    
    // Abrir o modal
    const modal = new bootstrap.Modal(document.getElementById('exampleModal'));
    modal.show();
    
    return percentage;
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    loadQuestions();
});