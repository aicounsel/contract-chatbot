// chat.js

// Global variables
let questions = []; // Will hold an array of { placeholder, question }
let currentQuestionIndex = 0;
let answers = [];

/**
 * Displays an acknowledgement step.
 * It first appends a permanent explanatory message bubble,
 * then appends an outlined, clickable confirmation bubble.
 * When the confirmation bubble is clicked, it is removed and the callback is executed.
 *
 * @param {string} message - The explanatory text to display.
 * @param {string} buttonLabel - The label for the confirmation button.
 * @param {Function} callback - A function to call once the confirmation bubble is clicked.
 */
function showAcknowledgementStep(message, buttonLabel, callback) {
  const container = document.getElementById('chatContainer');

  // Append the explanatory message as a permanent bot bubble
  appendBubble(message, 'bot');

  // Create a separate wrapper for the clickable confirmation bubble
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'message-wrapper acknowledgement'; // Use a class for additional styling if needed
  // We do not add a label here since we want it to appear exactly as a bot bubble's button

  // Create the clickable bubble (outlined style)
  const buttonBubble = document.createElement('div');
  buttonBubble.className = 'chat-bubble outline';
  buttonBubble.textContent = buttonLabel;

  // Append the clickable bubble to its wrapper, then add the wrapper to the container
  buttonWrapper.appendChild(buttonBubble);
  container.appendChild(buttonWrapper);
  container.scrollTop = container.scrollHeight;

  // When the button bubble is clicked, remove only the button bubble (its wrapper) and call the callback
  buttonBubble.addEventListener('click', function() {
    container.removeChild(buttonWrapper);
    callback();
  });
}




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

// 3. Function to append a chat bubble (with label above)
function appendBubble(text, type = 'bot', extraClass = '') {
  const container = document.getElementById('chatContainer');

  // Create a message wrapper
  const messageWrapper = document.createElement('div');
  messageWrapper.className = 'message-wrapper ' + (type === 'user' ? 'user' : 'bot');

  // Create the label element
  const label = document.createElement('div');
  label.className = 'message-label';
  label.textContent = type === 'user' ? "Client" : "Client Assistant";

  // Create the bubble element
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (type === 'user' ? 'user' : 'bot') + " " + extraClass;
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
    appendBubble("Complete. Please wait for confirmation...", "bot");
    submitAnswers();
  }
}

// 5. Function to show the acknowledgement bubble
function showAcknowledgement() {
  const container = document.getElementById('chatContainer');
  
  // Create a message wrapper with the 'acknowledgement' class
  const messageWrapper = document.createElement('div');
  messageWrapper.className = 'message-wrapper acknowledgement';
  
  // Create the bubble element using the outline class
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble outline';
  bubble.textContent = "Ready to move on?";
  
  // When the bubble is clicked, remove it and fetch the questions
  bubble.addEventListener('click', function() {
    container.removeChild(messageWrapper);
    fetchQuestions();
  });
  
  // Append the bubble to the wrapper, and then the wrapper to the container
  messageWrapper.appendChild(bubble);
  container.appendChild(messageWrapper);
  container.scrollTop = container.scrollHeight;
}

//5b. Question Count
function showQuestionCount() {
  const count = questions.length;
  showAcknowledgementStep(
    "You have " + count + " questions to answer. Please answer carefully, as you cannot save and go back.",
    "Let's begin",
    function() {
      // Now start the questions
      showNextQuestion();
    }
  );
}

//5.c Count Questions

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
    questions = fetchedQuestions;
    currentQuestionIndex = 0;
    // Instead of immediately showing the first question,
    // call the new function to show the count message.
    showQuestionCount();
  })
  .catch(error => {
    console.error("Error fetching questions:", error);
    appendBubble("Error fetching questions. Please try again later.", "bot");
  });
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

// Attach event listeners once the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Chain the four explanatory acknowledgement steps, including the welcome message:
  showAcknowledgementStep(
    "Welcome to AI Counsel!\nYour input is essential to ensuring this contract fits your needs. Take your time—if you’re unsure about anything, just give your best answer. If we need clarification, we’ll follow up.",
    "Continue",
    function() {
      showAcknowledgementStep(
        "This chatbot securely collects the information needed for your contract. While AI generated the questions, you are not interacting with AI—this is simply a structured way to provide your answers.",
        "Continue",
        function() {
          showAcknowledgementStep(
            "Your data is protected. The chatbot does not store any information. Each response is securely transmitted to a Microsoft-encrypted system in real time.",
            "Confirmed",
            function() {
              showAcknowledgementStep(
                "Ready to continue?",
                "Ready!",
                function() {
                  // Instead of calling fetchQuestions() immediately, fetch questions and then show the question count message.
                  fetchQuestionsAndShowCount();
                }
              );
            }
          );
        }
      );
    }
  );

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

  // Attach the back button event listener
  document.getElementById('backButton').addEventListener('click', function() {
    if (currentQuestionIndex > 0) {
      const container = document.getElementById('chatContainer');
      // Remove the last two message wrappers (user answer + question bubble)
      if (container.children.length >= 2) {
        container.removeChild(container.lastElementChild);
        container.removeChild(container.lastElementChild);
      } else if (container.children.length === 1) {
        container.removeChild(container.lastElementChild);
      }
      currentQuestionIndex--;
      answers.splice(currentQuestionIndex, 1);
      document.getElementById('userInput').value = "";
      appendBubble(questions[currentQuestionIndex].question, 'bot');
    }
  });

  // Attach keydown event for Enter on userInput
  document.getElementById('userInput').addEventListener('keydown', function(e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      document.getElementById('sendButton').click();
    }
  });
});


