/******************************************************
 * Chatbot Script (chat.js)
 * 
 * This script handles:
 *   - The initial chained acknowledgement steps.
 *   - Fetching questions from a Power Automate endpoint.
 *   - Running the Q&A flow with "send" and "back" functionality.
 *   - Transitioning to a review screen where the user can
 *     edit answers and then submit them.
 ******************************************************/

/* -------------------------
   Global Variables
------------------------- */
let questions = [];          // Array of objects: { placeholder, question }
let currentQuestionIndex = 0;
let answers = [];            // Array of objects: { placeholder, question, answer }
let editIndex = null;        // For review/edit mode

/* -------------------------
   Acknowledgement Step Function
------------------------- */
/**
 * Displays an acknowledgement step.
 * It appends a permanent explanatory bubble, then an outlined, clickable confirmation bubble.
 * If removeOnClick is false, the button remains visible but becomes unclickable after the first click.
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

  // Ensure the click callback only fires once
  let clicked = false;
  buttonBubble.addEventListener('click', function() {
    if (clicked) return; // Ignore subsequent clicks
    clicked = true;
    if (removeOnClick) {
      container.removeChild(buttonWrapper);
    } else {
      // Visually disable the button (it remains visible)
      buttonBubble.style.pointerEvents = 'none';
      buttonBubble.style.opacity = '0.5';
    }
    callback();
  });
}

/* -------------------------
   Utility Function: Get URL Parameter
------------------------- */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
const documentId = getQueryParam('documentId') || 'default-doc-id';

/* -------------------------
   Fetching Questions Functions
------------------------- */
// Fetch questions and then show a question count prompt
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

// Show a prompt that displays how many questions will be answered
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
        false  // Keep the "Let's begin" button visible but disable further clicks
      );
    }
  );
}

/* -------------------------
   Chat Message Functions (Q&A Flow)
------------------------- */
// Append a chat bubble with a label above it
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

// Show the next question (Q&A mode)
function showNextQuestion() {
  if (currentQuestionIndex < questions.length) {
    const questionObj = questions[currentQuestionIndex];
    appendBubble(questionObj.question, 'bot');
  } else {
    // When finished with questions, delay and then show the review prompt.
    appendBubble("Complete. Please wait for confirmation...", "bot");
    setTimeout(showReviewPrompt, 2000);
  }
}

/* -------------------------
   Review & Edit Functions
------------------------- */
// Clear the chat container
function clearChatContainer() {
  document.getElementById('chatContainer').innerHTML = '';
}

// Append the review header at the top of the review screen
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

// Append a review item (question and answer) to the review screen
function appendReviewItem(item, index) {
  const container = document.getElementById('chatContainer');

  // REVIEW QUESTION: full-width grey box with padding
  const questionWrapper = document.createElement('div');
  questionWrapper.className = 'review-question-wrapper';
  const questionElem = document.createElement('div');
  questionElem.className = 'review-question';
  questionElem.textContent = item.question;
  questionWrapper.appendChild(questionElem);
  container.appendChild(questionWrapper);

  // REVIEW ANSWER: separate right-aligned bubble below the question
  const answerWrapper = document.createElement('div');
  answerWrapper.className = 'review-answer-wrapper';
  const answerElem = document.createElement('div');
  answerElem.className = 'chat-bubble user';
  answerElem.textContent = item.answer;
  answerWrapper.appendChild(answerElem);
  container.appendChild(answerWrapper);

  // EDIT BUTTON: below the answer bubble, aligned left
  const editBtn = document.createElement('button');
  editBtn.className = 'edit-button';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', function() {
    editAnswer(index);
  });
  container.appendChild(editBtn);
}

// Append the "Submit All Answers" button (centered)
function appendSubmitButton() {
  const container = document.getElementById('chatContainer');
  const submitWrapper = document.createElement('div');
  submitWrapper.className = 'review-submit-wrapper';
  
  const submitBtn = document.createElement('div');
  submitBtn.className = 'chat-bubble outline submit-button';
  submitBtn.textContent = 'Submit All Answers';
  
  submitBtn.addEventListener('click', function() {
  if (submitBtn.disabled) return;
  
  // Disable all edit buttons so the client cannot re-edit during submission.
  const editBtns = document.querySelectorAll('.edit-button');
  editBtns.forEach(function(btn) {
    btn.disabled = true;
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.5';
  });
  
  // Change text to "Please wait..." and add pressed state.
  submitBtn.textContent = "Please wait...";
  submitBtn.classList.add('pressed');
  submitBtn.disabled = true;
  
  // Call the submission function.
  submitAnswers().then(data => {
    submitBtn.classList.remove('pressed');
    submitBtn.classList.add('success');
    submitBtn.textContent = "Success!";
  }).catch(error => {
    submitBtn.disabled = false;
    submitBtn.classList.remove('pressed');
    submitBtn.textContent = "Submit All Answers";
  });
});

  
  submitWrapper.appendChild(submitBtn);
  container.appendChild(submitWrapper);
}

