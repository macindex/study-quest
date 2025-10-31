// js/main.js
// Variáveis globais para armazenar as questões
let questions = [];
let countQuestions = 0;
let actualQuestion = { id: 0 };
let answers = [];

// Carregar questões do arquivo JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        questions = data.questions;
        // Atualizar título da página
        document.title = data.titulo + " | ExamTopics";
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
    
    const totalAlternatives = questions[i].alternativas.length;
    clearRadios();
    
    const titleSpan = document.getElementById('numQuestion');
    titleSpan.innerHTML = "Questão " + questions[i].id;
    
    const questionText = document.getElementById('questao');
    questionText.innerHTML = questions[i].pergunta;
    
    // Preencher as alternativas
    questions[i].alternativas.forEach((alternative, x) => {
        const altElement = document.getElementById(`alternative${x}`);
        altElement.textContent = alternative.letra + ". " + alternative.texto;
    });
    
    // Esconder alternativas extras que não são usadas
    for (let x = totalAlternatives; x < 5; x++) {
        const altElement = document.getElementById(`alternative${x}`).parentElement.parentElement;
        altElement.classList.add('d-none');
    }
    
    actualQuestion.id = questions[i].id;
    
    // REMOVIDO: Configurar a resposta correta oculta
    // Apenas limpar as classes de cor
    const listItems = document.querySelectorAll('.multi-choice-item');
    listItems.forEach(item => {
        item.classList.remove('correct-choice', 'incorrect-choice');
    });
    
    // Atualizar estado dos botões de navegação
    updateNavigationButtons();
    
    // Restaurar resposta selecionada se existir
    if (answers[i] && questions[i].id === answers[i].id) {
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
    if (countQuestions === questions.length - 1) {
        nextBtn.textContent = 'Concluir';
        nextBtn.classList.remove("btn-success");
        nextBtn.classList.add("btn-danger");
    } else if (countQuestions >= questions.length) {
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
            hideSolution();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', function() {
        if (countQuestions < questions.length - 1) {
            countQuestions += 1;
            getQuestion(countQuestions);
        } else if (countQuestions === questions.length - 1) {
            countQuestions += 1;
            updateNavigationButtons();
        } else if (countQuestions >= questions.length) {
            // Calcular resultado
            const totalQuestions = questions.length;
            let totalCorrectAnswers = 0;
            
            questions.forEach(q => {
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
            document.querySelector('.modal-body').textContent = percentage + '%';
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
                hideSolution();
            }
        });

        $('#nextBtn').click(function () {
            if (countQuestions < questions.length - 1) {
                countQuestions += 1;
                getQuestion(countQuestions);
            } else if (countQuestions === questions.length - 1) {
                countQuestions += 1;
                updateNavigationButtons();
            } else if (countQuestions >= questions.length) {
                // Calcular resultado
                const totalQuestions = questions.length;
                let totalCorrectAnswers = 0;
                
                questions.forEach(q => {
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
                $('.modal-body').text(percentage + '%');
            }
        });
    } else {
        initializeEventListeners();
    }
}

function showSolution() {
    document.querySelector('.hide-solution').classList.remove('d-none');
    
    // Encontrar a alternativa correta para a questão atual
    const currentQuestion = questions[countQuestions];
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