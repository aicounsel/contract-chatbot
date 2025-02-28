// chat.js

// Global variables
let questions = []; // Will hold an array of { placeholder, question }
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
function appendBubble(text, type = 'bot') {
  const container = document.getElementById('chatContainer');

  // Create a message wrapper
  const messageWrapper = document.createElement('div');
  messageWrapper.className = 'message-wrapper ' + (type === 'user' ? 'user' : 'bot');

  // Create the label element
  const label = document.createElement('div');
  label.className = 'message-label';
  if (type === 'user') {
    label.textContent = "Client";
  } else {
    label.textContent = "Client Assistant";
  }

  // Create the bubble element
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (type === 'user' ? 'user' : 'bot');
  bubble.textContent = text;

  // Append label and bubble to the wrapper
  messageWrapper.appendChild(label);
  messageWrapper.appendChild(bubble);

  // Append the message wrapper to the chat container
  container.appendChild(messageWrapper);
  container.scrollTop = container.scrollHeight;
}


// 4. Function to show the next question
function showNextQuestion() {
  if (currentQuestionIndex < questions.length) {
    const questionObj = questions[currentQuestionIndex];
    appendBubble(questionObj.question, 'bot');
  } else {
    appendBubble("That was the last question! Please wait while we confirm your submission...", "bot");
    submitAnswers();
  }
}

// 6. Function to submit answers via AJAX
function submitAnswers() {
  const payload = {
    documentId: documentId,
    answers: answers
  };

  console.log("Submitting payload:", payload);

  const endpoint = "https://prod-167.westus.logic.azure.com:443/workflows/2e53afbe6c614ab59242a6a9078560e9/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FzgeCCHQZRloueUUzI_2RjRTLeRKbkKyey39u_kSUyI";

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("Network response was not ok, status " + response.status);
    }
    return response.json();
  })
  .then(data => {
    appendBubble("Success! You can now close this page.", "bot");
  })
  .catch(error => {
    appendBubble("Error submitting answers.", "bot");
    console.error(error);
  });
}

// Attach event listeners once the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Display welcome message
  appendBubble("Welcome to AI Counsel!\nYour input is essential to this process. Take your time—if you’re unsure about anything, just give your best answer. If we need clarification, we’ll follow up.", "bot");
  
  // Attach the send button event listener
  document.getElementById('sendButton').addEventListener('click', function() {
    const inputField = document.getElementById('userInput');
    const userText = inputField.value.trim();
    if (userText === "") return;
    appendBubble(userText, 'user');
    const currentQ = questions[currentQuestionIndex];
    answers.push({
      placeholder: currentQ.placeholder,
      answer: userText
    });
    currentQuestionIndex++;
    inputField.value = "";
    setTimeout(showNextQuestion, 500);
  });

  // Attach the back button event listener with logging for debugging
  document.getElementById('backButton').addEventListener('click', function() {
    if (currentQuestionIndex > 0) {
      const container = document.getElementById('chatContainer');
      if (container.children.length >= 2) {
        container.removeChild(container.lastElementChild);
        container.removeChild(container.lastElementChild);
      } else if (container.children.length === 1) {
        container.removeChild(container.lastElementChild);
      }
      currentQuestionIndex--;
      answers.splice(currentQuestionIndex, 1);
      document.getElementById('userInput').value = "";
    }
  });
  // Attach keydown event for Enter on userInput
  document.getElementById('userInput').addEventListener('keydown', function(e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      document.getElementById('sendButton').click();
    }
  });

  // Fetch questions when the DOM is ready
  fetchQuestions();
});