//SUMMARY
// Global variables (if not already declared)
let questions = []; // Array of { placeholder, question }
let currentQuestionIndex = 0;
let answers = [];   // Array of { placeholder, answer, question }
let editIndex = null;  // Index of the answer currently being edited (if any)

// Clear the chat container
function clearChatContainer() {
  document.getElementById('chatContainer').innerHTML = '';
}

// Append a review item to the chat container
function appendReviewItem(item, index) {
  const container = document.getElementById('chatContainer');

  // Create a wrapper for the review item
  const reviewWrapper = document.createElement('div');
  reviewWrapper.className = 'review-item';

  // Create an element for the question text
  const questionElem = document.createElement('div');
  questionElem.className = 'review-question';
  questionElem.textContent = item.question; // or use item.placeholder if you prefer

  // Create an element for the answer text
  const answerElem = document.createElement('div');
  answerElem.className = 'review-answer';
  answerElem.textContent = item.answer;

  // Create an Edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'edit-button';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', function() {
    editAnswer(index);
  });

  // Append the question, answer, and edit button to the review wrapper
  reviewWrapper.appendChild(questionElem);
  reviewWrapper.appendChild(answerElem);
  reviewWrapper.appendChild(editBtn);

  // Append the review wrapper to the chat container
  container.appendChild(reviewWrapper);
}

// Append a final "Submit All Answers" button
function appendSubmitButton() {
  const container = document.getElementById('chatContainer');
  const submitWrapper = document.createElement('div');
  submitWrapper.className = 'review-submit-wrapper';
  
  const submitBtn = document.createElement('button');
  submitBtn.className = 'submit-button';
  submitBtn.textContent = 'Submit All Answers';
  submitBtn.addEventListener('click', function() {
    // Call your final submission function
    submitAnswers();
  });
  
  submitWrapper.appendChild(submitBtn);
  container.appendChild(submitWrapper);
}

// Show the review screen with all answers
function showReviewScreen() {
  clearChatContainer();
  // Loop through all answers and display each
  answers.forEach((item, index) => {
    appendReviewItem(item, index);
  });
  // Append the final submit button
  appendSubmitButton();
}

// When an answer is edited, load it into the input field and set editIndex
function editAnswer(index) {
  editIndex = index;
  // Load the answer back into the input field for editing
  document.getElementById('userInput').value = answers[index].answer;
  // Optionally, focus the input field
  document.getElementById('userInput').focus();
  // Remove the review screen so the user can see the input area
  clearChatContainer();
  // Also display the question corresponding to the answer being edited
  appendBubble(questions[index].question, 'bot');
}

// Update the answer when the user clicks Send if in edit mode
function processSend() {
  const inputField = document.getElementById('userInput');
  const userText = inputField.value.trim();
  if (userText === "") return;
  
  // If editing an existing answer, update that answer
  if (editIndex !== null) {
    answers[editIndex].answer = userText;
    // Optionally, display the updated answer as a user bubble
    appendBubble(userText, 'user');
    editIndex = null; // Clear edit mode
    // Re-display the review screen
    setTimeout(showReviewScreen, 500);
  } else {
    // Normal mode: store the new answer
    appendBubble(userText, 'user');
    const currentQ = questions[currentQuestionIndex];
    answers.push({
      placeholder: currentQ.placeholder,
      question: currentQ.question,
      answer: userText
    });
    currentQuestionIndex++;
    inputField.value = "";
    // If there are more questions, show the next one; otherwise, show review screen.
    if (currentQuestionIndex < questions.length) {
      setTimeout(showNextQuestion, 500);
    } else {
      // All questions answered; show review screen.
      setTimeout(showReviewScreen, 500);
    }
  }
}

// Modify your existing send button event listener:
document.getElementById('sendButton').addEventListener('click', processSend);
document.getElementById('userInput').addEventListener('keydown', function(e) {
  if (e.key === "Enter" || e.keyCode === 13) {
    e.preventDefault();
    processSend();
  }
});

// Example: modify showNextQuestion so that it calls showReviewScreen() when finished
function showNextQuestion() {
  if (currentQuestionIndex < questions.length) {
    const questionObj = questions[currentQuestionIndex];
    appendBubble(questionObj.question, 'bot');
  } else {
    appendBubble("Thank you! All questions answered.", "bot");
    // Instead of directly submitting, show the review screen
    setTimeout(showReviewScreen, 500);
  }
}

