(() => {
  if (globalThis.__rmpMarkdownExporterLoaded) return;
  globalThis.__rmpMarkdownExporterLoaded = true;

  const clean = (value) => (value || "").replace(/\s+/g, " ").trim();
  const firstText = (selectors, root = document) => {
    for (const selector of selectors) {
      const element = root.querySelector(selector);
      const text = clean(element?.textContent);
      if (text) return text;
    }
    return "";
  };

  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  function isLoadMoreButton(button) {
    const label = clean(`${button.textContent} ${button.getAttribute("aria-label")}`);
    return /load\s*(more|additional)|show\s*more|view\s*more|next/i.test(label)
      && !button.disabled
      && button.offsetParent !== null;
  }

  async function loadAllReviews() {
    let clicks = 0;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const button = [...document.querySelectorAll("button, [role='button'], a")]
        .find(isLoadMoreButton);
      if (!button) break;
      const previousReviewCount = getReviewElements().length;
      button.click();
      clicks += 1;
      for (let waitAttempt = 0; waitAttempt < 10; waitAttempt += 1) {
        await wait(500);
        if (getReviewElements().length > previousReviewCount) break;
      }
    }
    return clicks;
  }

  function getReviewElements() {
    const candidates = [
      ...document.querySelectorAll("[data-testid*='review' i]"),
      ...document.querySelectorAll("[class*='Review' i]"),
      ...document.querySelectorAll("#ratingsList li, [id*='ratings' i] li"),
      ...document.querySelectorAll("li")
    ];
    const unique = [...new Set(candidates)];
    return unique.filter((element) => {
      const text = clean(element.textContent);
      return text.length > 20
        && /quality\s*\d/i.test(text)
        && !/load more|show more|advertisement/i.test(text);
    }).filter((element) => !unique.some((parent) => parent !== element && parent.contains(element)
      && clean(parent.textContent).length < 1.5 * clean(element.textContent).length));
  }

  function leafTexts(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const values = [];
    let node;
    while ((node = walker.nextNode())) {
      const text = clean(node.nodeValue);
      if (text && !values.includes(text)) values.push(text);
    }
    return values;
  }

  function parseReview(element) {
    const text = clean(element.textContent);
    const leaves = leafTexts(element);
    const course = (text.match(/\b[A-Z]{2,6}\s*\d{3,5}\b/) || [])[0] || "";
    const date = (text.match(
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/i
    ) || [])[0] || "";
    const quality = (text.match(/quality\s*(\d+(?:\.\d+)?)/i) || [])[1] || "";
    const grade = (text.match(/\bGrade:\s*([A-F](?:[+-])?)/i) || [])[1] || "";
    const reviewText = leaves
      .filter((value) => value.length > 25)
      .filter((value) => !/^(?:Quality|Difficulty|Would Take Again|For Credit|Attendance|Grade|Textbook):/i.test(value))
      .filter((value) => value !== course && value !== date)
      .sort((left, right) => right.length - left.length)[0] || "";
    const rating = firstText([
      "[data-testid*='rating' i]",
      "[class*='Rating' i]",
      "[aria-label*='rating' i]"
    ], element) || quality;
    const parsedCourse = firstText([
      "[data-testid*='course' i]",
      "[class*='Course' i]"
    ], element) || course;
    const parsedGrade = firstText([
      "[data-testid*='grade' i]",
      "[class*='Grade' i]"
    ], element) || grade;
    const parsedDate = firstText([
      "time",
      "[data-testid*='date' i]",
      "[class*='Date' i]"
    ], element) || date;
    const tags = [...element.querySelectorAll(
      "[data-testid*='tag' i], [class*='Tag' i], [class*='tag' i]"
    )].map((tag) => clean(tag.textContent)).filter(Boolean);

    const selectedReviewText = firstText([
      "[data-testid*='comment' i]",
      "[data-testid*='text' i]",
      "[class*='Comment' i]",
      "[class*='Text' i]"
    ], element) || reviewText;
    return {
      rating,
      course: parsedCourse,
      grade: parsedGrade,
      date: parsedDate,
      tags: [...new Set(tags)],
      text: selectedReviewText || text
    };
  }

  function extractProfile() {
    const name = firstText([
      "[data-testid='professor-name']",
      "[data-testid*='professor' i] h1",
      "h1"
    ]);
    const rating = firstText([
      "[data-testid*='overall-rating' i]",
      "[data-testid*='rating-value' i]",
      "[class*='RatingValue__Numerator']",
      "[class*='RatingValue' i]"
    ]);
    const ratingCount = firstText([
      "[data-testid*='rating-count' i]",
      "[data-testid*='num-rating' i]",
      "[class*='RatingValue__NumRatings']",
      "[class*='RatingCount' i]"
    ]) || (clean(document.body.textContent).match(/\b\d[\d,]*\s+ratings?\b/i) || [])[0] || "";
    const reviews = getReviewElements().map(parseReview);

    if (!name && !reviews.length) {
      throw new Error("This does not look like a professor profile, or the page has not finished loading.");
    }
    return { name, rating, ratingCount, reviews, url: location.href };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "EXPORT_PROFILE") return;
    (async () => {
      try {
        await loadAllReviews();
        sendResponse({ ok: true, profile: extractProfile() });
      } catch (error) {
        sendResponse({ ok: false, error: error.message || "Could not extract the profile." });
      }
    })();
    return true;
  });
})();
