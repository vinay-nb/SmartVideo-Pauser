console.log("Background script is running!");

// Track the active tab ID
let activeTabId = null;

// Listen for tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("Tab changed to:", activeInfo.tabId);

  // If there was a previously active tab, send a "pauseVideo" message to it
  if (activeTabId !== null) {
    chrome.tabs
      .sendMessage(activeTabId, { action: "pauseVideo" })
      .then((response) => {
        console.log("Pause message sent to previous tab:", response);
      })
      .catch((error) => {
        if (
          error.message ===
          "Could not establish connection. Receiving end does not exist."
        ) {
          console.log("Content script not injected in previous tab.");
        } else {
          console.error("Could not send pause message:", error);
        }
      });
  }

  // Update the active tab ID
  activeTabId = activeInfo.tabId;

  // Wait for the newly active tab to finish loading
  chrome.tabs.onUpdated.addListener(function onTabUpdated(tabId, changeInfo) {
    if (tabId === activeTabId && changeInfo.status === "complete") {
      // Send a "playVideo" message to the newly active tab
      setTimeout(() => {
        chrome.tabs
          .sendMessage(tabId, { action: "playVideo" })
          .then((response) => {
            console.log("Play message sent to new tab:", response);
          })
          .catch((error) => {
            if (
              error.message ===
              "Could not establish connection. Receiving end does not exist."
            ) {
              console.log("Content script not injected in new tab.");
            } else {
              console.error("Could not send play message:", error);
            }
          });
      }, 500); // Add a small delay to ensure the content script is ready
    }
  });
});
