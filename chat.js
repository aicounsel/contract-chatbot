
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
let savedScrollPos = 0;      // Added this missing variable
let editScrollPos = null;  // To store the review scroll position before editing

/* -------------------------
   Acknowledgement Step Function
------------------------- */
/**
 * Displays an acknowledgement step.
 * Appends a permanent explanatory bubble, then an outlined, clickable confirmation bubble.
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

  // Ensure the click callback fires only once
  let clicked = false;
  buttonBubble.addEventListener('click', function() {
    if (clicked) return;
    clicked = true;
    if (removeOnClick) {
      container.removeChild(buttonWrapper);
    } else {
      buttonBubble.style.pointerEvents = 'none';
      buttonBubble.style.opacity = '0.5';
    }
    callback();
  });
}

/* -------------------------
   Utility: Get URL Parameter
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

// Show a prompt that displays the number of questions to answer
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
          // Enable the input controls here once the user is ready
          document.getElementById('userInput').disabled = false;
          document.getElementById('sendButton').style.display = 'block';
          // Now start the Q&A by showing the first question
          showNextQuestion();
        },
        false // Keep the "Let's begin" button visible but disable further clicks
      );
    }
  );
}


/* -------------------------
   Chat Message Functions (Q&A Mode)
------------------------- */
// Append a chat bubble (with label above)
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

// Show the next question in Q&A mode
function showNextQuestion() {
  if (currentQuestionIndex < questions.length) {
    const questionObj = questions[currentQuestionIndex];
    appendBubble(questionObj.question, 'bot');
  } else {
    // All questions answered – wait 2 seconds then show review prompt
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

// Append a review item (question and answer) for each Q&A pair
function appendReviewItem(item, index) {
  const container = document.getElementById('chatContainer');

  // Create a wrapper for the question (grey box) using review-question classes
  const questionWrapper = document.createElement('div');
  questionWrapper.className = 'review-question-wrapper';
  const questionElem = document.createElement('div');
  questionElem.className = 'review-question';
  questionElem.textContent = item.question;
  questionWrapper.appendChild(questionElem);
  container.appendChild(questionWrapper);

  // Create a wrapper for the answer (blue bubble) using review-answer classes
  const answerWrapper = document.createElement('div');
  answerWrapper.className = 'review-answer-wrapper';
  const answerElem = document.createElement('div');
  answerElem.className = 'review-answer';
  answerElem.textContent = item.answer;
  answerWrapper.appendChild(answerElem);
  container.appendChild(answerWrapper);

  // Create an edit button, placed below the answer wrapper, aligned to the right
  const editBtn = document.createElement('button');
  editBtn.className = 'edit-button';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', function() {
    editAnswer(index);
  });
  container.appendChild(editBtn);
}

// Append the "Submit All Answers" button (centered)
function appendSubmitButtonToControls() {
  const controls = document.getElementById('chatControls');
  // Clear any existing controls inside chatControls if needed:
  // controls.innerHTML = '';  // Uncomment if you want to remove all existing elements

  // Create a wrapper for the submit button (optional styling wrapper)
  const submitWrapper = document.createElement('div');
  submitWrapper.className = 'review-submit-wrapper';

  // Create the submit button (assigning an ID helps with specificity)
  const submitBtn = document.createElement('div');
  submitBtn.id = 'submitAllAnswers';
  submitBtn.className = 'chat-bubble outline submit-button';
  submitBtn.textContent = 'Submit All Answers';

  submitBtn.addEventListener('click', function() {
    if (submitBtn.disabled) return; // Prevent multiple submissions
    // Disable any edit buttons on the review page
    const editBtns = document.querySelectorAll('.edit-button');
    editBtns.forEach(function(btn) {
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.5';
    });
    submitBtn.textContent = 'Please wait...';
    submitBtn.classList.add('pressed');
    submitBtn.disabled = true;

    submitAnswers().then(data => {
      submitBtn.classList.remove('pressed');
      submitBtn.classList.add('success');
      submitBtn.textContent = 'Success!';
    }).catch(error => {
      // Optionally, re-enable on error
      submitBtn.disabled = false;
      submitBtn.classList.remove('pressed');
      submitBtn.textContent = 'Submit All Answers';
    });
  });

  submitWrapper.appendChild(submitBtn);
  // Append the wrapper to the chat controls container so it's always visible
  controls.appendChild(submitWrapper);
}

