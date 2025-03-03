/******************************************************
 * Improved Chatbot Script (chat.js)
 * 
 * Enhancements:
 *   - Streamlined welcome and acknowledgement flow
 *   - Progress indicators during question flow
 *   - More engaging button text
 *   - Clearer review instructions
 *   - Enhanced success/error messaging
 ******************************************************/

/* -------------------------
   Global Variables
------------------------- */
let questions = [];          // Array of objects: { placeholder, question }
let currentQuestionIndex = 0;
let answers = [];            // Array of objects: { placeholder, question, answer }
let editIndex = null;        // For review/edit mode
let savedScrollPos = 0;      // Added this missing variable
let editScrollPos = null;    // To store the review scroll position before editing

/* -------------------------
   Improved Acknowledgement Step Function
------------------------- */
/**
 * Displays an acknowledgement step with improved styling and more engaging button text.
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
  buttonBubble.className = 'chat-bubble outline action-button';
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
// Fetch questions and then show a combined welcome message
function fetchQuestionsAndShowWelcome() {
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
    showWelcomeMessage();
  })
  .catch(error => {
    console.error("Error fetching questions:", error);
    appendBubble("We're having trouble connecting to our servers. Please refresh the page and try again, or contact support at info@aicounsel.co if the issue persists.", "bot");
  });
}

// Show an improved single welcome message that combines all key information
function showWelcomeMessage() {
  const count = questions.length;
  const welcomeMessage = `
Welcome to AI Counsel! 👋 I'm your Client Assistant and I'll help collect the information we need for your project.

A few quick notes:
• This is a secure information collection tool (${count} questions)
• Please complete all questions in one session
• Your best guess is fine if you're unsure about any answers

Ready to get started?
  `;
  
  showAcknowledgementStep(
    welcomeMessage,
    "Start answering",
    function() {
      // Enable the input controls here once the user is ready
      document.getElementById('userInput').disabled = false;
      document.getElementById('sendButton').style.display = 'block';
      // Now start the Q&A by showing the first question
      showNextQuestion();
    },
    false // Keep the button visible but disable further clicks
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
  label.textContent = type === 'user' ? "You" : "AI Counsel Assistant";

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (type === 'user' ? 'user' : 'bot') + " " + extraClass;
  bubble.textContent = text;

  messageWrapper.appendChild(label);
  messageWrapper.appendChild(bubble);
  container.appendChild(messageWrapper);
  container.scrollTop = container.scrollHeight;
}

// Show the next question with progress indicator in Q&A mode
function showNextQuestion() {
  if (currentQuestionIndex < questions.length) {
    const questionObj = questions[currentQuestionIndex];
    const progressText = `Question ${currentQuestionIndex + 1} of ${questions.length}:`;
    
    // Add progress indicator as a separate subtle bubble
    const container = document.getElementById('chatContainer');
    const progressWrapper = document.createElement('div');
    progressWrapper.className = 'message-wrapper bot';
    
    const progressBubble = document.createElement('div');
    progressBubble.className = 'chat-bubble bot progress-indicator';
    progressBubble.textContent = progressText;
    
    progressWrapper.appendChild(progressBubble);
    container.appendChild(progressWrapper);
    
    // Then add the actual question
    appendBubble(questionObj.question, 'bot');
  } else {
    // All questions answered – show a better completion message
    appendBubble("Great job! You've answered all the questions. Just a moment while I prepare your responses for review...", "bot");
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

// Append the improved review header with clearer instructions
function appendReviewHeader() {
  const container = document.getElementById('chatContainer');
  const headerWrapper = document.createElement('div');
  headerWrapper.className = 'review-header';

  const header = document.createElement('h2');
  header.textContent = "Almost done! Please review your answers";
  headerWrapper.appendChild(header);

  const subheader = document.createElement('p');
  subheader.textContent = "You can edit any response by clicking the \"Edit\" button. When you're satisfied with all answers, click \"Complete my submission\" at the bottom.";
  headerWrapper.appendChild(subheader);

  container.appendChild(headerWrapper);
}

// Append a review item (question and answer) for each Q&A pair with improved styling
function appendReviewItem(item, index) {
  const container = document.getElementById('chatContainer');

  // Create a wrapper for the question (grey box) using review-question classes
  const questionWrapper = document.createElement('div');
  questionWrapper.className = 'review-question-wrapper';
  const questionElem = document.createElement('div');
  questionElem.className = 'review-question';
  
  // Add question number for better orientation
  const questionNumber = document.createElement('span');
  questionNumber.className = 'question-number';
  questionNumber.textContent = `${index + 1}. `;
  questionElem.appendChild(questionNumber);
  
  const questionText = document.createTextNode(item.question);
  questionElem.appendChild(questionText);
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

  // Create an edit button with improved styling
  const editBtn = document.createElement('button');
  editBtn.className = 'edit-button';
  
  // Add pencil icon for better visual affordance
  const pencilIcon = document.createElement('span');
  pencilIcon.className = 'edit-icon';
  pencilIcon.innerHTML = '✏️';
  editBtn.appendChild(pencilIcon);
  
  const editText = document.createTextNode(' Edit');
  editBtn.appendChild(editText);
  
  editBtn.addEventListener('click', function() {
    editAnswer(index);
  });
  container.appendChild(editBtn);
}

// Append the "Submit All Answers" button with improved styling
function appendSubmitButtonToControls() {
  const controls = document.getElementById('chatControls');
  
  // Create a wrapper for the submit button
  const submitWrapper = document.createElement('div');
  submitWrapper.className = 'review-submit-wrapper';

  // Create the submit button
  const submitBtn = document.createElement('div');
  submitBtn.id = 'submitAllAnswers';
  submitBtn.className = 'chat-bubble outline submit-button';
  submitBtn.textContent = 'Complete my submission';

  submitBtn.addEventListener('click', function() {
    if (submitBtn.disabled) return; // Prevent multiple submissions
    // Disable any edit buttons on the review page
    const editBtns = document.querySelectorAll('.edit-button');
    editBtns.forEach(function(btn) {
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.5';
    });
    submitBtn.textContent = 'Submitting...';
    submitBtn.classList.add('pressed');
    submitBtn.disabled = true;

    submitAnswers().then(data => {
      submitBtn.classList.remove('pressed');
      submitBtn.classList.add('success');
      submitBtn.textContent = 'Successfully submitted!';
    }).catch(error => {
      // Re-enable on error
      submitBtn.disabled = false;
      submitBtn.classList.remove('pressed');
      submitBtn.classList.add('error');
      submitBtn.textContent = 'Try again';
    });
  });

  submitWrapper.appendChild(submitBtn);
  controls.appendChild(submitWrapper);
}

// Show the review screen with improved layout
function showReviewScreen(scrollPos = 0) {
  clearChatContainer();
  const container = document.getElementById('chatContainer');
  appendReviewHeader();
  answers.forEach((item, index) => {
    appendReviewItem(item, index);
  });
  
  container.scrollTop = scrollPos;
  
  // Hide the input controls and back button
  document.getElementById('userInput').style.display = 'none';
  document.getElementById('sendButton').style.display = 'none';
  document.getElementById('backButton').style.display = 'none';
  
  document.getElementById('chatControls').classList.add('review-mode');
  appendSubmitButtonToControls();
}

// Enhanced edit answer function with clearer context
function editAnswer(index) {
  editIndex = index;
  
  // Capture the current scroll position in the review screen
  editScrollPos = document.getElementById('chatContainer').scrollTop;
  
  document.getElementById('chatControls').classList.remove('review-mode');
  
  // Remove the submit button wrapper from the chat controls, if it exists
  const submitWrapper = document.querySelector('.review-submit-wrapper');
  if (submitWrapper) {
    submitWrapper.parentNode.removeChild(submitWrapper);
  }
  
  document.getElementById('chatControls').style.display = 'flex';
  
  // Re-enable the input field with the current answer
  const userInput = document.getElementById('userInput');
  userInput.disabled = false;
  userInput.style.display = 'block';
  document.getElementById('sendButton').style.display = 'block';
  
  // Hide the back button in edit mode
  document.getElementById('backButton').style.display = 'none';
  
  // Load the existing answer and focus
  userInput.value = answers[index].answer;
  userInput.focus();
  
  clearChatContainer();
  
  // Add context to show which question is being edited
  appendBubble(`Editing question ${index + 1} of ${questions.length}:`, 'bot', 'edit-context');
  appendBubble(questions[index].question, 'bot');
}

// Process send button press with improved flow
function processSend() {
  const inputField = document.getElementById('userInput');
  const userText = inputField.value.trim();
  if (userText === "") return;
  
  if (editIndex !== null) {
    // Edit mode: update the answer, clear edit state, show confirmation
    answers[editIndex].answer = userText;
    appendBubble(userText, 'user');
    appendBubble("Your answer has been updated. Returning to review...", 'bot');
    editIndex = null;
    inputField.value = "";
    setTimeout(() => {
      showReviewScreen(editScrollPos || 0);
      editScrollPos = null;
    }, 1000);
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
      setTimeout(showReviewPrompt, 1000);
    }
  }
}

// After all questions answered, show an improved review prompt
function showReviewPrompt() {
  showAcknowledgementStep(
    "Great work! You've completed all the questions. Now let's make sure everything is accurate before we submit.",
    "Check my answers",
    function() {
      // Disable back button when review begins
      document.getElementById('backButton').style.display = 'none';
      showReviewScreen();
    }
  );
}

// Submit answers with improved success/error handling
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
    // Enhanced success message
    appendBubble(`
✅ Success! Your information has been securely submitted to AI Counsel.

What happens next? Our team will review your answers and reach out if we need any clarification. You can close this window now.

If you have any questions, contact us at info@aicounsel.co
    `, "bot", "success-message");
    return data;
  })
  .catch(error => {
    // Enhanced error message with clear next steps
    appendBubble(`
❌ We encountered an issue submitting your answers. Don't worry - your responses are still saved on this page.

Please try submitting again, or if the problem persists:
1. Take screenshots of your answers
2. Email them to info@aicounsel.co with subject line "Submission Error"

Our team will help you complete the process.
    `, "bot", "error-message");
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
  
  // Start with streamlined welcome and fetch questions
  fetchQuestionsAndShowWelcome();

  // Attach send button and Enter key event listener
  document.getElementById('sendButton').addEventListener('click', processSend);
  document.getElementById('userInput').addEventListener('keydown', function(e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      processSend();
    }
  });

  // Back button event listener with improved visual feedback
  document.getElementById('backButton').addEventListener('click', function() {
    if (currentQuestionIndex > 0 && editIndex === null) {
      const container = document.getElementById('chatContainer');
      
      // Find all message wrappers
      const messageWrappers = container.querySelectorAll('.message-wrapper');
      const messageCount = messageWrappers.length;
      
      if (messageCount >= 1) {
        // Remove the current question bubble
        container.removeChild(messageWrappers[messageCount - 1]);
        
        // If there's a progress indicator, remove it too
        if (messageCount >= 2 && messageWrappers[messageCount - 2].querySelector('.progress-indicator')) {
          container.removeChild(messageWrappers[messageCount - 2]);
        }
        
        // If there's a user answer for the current question, remove it too
        const userMessageIndex = messageCount - (messageWrappers[messageCount - 2].querySelector('.progress-indicator') ? 3 : 2);
        if (userMessageIndex >= 0 && messageWrappers[userMessageIndex].classList.contains('user')) {
          container.removeChild(messageWrappers[userMessageIndex]);
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
      
      // Show the previous question again
      showNextQuestion();
    }
  });
});
