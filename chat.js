// chat.js

// 1. Retrieve DocumentID from URL parameters
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
const documentId = getQueryParam('documentId') || 'default-doc-id';

// 2. For testing, define a sample questions array.
// In production, you'll want to fetch this from your GetQuestions endpoint via AJAX.
let questions = [
  "What is the date?",
  "What is the purchaser's name?",
  "What is the entity type?",
  "What is the jurisdiction?",
  "What is the address?"
];

// 3. Set up variables to track conversation state
let currentQuestionIndex = 0;
let answers = [];

// 4. Function to append a chat bubble
function appendBubble(text, type='bot') {
  const container = document.getElementById('chatContainer');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble' + (type === 'user' ? ' user' : '');
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight; // auto scroll
}

// 5. Function to show the next question
function showNextQuestion() {
  if (currentQuestionIndex < questions.length) {
    appendBubble(questions[currentQuestionIndex]);
  } else {
    appendBubble("Thank you! All questions answered.");
    // Optionally, trigger submission of answers here.
    submitAnswers();
  }
}

// 6. Set up the send button event
document.getElementById('sendButton').addEventListener('click', function() {
  const inputField = document.getElementById('userInput');
  const userText = inputField.value.trim();
  if (userText === "") return;
  appendBubble(userText, 'user');
  // Store answer with corresponding question
  answers.push({
    question: questions[currentQuestionIndex],
    answer: userText
  });
  currentQuestionIndex++;
  inputField.value = "";
  // Show the next question after a short delay
  setTimeout(showNextQuestion, 500);
});

// 7. Function to submit answers via AJAX to your endpoint
function submitAnswers() {
  // Build the payload
  const payload = {
    documentId: documentId,
    answers: answers
  };

  // For testing, we'll just log the payload
  console.log("Submitting payload:", payload);

  // Uncomment and update the URL below to call your endpoint:
  /*
  fetch('https://your-powerautomate-endpoint-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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

// 8. Start the conversation by showing the first question
showNextQuestion();