// Show the review screen – disable input controls so no new text can be added
function showReviewScreen(scrollPos = 0) {
  // Clear the chat container (review items)
  clearChatContainer();
  const container = document.getElementById('chatContainer');
  appendReviewHeader();
  answers.forEach((item, index) => {
    appendReviewItem(item, index);
  });
  
  // Instead of resetting scroll to 0, restore the passed scroll position.
  container.scrollTop = scrollPos;
  
  // Hide the input controls and back button:
  document.getElementById('userInput').style.display = 'none';
  document.getElementById('sendButton').style.display = 'none';
  document.getElementById('backButton').style.display = 'none';
  
  // Add review-mode class to chatControls for specific styling on review screen
  document.getElementById('chatControls').classList.add('review-mode');
  
  // Append the submit button to the chatControls container:
  appendSubmitButtonToControls();
}

// When editing an answer, disable the back button so no new answers are added
function editAnswer(index) {
  editIndex = index;
  
  // Capture the current scroll position in the review screen.
  editScrollPos = document.getElementById('chatContainer').scrollTop;
  
  // Remove the review-mode class when leaving review screen
  document.getElementById('chatControls').classList.remove('review-mode');
  
  // Remove the submit button wrapper from the chat controls, if it exists.
  const submitWrapper = document.querySelector('.review-submit-wrapper');
  if (submitWrapper) {
    submitWrapper.parentNode.removeChild(submitWrapper);
  }
  
  // Ensure the chat controls container is visible.
  document.getElementById('chatControls').style.display = 'flex';
  
  // Re-enable the input field and show the send button for editing.
  const userInput = document.getElementById('userInput');
  userInput.disabled = false;
  userInput.style.display = 'block'; // Ensure it's visible.
  document.getElementById('sendButton').style.display = 'block';
  
  // Disable the back button in edit mode.
  const backBtn = document.getElementById('backButton');
  backBtn.style.display = 'none'; // Hide it completely rather than making it transparent
  
  // Load the existing answer into the input field.
  userInput.value = answers[index].answer;
  userInput.focus();
  
  // Clear the review screen so the user can see the input area.
  clearChatContainer();
  
  // Display the corresponding question bubble for context.
  appendBubble(questions[index].question, 'bot');
}

// Process send button press (handles both new answers and edits)
function processSend() {
  const inputField = document.getElementById('userInput');
  const userText = inputField.value.trim();
  if (userText === "") return;
  
  if (editIndex !== null) {
    // Edit mode: update the answer, clear edit state, clear input, and show review screen
    answers[editIndex].answer = userText;
    appendBubble(userText, 'user');
    editIndex = null;
    inputField.value = "";
    setTimeout(() => {
      showReviewScreen(editScrollPos || 0);
      editScrollPos = null;  // Reset after restoring
    }, 500);
  } else {
    // Normal Q&A mode: record the answer and move to the next question
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
      // Disable back button when review begins
      const backBtn = document.getElementById('backButton');
      backBtn.style.display = 'none'; // Hide completely instead of making transparent
      showReviewScreen();
    }
  );
}

// Submit answers via AJAX to the ReplacePlaceholders endpoint
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
  // Disable the input field and send button initially
  document.getElementById('userInput').disabled = true;
  document.getElementById('sendButton').style.display = 'none';

  // Single opening message with line breaks as specified.
  showAcknowledgementStep(
    "Welcome to AI Counsel! 👋 I'm your Client Assistant and I'll help collect the information we need for your project. A few quick notes:\n• This is a secure information collection tool\n• Please complete all questions in one session\n• Your best guess is fine if you're unsure about any answers\n• AI has pulled [XX] items that need your attention\nReady to get started?",
    "Start answering",
    function() {
      // Once the user clicks the button, begin fetching the questions.
      fetchQuestionsAndShowCount();
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

  // Fixed back button event listener
document.getElementById('backButton').addEventListener('click', function() {
  if (currentQuestionIndex > 0 && editIndex === null) { // Make sure we're not in edit mode
    const container = document.getElementById('chatContainer');
    
    // Find all message wrappers
    const messageWrappers = container.querySelectorAll('.message-wrapper');
    const messageCount = messageWrappers.length;
    
    if (messageCount >= 1) {
      // Remove the current question (which is the last message bubble)
      container.removeChild(messageWrappers[messageCount - 1]);
      
      // If there's a user answer for the current question, remove it too
      if (messageCount >= 2 && messageWrappers[messageCount - 2].classList.contains('user')) {
        container.removeChild(messageWrappers[messageCount - 2]);
      }
    }
    
    // Decrement the question index
    currentQuestionIndex--;
    
    // Remove the last answer from our answers array if it exists
    if (answers.length > currentQuestionIndex) {
      answers.pop();
    }
    
    // Clear the input field
    document.getElementById('userInput').value = "";
    
    // Important: We do NOT call showNextQuestion() here as that would
    // add the previous question again
  }
});
});
