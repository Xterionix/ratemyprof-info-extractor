function safeFileName(name) {
  return (name || "rate-my-professors-export")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 100) || "rate-my-professors-export";
}

function buildMarkdown(profile) {
  const lines = [
    `# ${profile.name || "Rate My Professors Profile"}`,
    "",
    `- **Rating:** ${profile.rating || "N/A"}`,
    `- **Number of ratings:** ${profile.ratingCount || "N/A"}`,
    `- **Source:** ${profile.url}`,
    `- **Exported:** ${new Date().toISOString()}`,
    "",
    `## Reviews (${profile.reviews.length})`,
    ""
  ];

  if (!profile.reviews.length) {
    lines.push("_No reviews were found on this page._");
  }

  profile.reviews.forEach((review, index) => {
    lines.push(`### Review ${index + 1}`);
    if (review.rating) lines.push(`- **Rating:** ${review.rating}`);
    if (review.course) lines.push(`- **Course:** ${review.course}`);
    if (review.grade) lines.push(`- **Grade:** ${review.grade}`);
    if (review.date) lines.push(`- **Date:** ${review.date}`);
    if (review.tags.length) lines.push(`- **Tags:** ${review.tags.join(", ")}`);
    lines.push("", review.text || "_No review text found._", "");
  });

  return `${lines.join("\n").trim()}\n`;
}

async function setActionStatus(message, isError = false) {
  await chrome.action.setBadgeText({ text: isError ? "!" : "..." });
  await chrome.action.setBadgeBackgroundColor({
    color: isError ? "#b3261e" : "#2764d8"
  });
  await chrome.action.setTitle({ title: message });
}

async function clearActionStatus(message) {
  await chrome.action.setBadgeText({ text: "" });
  await chrome.action.setTitle({ title: message });
}

async function exportTab(tab) {
  if (!tab?.id || !/^https?:\/\/(www\.)?ratemyprofessors\.com\//i.test(tab.url || "")) {
    throw new Error("Open a Rate My Professors professor page first.");
  }

  let response;
  try {
    response = await chrome.tabs.sendMessage(tab.id, { type: "EXPORT_PROFILE" });
  } catch (error) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    response = await chrome.tabs.sendMessage(tab.id, { type: "EXPORT_PROFILE" });
  }

  if (!response?.ok) {
    throw new Error(response?.error || "Could not read this profile.");
  }

  const markdown = buildMarkdown(response.profile);
  await chrome.downloads.download({
    url: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`,
    filename: `${safeFileName(response.profile.name)}.md`,
    saveAs: false
  });
  return response.profile.reviews.length;
}

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await setActionStatus("Reading profile and loading reviews...");
    const reviewCount = await exportTab(tab);
    await clearActionStatus(`Downloaded ${reviewCount} reviews as Markdown.`);
  } catch (error) {
    await setActionStatus(error.message || "Export failed.", true);
    setTimeout(() => clearActionStatus("Export Rate My Professors page"), 5000);
  }
});
