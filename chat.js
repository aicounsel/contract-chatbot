// chat.js

// Global variables
let questions = []; // Will hold an array of { placeholder, question }
let currentQuestionIndex = 0;
let answers = [];

/**
 * Displays an acknowledgement step.
 * It first appends a permanent explanatory message bubble,
 * then appends an outlined, clickable confirmation bubble.
 * When the confirmation bubble is clicked, if removeOnClick is true, it is removed and the callback is executed.
 * If removeOnClick is false, the bubble remains visible.
 *
 * @param {string} message - The explanatory text to display.
 * @param {string} buttonLabel - The label for the confirmation button.
 * @param {Function} callback - A function to call once the confirmation bubble is clicked.
 * @param {boolean} [removeOnClick=true] - Whether to remove the confirmation bubble when clicked.
 */
function showAcknowledgementStep(message, buttonLabel, callback, removeOnClick = true) {
  const container = document.getElementById('chatContainer');

  // Append the explanatory message as a permanent bot bubble
  appendBubble(message, 'bot');

  // Create a separate wrapper for the clickable confirmation bubble
  const buttonWrapper = document.createElement('div');
  buttonWrapper.className = 'message-wrapper acknowledgement';
  
  // Create the clickable bubble (outlined style)
  const buttonBubble = document.createElement('div');
  buttonBubble.className = 'chat-bubble outline';
  buttonBubble.textContent = buttonLabel;

  // Append the clickable bubble to its wrapper, then add the wrapper to the container
  buttonWrapper.appendChild(buttonBubble);
  container.appendChild(buttonWrapper);
  container.scrollTop = container.scrollHeight;

  // When the button bubble is clicked, remove the wrapper (if desired) and call the callback
  buttonBubble.addEventListener('click', function() {
    if (removeOnClick) {
      container.removeChild(buttonWrapper);
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
  // Chain the five explanatory acknowledgement steps:
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
              // At this point, ideally you have already fetched your questions.
              // If you want to show the actual count, ensure that 'questions' has been set.
              // For this example, we'll assume 'questions' is already populated.
              let questionCount = questions.length || "[xx]";
              showAcknowledgementStep(
                "You have " + questionCount + " questions to complete, ranging from basic information (names, dates) to more detailed questions about your business.",
                "Continue",
                function() {
                  // Final step: this one does not remove the button so the user can see it.
                  showAcknowledgementStep(
                    "If you're unsure about an answer, your best guess is fine. We'll follow up if needed. Ready to begin?",
                    "Let's begin",
                    function() {
                      // Now begin the questions.
                      showNextQuestion();
                    },
                    false // Do not remove the "Let's begin" bubble on click.
                  );
                }
              );
            }
          );
        }
      );
    }
  );

  // Attach the send button event listener
  document.getElementById('sendButton').addEventListener('click', processSend);
  document.getElementById('userInput').addEventListener('keydown', function(e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      processSend();
    }
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
});


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
