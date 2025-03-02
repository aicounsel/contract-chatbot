// Global variables
let questions = []; // Array of { placeholder, question }
let currentQuestionIndex = 0;
let answers = [];   // Array of { placeholder, question, answer }
let editIndex = null;  // For review/edit mode

/**
 * Displays an acknowledgement step.
 * It first appends a permanent explanatory message bubble,
 * then appends an outlined, clickable confirmation bubble.
 * When the confirmation bubble is clicked, if removeOnClick is true, it is removed and the callback is executed.
 * If removeOnClick is false, the bubble remains visible.
 *
 * @param {string} message - The explanatory text.
 * @param {string} buttonLabel - The label for the confirmation button.
 * @param {Function} callback - Function to call when the button is clicked.
 * @param {boolean} [removeOnClick=true] - Whether to remove the confirmation bubble on click.
 */
function showAcknowledgementStep(message, buttonLabel, callback, removeOnClick = true) {
  const container = document.getElementById('chatContainer');
  // Append the explanatory message as a permanent bot bubble
  appendBubble(message, 'bot');

  // Create a wrapper for the clickable confirmation bubble
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'message-wrapper acknowledgement';

  const buttonBubble = document.createElement('div');
  buttonBubble.className = 'chat-bubble outline';
  buttonBubble.textContent = buttonLabel;

  buttonWrapper.appendChild(buttonBubble);
  container.appendChild(buttonWrapper);
  container.scrollTop = container.scrollHeight;

  // Flag to ensure the click callback only fires once.
  let clicked = false;
  buttonBubble.addEventListener('click', function() {
    if (clicked) return; // Ignore subsequent clicks
    clicked = true;
    if (removeOnClick) {
      container.removeChild(buttonWrapper);
    } else {
      // If not removing, visually disable the button so it can't be clicked again.
      buttonBubble.style.pointerEvents = 'none';
      buttonBubble.style.opacity = '0.5';
    }
    callback();
  });
}


// 1. Retrieve DocumentID from URL parameters
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
const documentId = getQueryParam('documentId') || 'default-doc-id';

// 2. Function to fetch questions from GetQuestions endpoint
function fetchQuestions() {
  const docId = getQueryParam('documentId');
  if (!docId) {
    console.error("No documentId found in URL");
    appendBubble("Error: Document ID not provided.", "bot");
    return;
  }
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
    console.log("Fetched questions:", fetchedQuestions);
    questions = fetchedQuestions;
    currentQuestionIndex = 0;
    // Instead of directly showing the first question, show the review prompt bubble.
    showReviewPrompt();
  })
  .catch(error => {
    console.error("Error fetching questions:", error);
    appendBubble("Error fetching questions. Please try again later.", "bot");
  });
}

// 2.b: Function to fetch questions and then show question count
function fetchQuestionsAndShowCount() {
  const docId = getQueryParam('documentId');
  if (!docId) {
    console.error("No documentId found in URL");
    appendBubble("Error: Document ID not provided.", "bot");
    return;
  }
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
    console.log("Fetched questions:", fetchedQuestions);
    questions = fetchedQuestions;
    currentQuestionIndex = 0;
    showQuestionCount();
  })
  .catch(error => {
    console.error("Error fetching questions:", error);
    appendBubble("Error fetching questions. Please try again later.", "bot");
  });
}

// 2.c: Function to show question count and chain final acknowledgement steps
function showQuestionCount() {
  const count = questions.length;
  showAcknowledgementStep(
    "You have " + count + " questions to complete, ranging from basic information (names, dates) to more detailed questions about your business.",
    "Continue",
    function() {
     showAcknowledgementStep(
  "If you're unsure about an answer, your best guess is fine. We'll follow up if needed. Ready to begin?",
  "Let's begin",
  function() {
    showNextQuestion();
  },
  false // Keep the button visible and disable further clicks after the first click
);

    }
  );
}

// 3. Function to append a chat bubble with a label above it
function appendBubble(text, type = 'bot', extraClass = '') {
  const container = document.getElementById('chatContainer');
  const messageWrapper = document.createElement('div');
  messageWrapper.className = 'message-wrapper ' + (type === 'user' ? 'user' : 'bot');
  const label = document.createElement('div');
  label.className = 'message-label';
  label.textContent = type === 'user' ? "Client" : "Client Assistant";
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (type === 'user' ? 'user' : 'bot') + " " + extraClass;
  bubble.textContent = text;
  messageWrapper.appendChild(label);
  messageWrapper.appendChild(bubble);
  container.appendChild(messageWrapper);
  container.scrollTop = container.scrollHeight;
}

// 4. Function to show the next question
function showNextQuestion() {
  if (currentQuestionIndex < questions.length) {
    const questionObj = questions[currentQuestionIndex];
    appendBubble(questionObj.question, 'bot');
  } else {
    appendBubble("Complete. Please wait for confirmation...", "bot");
    submitAnswers();
  }
}