// Show the review screen (disable input controls)
function showReviewScreen() {
  clearChatContainer();
  const container = document.getElementById('chatContainer');
  container.scrollTop = 0;
  appendReviewHeader();
  answers.forEach((item, index) => {
    appendReviewItem(item, index);
  });
  appendSubmitButton();

  // Disable input and back controls on review screen
  document.getElementById('userInput').disabled = true;
  document.getElementById('sendButton').style.display = 'none';
  const backBtn = document.getElementById('backButton');
  backBtn.style.pointerEvents = "none";
  backBtn.style.color = "transparent";
}

// Edit a specific answer in review mode
function editAnswer(index) {
  editIndex = index;
  // Re-enable input field and show the send button for editing
  document.getElementById('userInput').disabled = false;
  document.getElementById('sendButton').style.display = 'block';
  
  // Disable the back button in edit mode
  const backBtn = document.getElementById('backButton');
  backBtn.style.pointerEvents = "none";
  backBtn.style.color = "transparent"; // or you can hide it completely with display: none
  
  // Load the current answer into the input field for editing
  document.getElementById('userInput').value = answers[index].answer;
  document.getElementById('userInput').focus();
  
  // Clear the review screen and show the corresponding question bubble for editing
  clearChatContainer();
  appendBubble(questions[index].question, 'bot');
}

// Process send button press (handles new answers and edits)
function processSend() {
  const inputField = document.getElementById('userInput');
  const userText = inputField.value.trim();
  if (userText === "") return;

  if (editIndex !== null) {
    // In edit mode: update the answer and clear edit state
    answers[editIndex].answer = userText;
    appendBubble(userText, 'user');
    editIndex = null;
    inputField.value = ""; // Clear input
    setTimeout(showReviewScreen, 500);
  } else {
    // Normal Q&A mode: record answer and move to next question
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
      // After the last question, wait 2 seconds then show review prompt
      setTimeout(showReviewPrompt, 2000);
    }
  }
}

// After all questions answered, show a review prompt acknowledgement
function showReviewPrompt() {
  showAcknowledgementStep(
    "Thank you for completing these questions. Ready to review your answers?",
    "Review Answers",
    function() {
      const backBtn = document.getElementById('backButton');
      backBtn.style.pointerEvents = "none";
      backBtn.style.color = "transparent";
      showReviewScreen();
    }
  );
}

/* -------------------------
   Submit Answers Function
------------------------- */
// Submit the collected answers via AJAX to your ReplacePlaceholders endpoint
function submitAnswers() {
  const payload = {
    documentId: documentId,
    answers: answers
  };
  console.log("Submitting payload:", payload);
  const endpoint = "https://prod-167.westus.logic.azure.com:443/workflows/2e53afbe6c614ab59242a6a9078560e9/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FzgeCCHQZRloueUUzI_2RjRTLeRKbkKyey39u_kSUyI";
  
  return fetch(endpoint, {
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
    appendBubble("Success! You may close this window. If you have any questions, email info@aicounsel.co", "bot");
    return data;
  })
  .catch(error => {
    appendBubble("Error submitting answers. Email info@aicounsel.co for instructions.", "bot");
    console.error(error);
    throw error;
  });
}

/* -------------------------
   Event Listeners
------------------------- */
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
              // After initial notices, fetch questions and show question count prompt
              fetchQuestionsAndShowCount();
            }
          );
        }
      );
    }
  );

  // Attach send button and Enter key event listener
  document.getElementById('sendButton').addEventListener('click', processSend);
  document.getElementById('userInput').addEventListener('keydown', function(e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      processSend();
    }
  });

  // Attach back button event listener (active only in Q&A mode)
  document.getElementById('backButton').addEventListener('click', function() {
    if (currentQuestionIndex > 0) {
      const container = document.getElementById('chatContainer');
      // Remove the last two message wrappers (user answer + subsequent question bubble)
      if (container.children.length >= 2) {
        container.removeChild(container.lastElementChild);
        container.removeChild(container.lastElementChild);
      }
      currentQuestionIndex--;
      answers.splice(currentQuestionIndex, 1);
      document.getElementById('userInput').value = "";
    }
  });
});
