/**
 * Section Renderers
 * Component-aware post-processing for glassmorphism style
 */

/**
 * Post-process paper list — single glass card per paper, no internal components
 */
function processPapersSection(container) {
  const content = container.querySelector(".markdown-content");
  if (!content) return;

  // Find the "Full Publication List" heading to skip lists after it
  const fullPubHeading = Array.from(content.querySelectorAll("h1, h2")).find(
    (h) => h.textContent.includes("Full Publication")
  );
  if (fullPubHeading) {
    fullPubHeading.classList.add("full-pub-heading");
  }

  // Only process top-level ul (not nested inside li)
  const lists = content.querySelectorAll(":scope > ul");
  lists.forEach((list) => {
    // Skip lists that appear after "Full Publication List"
    if (
      fullPubHeading &&
      (fullPubHeading.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING)
    ) {
      // Wrap the entire list in one big glass card
      const card = document.createElement("div");
      card.className = "paper-full-list-card";
      list.parentNode.insertBefore(card, list);
      card.appendChild(list);
      return;
    }

    list.classList.add("paper-list");
    list.style.listStyle = "none";
    list.style.padding = "0";

    list.querySelectorAll(":scope > li").forEach((item) => {
      item.classList.add("paper-item");

      // Extract thumbnail image if present
      const img = item.querySelector("img");
      if (img) {
        const thumbDiv = document.createElement("div");
        thumbDiv.className = "paper-thumb";

        const bodyDiv = document.createElement("div");
        bodyDiv.className = "paper-body";

        // Move all children into bodyDiv first
        while (item.firstChild) {
          bodyDiv.appendChild(item.firstChild);
        }

        // Move image from bodyDiv into thumbDiv
        const foundImg = bodyDiv.querySelector("img");
        if (foundImg) {
          thumbDiv.appendChild(foundImg);
        }

        // Remove empty elements left behind by the image move
        Array.from(bodyDiv.children).forEach((child) => {
          if (child.children.length === 0 && child.textContent.trim() === "") {
            child.remove();
          }
        });

        item.appendChild(thumbDiv);
        item.appendChild(bodyDiv);
      }
    });
  });
}

/**
 * Post-process news section — glass timeline cards
 */
function processNewsSection(container) {
  const content = container.querySelector(".markdown-content");
  if (!content) return;

  const lists = content.querySelectorAll("ul");
  lists.forEach((list) => {
    list.classList.add("news-list");
    list.style.listStyle = "none";
    list.style.padding = "0";

    list.querySelectorAll(":scope > li").forEach((item) => {
      item.classList.add("news-item");

      // Extract date (e.g., **Jan 2024**)
      const html = item.innerHTML;
      const dateMatch = html.match(/^(?:\*\*|\*)([^*]+)(?:\*\*|\*)\s*(.*)$/s);

      if (dateMatch) {
        item.innerHTML = `
          <div class="news-date">${dateMatch[1].trim()}</div>
          <div class="news-content">${dateMatch[2].trim()}</div>
        `;
      }
    });
  });
}

/**
 * Post-process projects section — glass card grid
 */
function processProjectsSection(container) {
  const content = container.querySelector(".markdown-content");
  if (!content) return;

  // Only process top-level ul (not nested inside li)
  const lists = content.querySelectorAll(":scope > ul");
  lists.forEach((list) => {
    list.classList.add("project-grid");
    list.style.padding = "0";
    list.style.listStyle = "none";

    list.querySelectorAll(":scope > li").forEach((item) => {
      item.classList.add("project-card");

      // Find title
      const title = item.querySelector("strong, a");
      if (title) {
        const nameDiv = document.createElement("div");
        nameDiv.className = "project-name";
        nameDiv.appendChild(title.cloneNode(true));
        item.insertBefore(nameDiv, item.firstChild);
        title.remove();
      }

      // Extract tags (italic text)
      const tags = [];
      item.querySelectorAll("em").forEach((em) => {
        tags.push(em.textContent);
        em.remove();
      });

      // Wrap description
      const descText = item.textContent.trim();
      if (descText) {
        const desc = document.createElement("div");
        desc.className = "project-desc";
        desc.textContent = descText;
        item.appendChild(desc);
      }

      // Add tags
      if (tags.length > 0) {
        const tagsDiv = document.createElement("div");
        tagsDiv.className = "project-tags";
        tags.forEach((tag) => {
          const span = document.createElement("span");
          span.className = "pill-tag";
          span.textContent = tag;
          tagsDiv.appendChild(span);
        });
        item.appendChild(tagsDiv);
      }
    });
  });
}

/**
 * Get post-processor based on section ID
 */
function getSectionProcessor(sectionId) {
  const processors = {
    papers: processPapersSection,
    news: processNewsSection,
    notes: processNotesSection,
  };
  return processors[sectionId] || null;
}
