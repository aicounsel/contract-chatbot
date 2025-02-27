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
    /*
      Expecting data in the format:
      {
        "questions": "[{\"placeholder\":\"[date]\",\"question\":\"What is the date?\"}, ...]"
      }
    */
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
      // If the server returns an actual array, no parse needed
      fetchedQuestions = data.questions;
    }
    // 'fetchedQuestions' should now be an array of { placeholder, question }

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
    // Display the 'question' property
    const questionObj = questions[currentQuestionIndex];
    appendBubble(questionObj.question, 'bot');
  } else {
    appendBubble("Thank you! All questions answered.");
    function submitAnswers() {
  // Build the payload using the global documentId and the answers array
  const payload = {
    documentId: documentId,
    answers: answers
  };

  console.log("Submitting payload:", payload); // This will help you debug

  // Replace the URL below with your actual ReplacePlaceholders flow HTTP endpoint URL.
  const endpoint = "https://prod-167.westus.logic.azure.com:443/workflows/2e53afbe6c614ab59242a6a9078560e9/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FzgeCCHQZRloueUUzI_2RjRTLeRKbkKyey39u_kSUyI";

  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("Network response was not ok, status " + response.status);
    }
    return response.json();
  })
  .then(data => {
    appendBubble("Submission successful: " + JSON.stringify(data), "bot");
  })
  .catch(error => {
    appendBubble("Error submitting answers.", "bot");
    console.error(error);
  });
}
;
  }
}

// 5. Set up the send button event
document.getElementById('sendButton').addEventListener('click', function() {
  const inputField = document.getElementById('userInput');
  const userText = inputField.value.trim();
  if (userText === "") return;

  // Show user text in chat bubble
  appendBubble(userText, 'user');

  // Store the placeholder + the user's answer
  const currentQ = questions[currentQuestionIndex];
  answers.push({
    placeholder: currentQ.placeholder,
    answer: userText
    // We can keep question if we want, but placeholder is crucial for replacement
    // question: currentQ.question
  });

  currentQuestionIndex++;
  inputField.value = "";
  setTimeout(showNextQuestion, 500);
});

// 6. Function to submit answers via AJAX (for later use)
function submitAnswers() {
  const payload = {
    documentId: documentId,
    answers: answers
  };

  console.log("Submitting payload:", payload);

  // Later, you'll call your "ReplacePlaceholders" flow:
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
