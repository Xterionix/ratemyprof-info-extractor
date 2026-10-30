# Rate My Professors Markdown Exporter

This Chrome extension exports the professor name, overall rating, rating count, and reviews from a Rate My Professors profile into a `.md` file.

## Install locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose this folder.
4. Open a professor profile on [Rate My Professors](https://www.ratemyprofessors.com/).
5. Click the extension icon. The Markdown file downloads automatically.

The extension clicks visible “Load more” / “Show more” review controls until there are no more, then downloads a Markdown file named after the professor.

If you update the unpacked extension, click **Reload** on its card in `chrome://extensions`, then refresh the professor page before exporting again.
