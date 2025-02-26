// chat.js

// Global variables
let questions = []; // This will hold the fetched questions array
let currentQuestionIndex = 0;
let answers = [];

// 1. Retrieve DocumentID from URL parameters
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
const documentId = getQueryParam('documentId') || 'default-doc-id';

// 2. Function to fetch questions from your GetQuestions endpoint
function fetchQuestions() {
  const docId = getQueryParam('documentId');
  if (!docId) {
    console.error("No documentId found in URL");
    appendBubble("Error: Document ID not provided.", "bot");
    return;
  }
  
  // Replace with your actual GetQuestions Flow endpoint URL
  const endpoint = "https://prod-32.westus.logic.azure.com:443/workflows/9f1f0ec63dd2496f82ad5d2392af37fe/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=N6wmNAfDyPA2mZFL9gr3LrKjl1KPvHZhgy7JM1yzvfk";
  
  const requestBody = { documentId: docId };
  
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("Network response was not ok, status " + response.status);
    }
    return response.json();
  })
  .then(data => {
    // Expecting data in format: { "questions": "[\"Question1\",\"Question2\", ...]" }
    let fetchedQuestions;
    if (typeof data.questions === "string") {
      try {
        fetchedQuestions = JSON.parse(data.questions);
      } catch (e) {
        console.error("Error parsing questions string:", e);
        appendBubble("Error: Could not parse questions data.", "bot");
        return;
      }
    } else {
      fetchedQuestions = data.questions;
    }
    // Set the global questions variable
    questions = fetchedQuestions;
    currentQuestionIndex = 0;
    showNextQuestion();
  })
  .catch(error => {
    console.error("Error fetching questions:", error);
    appendBubble("Error fetching questions. Please try again later.", "bot");
  });
}

// 3. Function to append a chat bubble
function appendBubble(text, type='bot') {
  const container = document.getElementById('chatContainer');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble' + (type === 'user' ? ' user' : '');
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

// 4. Function to show the next question
function showNextQuestion() {
  if (currentQuestionIndex < questions.length) {
    appendBubble(questions[currentQuestionIndex]);
  } else {
    appendBubble("Thank you! All questions answered.");
    submitAnswers();
  }
}

// 5. Set up the send button event
document.getElementById('sendButton').addEventListener('click', function() {
  const inputField = document.getElementById('userInput');
  const userText = inputField.value.trim();
  if (userText === "") return;
  appendBubble(userText, 'user');
  answers.push({
    question: questions[currentQuestionIndex],
    answer: userText
  });
  currentQuestionIndex++;
  inputField.value = "";
  setTimeout(showNextQuestion, 500);
});

// 6. Function to submit answers via AJAX (for later use)
function submitAnswers() {
  const payload = { documentId: documentId, answers: answers };
  console.log("Submitting payload:", payload);
  // Uncomment and update endpoint URL to call your submission endpoint
  /*
  fetch('https://your-powerautomate-endpoint-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => {
    appendBubble("Submission successful: " + JSON.stringify(data));
  })
  .catch(error => {
    appendBubble("Error submitting answers.");
    console.error(error);
  });
  */
}

// 7. On page load, call fetchQuestions to dynamically get the questions
fetchQuestions();
