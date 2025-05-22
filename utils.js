function showFeedback(message, feedbackElement) {
  feedbackElement.textContent = message;
  feedbackElement.classList.remove('hidden');
  setTimeout(() => feedbackElement.classList.add('hidden'), 2000);
}

function startCountdown(seconds, countdownElement, callback) {
  let timeLeft = seconds;
  countdownElement.textContent = timeLeft;
  countdownElement.classList.remove('hidden');

  const interval = setInterval(() => {
    timeLeft -= 1;
    countdownElement.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(interval);
      countdownElement.classList.add('hidden');
      callback();
    }
  }, 1000);
}

function HistoryManager() {
  let history = [[]]; // Start with an empty photos array
  let currentIndex = 0;

  return {
    addState(photos) {
      // Truncate history after the current index
      history = history.slice(0, currentIndex + 1);
      history.push([...photos]); // Deep copy of photos array
      currentIndex = history.length - 1;
    },
    undo() {
      if (currentIndex > 0) {
        currentIndex--;
        return [...history[currentIndex]]; // Return a copy of the previous state
      }
      return null;
    },
    redo() {
      if (currentIndex < history.length - 1) {
        currentIndex++;
        return [...history[currentIndex]]; // Return a copy of the next state
      }
      return null;
    },
    canUndo() {
      return currentIndex > 0;
    },
    canRedo() {
      return currentIndex < history.length - 1;
    }
  };
}