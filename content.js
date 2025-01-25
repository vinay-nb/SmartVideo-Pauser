console.log("Content script is running!");

// Find the first video element on the page
function findVideoElement() {
  return document.querySelector("video");
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
          console.log("Video paused. State saved:", {
            wasPlaying: true,
            videoTime: videoElement.currentTime,
          });
          sendResponse({ status: "success" });
        }
      );
    } else {
      console.log("No video element found or video already paused.");
      sendResponse({ status: "noAction" });
    }
  } else if (message.action === "playVideo") {
    const videoElement = findVideoElement();
    if (videoElement) {
      // Restore the playback state and time
      chrome.storage.local.get(["wasPlaying", "videoTime"], (result) => {
        if (result.wasPlaying) {
          videoElement.currentTime = result.videoTime || 0; // Restore the playback time
          videoElement.play();
          console.log("Video resumed from time:", result.videoTime);
          sendResponse({ status: "success" });
        } else {
          console.log("Video was not playing before tab switch.");
          sendResponse({ status: "noAction" });
        }
      });
    } else {
      console.log("No video element found.");
      sendResponse({ status: "noVideo" });
    }
  }

  // Return true to indicate the response will be sent asynchronously
  return true;
});
