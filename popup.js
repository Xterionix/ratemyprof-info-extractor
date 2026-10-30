const exportButton = document.querySelector("#export");
const status = document.querySelector("#status");

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

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

function downloadMarkdown(profile) {
  const blob = new Blob([buildMarkdown(profile)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(profile.name)}.md`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportCurrentTab() {
  exportButton.disabled = true;
  setStatus("Reading profile and loading reviews...");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !/^https?:\/\/(www\.)?ratemyprofessors\.com\//i.test(tab.url || "")) {
      throw new Error("Open a Rate My Professors page before exporting.");
    }

    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { type: "EXPORT_PROFILE" });
    } catch (error) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
      response = await chrome.tabs.sendMessage(tab.id, { type: "EXPORT_PROFILE" });
    }

    if (!response?.ok) throw new Error(response?.error || "Could not read this profile.");
    downloadMarkdown(response.profile);
    setStatus(`Downloaded ${response.profile.reviews.length} reviews.`);
  } catch (error) {
    setStatus(error.message || "Export failed.", true);
  } finally {
    exportButton.disabled = false;
  }
}

exportButton.addEventListener("click", exportCurrentTab);
