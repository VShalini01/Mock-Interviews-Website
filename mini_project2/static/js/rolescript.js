document.addEventListener('DOMContentLoaded', () => {
    const questionContainer = document.getElementById('question-container');
    const questionElement = document.getElementById('question');
    const answerElement = document.getElementById('answer');
    const nextButton = document.getElementById('next');
    const microphoneButton = document.getElementById('microphone');
    const resultContainer = document.getElementById('result-container');
    const resultsDiv = document.getElementById('results');

    const synth = window.speechSynthesis;

    let questions = [];
    let currentQuestionIndex = 0;
    let answers = [];
    let scores = []; // Renamed to scores for clarity

    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic');

    fetch('/static/rolequestions.json')
        .then(response => response.json())
        .then(data => {
            questions = data[topic];
            if (!questions) {
                console.error('Questions is undefined');
                return;
            }
            questions = getRandomQuestions(questions, 5); // Get 5 random questions
            displayQuestion();
        });

    nextButton.addEventListener('click', () => {
        const answer = answerElement.value;
        if (answer.trim() === '') {
            alert('Please provide an answer before moving to the next question.');
            return;
        }
        if (isRecording) {
            recognition.stop();
            isRecording = false;
            microphoneButton.textContent = '🎙';
        }
        
        answers.push(answer);
        
        evaluateAnswer(questions[currentQuestionIndex].optimal_answer, answer)
            .then(response => {
                // Store similarity score or "not a good answer"
                const similarityScore = answer.split(' ').length <= 6 ? "Not a good answer" : (response.similarity_score * 100).toFixed(2) + '%';
                scores.push(similarityScore);
                
                console.log('Similarity Score:', similarityScore);
                
                answerElement.value = '';
                finalTranscript = '';
                
                currentQuestionIndex++;
                if (currentQuestionIndex < questions.length) {
                    displayQuestion();
                } else {
                    showResults();
                }
            })
            .catch(error => {
                console.error('Error evaluating answer:', error);
            });
    });

    let isRecording = false;
    let recognition;
    let finalTranscript = '';

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += addPunctuation(event.results[i][0].transcript);
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            answerElement.value = finalTranscript + interimTranscript;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event);
        };

        recognition.onend = () => {
            isRecording = false;
            microphoneButton.textContent = '🎙️';
        };

        microphoneButton.addEventListener('click', () => {
            if (!isRecording) {
                recognition.start();
                isRecording = true;
                microphoneButton.textContent = '⏹';
            } else {
                recognition.stop();
                isRecording = false;
                microphoneButton.textContent = '🎙️';
            }
        });
    } else {
        microphoneButton.addEventListener('click', () => {
            alert('Speech recognition not supported in this browser.');
        });
    }

    function displayQuestion() {
        questionElement.textContent = questions[currentQuestionIndex].question;
        readAloud(questions[currentQuestionIndex].question);
    }

    function showResults() {
        questionContainer.style.display = 'none';
        resultContainer.style.display = 'block';
        resultsDiv.innerHTML = '';
    
        const table = document.createElement('table');
        table.classList.add('results-table');
    
        const headerRow = document.createElement('tr');
        const th1 = document.createElement('th');
        th1.textContent = 'Question';
        const th2 = document.createElement('th');
        th2.textContent = 'Your Answer';
        const th3 = document.createElement('th');
        th3.textContent = 'Optimal Answer';
        const th4 = document.createElement('th');
        th4.textContent = 'Evaluation Result';
        headerRow.appendChild(th1);
        headerRow.appendChild(th2);
        headerRow.appendChild(th3);
        headerRow.appendChild(th4);
        table.appendChild(headerRow);
    
        questions.forEach((item, index) => {
            const row = document.createElement('tr');
    
            const questionCell = document.createElement('td');
            questionCell.textContent = item.question;
            row.appendChild(questionCell);
    
            const userAnswerCell = document.createElement('td');
            userAnswerCell.textContent = answers[index];
            row.appendChild(userAnswerCell);
    
            const optimalAnswerCell = document.createElement('td');
            optimalAnswerCell.textContent = item.optimal_answer;
            row.appendChild(optimalAnswerCell);
    
            const evaluationResultCell = document.createElement('td');
            evaluationResultCell.textContent = scores[index];
            row.appendChild(evaluationResultCell);
    
            table.appendChild(row);
        });
    
        resultsDiv.appendChild(table);
    }

    function readAloud(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        synth.speak(utterance);
    }

    async function evaluateAnswer(optimalAnswer, userAnswer) {
        try {
            const response = await fetch('/similarity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ optimal_answer: optimalAnswer, user_answer: userAnswer })
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            
            console.log('Similarity Score:', data.similarity_score);
            
            return data;
        } catch (error) {
            console.error('Error evaluating answer:', error);
            return { result: 'Evaluation failed', similarity_score: 0 };
        }
    }
    
    function getRandomQuestions(array, n) {
        let result = new Array(n);
        let len = array.length;
        let taken = new Array(len);
        if (n > len)
            throw new RangeError("getRandomQuestions: more elements taken than available");
        while (n--) {
            let x = Math.floor(Math.random() * len);
            result[n] = array[x in taken ? taken[x] : x];
            taken[x] = --len in taken ? taken[len] : len;
        }
        return result;
    }

    function addPunctuation(transcript) {
        transcript = transcript.trim();
        if (transcript.length === 0) return transcript;

        const lastChar = transcript.charAt(transcript.length - 1);
        if (!/[.!?]/.test(lastChar)) {
            transcript += '.';
        }
        return transcript + ' ';
    }
});