// 5. Function to show review prompt after last question
function showReviewPrompt() {
  showAcknowledgementStep(
    "Thank you for completing these questions. Ready to review your answers?",
    "Review Answers",
    function() {
      // Disable the back button when review begins
      const backBtn = document.getElementById('backButton');
      backBtn.style.pointerEvents = "none";
      backBtn.style.color = "transparent";
      showReviewScreen();
    }
  );
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
    appendBubble("Success! You may close this window.", "bot");
  })
  .catch(error => {
    appendBubble("Error submitting. Email info@aicounsel.co for instructions.", "bot");
    console.error(error);
  });
}

// 7. Review and Edit Section functions
function clearChatContainer() {
  document.getElementById('chatContainer').innerHTML = '';
}
function appendReviewItem(item, index) {
  const container = document.getElementById('chatContainer');
  const reviewWrapper = document.createElement('div');
  reviewWrapper.className = 'review-item';
  
  const questionElem = document.createElement('div');
  questionElem.className = 'chat-bubble bot';
  questionElem.textContent = item.question;
  
  const answerElem = document.createElement('div');
  answerElem.className = 'chat-bubble user';
  answerElem.textContent = item.answer;
  
  const editBtn = document.createElement('button');
  editBtn.className = 'edit-button';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', function() {
    editAnswer(index);
  });
  
  reviewWrapper.appendChild(questionElem);
  reviewWrapper.appendChild(answerElem);
  reviewWrapper.appendChild(editBtn);
  container.appendChild(reviewWrapper);
}
function appendReviewHeader() {
  const container = document.getElementById('chatContainer');
  const headerWrapper = document.createElement('div');
  headerWrapper.className = 'review-header';
  
  const header = document.createElement('h2');
  header.textContent = "Review Your Answers";
  headerWrapper.appendChild(header);
  
  const subheader = document.createElement('p');
  subheader.textContent = "Please review and press 'Submit All Answers' at the bottom of the page.";
  headerWrapper.appendChild(subheader);
  
  container.appendChild(headerWrapper);
}
function appendSubmitButton() {
  const container = document.getElementById('chatContainer');
  const submitWrapper = document.createElement('div');
  submitWrapper.className = 'review-submit-wrapper';
  
  const submitBtn = document.createElement('div');
  submitBtn.className = 'chat-bubble outline submit-button';
  submitBtn.textContent = 'Submit All Answers';
  submitBtn.addEventListener('click', function() {
    submitAnswers();
  });
  
  submitWrapper.appendChild(submitBtn);
  container.appendChild(submitWrapper);
}
function showReviewScreen() {
  clearChatContainer();
  appendReviewHeader();
  answers.forEach((item, index) => {
    appendReviewItem(item, index);
  });
  appendSubmitButton();
}
function editAnswer(index) {
  editIndex = index;
  document.getElementById('userInput').value = answers[index].answer;
  document.getElementById('userInput').focus();
  clearChatContainer();
  appendBubble(questions[index].question, 'bot');
}
function processSend() {
  const inputField = document.getElementById('userInput');
  const userText = inputField.value.trim();
  if (userText === "") return;
  
  if (editIndex !== null) {
    answers[editIndex].answer = userText;
    appendBubble(userText, 'user');
    editIndex = null;
    setTimeout(showReviewScreen, 500);
  } else {
    appendBubble(userText, 'user');
    const currentQ = questions[currentQuestionIndex];
    answers.push({
      placeholder: currentQ.placeholder,
      question: currentQ.question,
      answer: userText
    });
    currentQuestionIndex++;
    inputField.value = "";
   if (currentQuestionIndex < questions.length) {
  setTimeout(showNextQuestion, 500);
} else {
  setTimeout(showReviewPrompt, 2000);
}
  }
}

// Attach event listeners once the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Chain the four initial acknowledgement steps:
  showAcknowledgementStep(
    "Welcome to your AI Counsel Client Assistant! This secure chatbot collects essential information for your project through AI-generated questions tailored to your specific needs. Please note:",
    "Continue",
    function() {
      showAcknowledgementStep(
        "This is a one-way collection tool, so it won't respond to questions.",
        "Continue",
        function() {
          showAcknowledgementStep(
            "For security reasons, this chatbot does not store any data, so please complete all questions in one session (if you close your browser or refresh the page, you'll need to start over).",
            "Continue",
            function() {
              // At this point, fetch the questions and then show the question count step
              fetchQuestionsAndShowCount();
            }
          );
        }
      );
    }
  );

  // Attach event listeners for send and Enter key
  document.getElementById('sendButton').addEventListener('click', processSend);
  document.getElementById('userInput').addEventListener('keydown', function(e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      processSend();
    }
  });

  // Attach event listener for back button (active only until review starts)
document.getElementById('backButton').addEventListener('click', function() {
  if (currentQuestionIndex > 0) {
    const container = document.getElementById('chatContainer');
    // Remove the last two message wrappers:
    if (container.children.length >= 2) {
      container.removeChild(container.lastElementChild); // Remove the pending question bubble
      container.removeChild(container.lastElementChild); // Remove the user's answer bubble
    }
    // Update global state:
    currentQuestionIndex--;
    answers.splice(currentQuestionIndex, 1);
    // Clear the input field
    document.getElementById('userInput').value = "";
  }
});

});
