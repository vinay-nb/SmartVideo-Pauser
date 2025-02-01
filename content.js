// Find the first video element on the page
function findVideoElement() {
  const videoElement = document.querySelector("video");
  if (videoElement) {
    console.log("Video element found:", videoElement);
  } else {
    console.log("No video element found.");
  }
  return videoElement;
}

// Wait for the video element to be added to the DOM
function waitForVideoElement(callback) {
  const observer = new MutationObserver((mutations, obs) => {
    const videoElement = findVideoElement();
    if (videoElement) {
      obs.disconnect(); // Stop observing
      callback(videoElement);
    }
  });

  // Start observing the document for changes
  observer.observe(document.body, { childList: true, subtree: true });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received:", message);

  if (message.action === "pauseVideo") {
    const videoElement = findVideoElement();
    if (videoElement && !videoElement.paused) {
      // Pause the video and save the playback state
      videoElement.pause();
      chrome.storage.local.set(
        { wasPlaying: true, videoTime: videoElement.currentTime },
        () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error saving playback state:",
              chrome.runtime.lastError
            );
            sendResponse({
              status: "error",
              message: chrome.runtime.lastError.message,
            });
          } else {
            console.log("Video paused. State saved:", {
              wasPlaying: true,
              videoTime: videoElement.currentTime,
            });
            sendResponse({ status: "success" });
          }
        }
      );
    } else {
      console.log("No video element found or video already paused.");
      sendResponse({ status: "noAction" });
    }
  } else if (message.action === "playVideo") {
    // Wait for the video element to be ready
    waitForVideoElement((videoElement) => {
      chrome.storage.local.get(["wasPlaying", "videoTime"], (result) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error retrieving playback state:",
            chrome.runtime.lastError
          );
          sendResponse({
            status: "error",
            message: chrome.runtime.lastError.message,
          });
        } else if (result.wasPlaying) {
          // Restore the playback time and play the video
          videoElement.currentTime = result.videoTime || 0;
          videoElement.play();
          console.log("Video resumed from time:", result.videoTime);
          sendResponse({ status: "success" });
        } else {
          console.log("Video was not playing before tab switch.");
          sendResponse({ status: "noAction" });
        }
      });
    });
  }

  // Return true to indicate the response will be sent asynchronously
  return true;
});
