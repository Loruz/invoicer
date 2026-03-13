export default defineBackground(() => {
  // Set up alarm to update badge every 60 seconds while a timer is active
  chrome.alarms.create("check-timer", { periodInMinutes: 1 });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "check-timer") {
      try {
        const result = await chrome.storage.local.get(["activeTimer"]);
        if (result.activeTimer) {
          const elapsed = Math.floor(
            (Date.now() - new Date(result.activeTimer.startTime).getTime()) /
              1000
          );
          const hours = Math.floor(elapsed / 3600);
          const minutes = Math.floor((elapsed % 3600) / 60);
          const badge = hours > 0 ? `${hours}h` : `${minutes}m`;
          chrome.action.setBadgeText({ text: badge });
          chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
        } else {
          chrome.action.setBadgeText({ text: "" });
        }
      } catch {
        chrome.action.setBadgeText({ text: "" });
      }
    }
  });

  // Clear badge when extension is installed or updated
  chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({ text: "" });
  });
});
