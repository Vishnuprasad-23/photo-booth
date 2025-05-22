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
      history = history.slice(0, currentIndex + 1);
      history.push([...photos]);
      currentIndex = history.length - 1;
    },
    undo() {
      if (currentIndex > 0) {
        currentIndex--;
        return [...history[currentIndex]];
      }
      return null;
    },
    redo() {
      if (currentIndex < history.length - 1) {
        currentIndex++;
        return [...history[currentIndex]];
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

function applyFilterToImage(imageSrc, filter, callback) {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = imageSrc;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    // Draw the image
    ctx.drawImage(img, 0, 0);
    
    // Apply the filter
    ctx.filter = filter;
    ctx.drawImage(img, 0, 0);
    
    // Return the filtered image as a data URL
    callback(canvas.toDataURL('image/png'));
  };
  img.onerror = () => {
    console.error('Error loading image for filter application');
    callback(imageSrc); // Fallback to original image
  };
}