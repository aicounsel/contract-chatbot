// chat.js

// 1. Retrieve DocumentID from URL parameters
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
const documentId = getQueryParam('documentId') || 'default-doc-id';

// 2. For testing, define a sample questions array.
// In production, you'll want to fetch this from your GetQuestions endpoint via AJAX.
function fetchQuestions() {
  // Retrieve documentId from URL query parameters
  const documentId = getQueryParam('documentId');
  if (!documentId) {
    console.error("No documentId found in URL");
    appendBubble("Error: Document ID not provided.", "bot");
    return;
  }
  
  // Replace with your actual GetQuestions Flow endpoint URL
  const endpoint = "https://prod-32.westus.logic.azure.com:443/workflows/9f1f0ec63dd2496f82ad5d2392af37fe/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=N6wmNAfDyPA2mZFL9gr3LrKjl1KPvHZhgy7JM1yzvfk";
  
  const requestBody = {
    documentId: documentId
  };
  
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("Network response was not ok, status " + response.status);
    }
    return response.json();
  })
  .then(data => {
    // Expecting data to be in the format: { "questions": "[\"What is the date?\", \"What is the purchaser's name?\", ...]" }
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
    // Save fetched questions globally
    window.questions = fetchedQuestions;
    // Start the conversation by showing the first question
    currentQuestionIndex = 0; // Reset index if needed
    showNextQuestion();
  })
  .catch(error => {
    console.error("Error fetching questions:", error);
    appendBubble("Error fetching questions. Please try again later.", "bot");
  });
}

fetchQuestions();

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
