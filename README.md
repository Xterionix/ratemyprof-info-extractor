# Rate My Professors Markdown Exporter

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Markdown](https://img.shields.io/badge/Output-Markdown-000000?logo=markdown&logoColor=white)](https://www.markdownguide.org/)

> A lightweight Chrome extension that turns a Rate My Professors professor profile into a portable, readable Markdown document.

Click the extension icon while viewing a professor profile and the extension automatically:

## Features

- No popup or configuration screen required.
- Waits for additional ratings to load before extracting data.
- Includes profile details, source URL, export timestamp, and individual reviews.
- Captures rating, course, grade, date, and tags when available.
- Extension icon badge indicates when an export is in progress or has failed.
- Data is read from the active page and saved locally; there is no backend or account system.

## Example output

```markdown
# Professor Name

- **Rating:** 4.7
- **Number of ratings:** 12 ratings
- **Source:** https://www.ratemyprofessors.com/professor/123456
- **Exported:** 2026-10-30T05:00:00.000Z

## Reviews (12)

### Review 1
- **Rating:** 4.0
- **Course:** TELS3340
- **Date:** Jun 9th, 2026

Clear lectures, fair exams.
```

## Installation

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder.
5. Open a professor profile on [Rate My Professors](https://www.ratemyprofessors.com/).
6. Click the extension icon. The Markdown file downloads automatically.
