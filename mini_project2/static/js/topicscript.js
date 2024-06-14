document.addEventListener('DOMContentLoaded', () => {
    const questionContainer = document.getElementById('question-container');
    const questionElement = document.getElementById('question');
    const answerElement = document.getElementById('answer');
    const nextButton = document.getElementById('next');
    const microphoneButton = document.getElementById('microphone');
    const resultContainer = document.getElementById('result-container');
    const resultsTableBody = document.querySelector('#results tbody');

    const synth = window.speechSynthesis;

    let questions = [];
    let currentQuestionIndex = 0;
    let answers = [];

    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic');

    fetch('/static/topicquestions.json')
        .then(response => response.json())
        .then(data => {
            questions = data[topic];
            // Check if questions is undefined
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
                microphoneButton.textContent = '🎙️';
            }
            answers.push(answer);
            answerElement.value = '';
            finalTranscript = '';

        currentQuestionIndex++;
        if (currentQuestionIndex < 5) {
            displayQuestion();
        } else {
            showResults();
        }
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
                microphoneButton.textContent = '⏹️';
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

    async function showResults() {
        questionContainer.style.display = 'none';
        resultContainer.style.display = 'block';
        resultsTableBody.innerHTML = '';

        for (let index = 0; index < questions.length; index++) {
            const item = questions[index];
            const answer = answers[index];
            const similarityScore = await getSimilarityScore(answer, item.optimal_answer);

            const row = document.createElement('tr');

            const questionCell = document.createElement('td');
            questionCell.textContent = item.question;
            row.appendChild(questionCell);

            const userAnswerCell = document.createElement('td');
            userAnswerCell.textContent = answer;
            row.appendChild(userAnswerCell);

            const optimalAnswerCell = document.createElement('td');
            optimalAnswerCell.textContent = item.optimal_answer;
            row.appendChild(optimalAnswerCell);

            const similarityCell = document.createElement('td');
            similarityCell.textContent = `Similarity: ${(similarityScore * 100).toFixed(2)}%`;
            row.appendChild(similarityCell);

            resultsTableBody.appendChild(row);
        }
    }

    async function getSimilarityScore(userAnswer, optimalAnswer) {
        const response = await fetch('/similarity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_answer: userAnswer,
                optimal_answer: optimalAnswer
            })
        });

        const data = await response.json();
        return data.similarity_score;
    }

    function readAloud(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        synth.speak(utterance);
    }

    function getRandomQuestions(array, n) {
        // Check if array is undefined
        if (!array) {
            console.error('Array is undefined');
            return;
        }

        // If n is greater than the length of the array, set n to the length of the array
        if (n > array.length) {
            n = array.length;
        }
    
        let result = new Array(n);
        let len = array.length;
        let taken = new Array(len);
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
