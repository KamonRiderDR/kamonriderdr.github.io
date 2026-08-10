/**
 * For backend
 * Notes Module
 * Handles notes list (card grid) and note detail rendering.
 */

/**
 * Load a specific note by slug
 * @param {string} slug - Note filename without .md extension
 */
function loadNote(slug) {
  const contentEl = document.getElementById("dynamic-content");
  const mainEl = document.querySelector(".main-content");
  mainEl.classList.remove("wide");

  // Update URL without triggering hashchange
  history.pushState(null, null, `#notes/${slug}`);

  // Keep Notes nav link active
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.toggle("active", link.dataset.section === "notes");
  });

  window.scrollTo({ top: 0, behavior: "smooth" });

  renderer.renderToElement(`backend/notes/${slug}.md`, contentEl, {
    postProcess: (container) => {
      const content = container.querySelector(".markdown-content");
      if (!content) return;

      // Add note-content class for scoped styling
      content.classList.add("note-content");

      // Insert back button
      const backBtn = document.createElement("a");
      backBtn.className = "note-back-btn";
      backBtn.textContent = "← Back to Notes";
      backBtn.href = "javascript:void(0)";
      backBtn.onclick = (e) => {
        e.preventDefault();
        navigateTo("notes");
      };
      content.insertBefore(backBtn, content.firstChild);
    },
  });
}

/**
 * Post-process notes list — glass card grid with click-to-load
 */
function processNotesSection(container) {
  const content = container.querySelector(".markdown-content");
  if (!content) return;

  // Add note-list class for scoped styling
  content.classList.add("note-list");

  const lists = content.querySelectorAll(":scope > ul");
  lists.forEach((list) => {
    list.classList.add("project-grid");
    list.style.padding = "0";
    list.style.listStyle = "none";

    list.querySelectorAll(":scope > li").forEach((item) => {
      item.classList.add("project-card");
      item.style.cursor = "pointer";

      // Extract slug from link href
      const link = item.querySelector("a");
      let slug = "";
      if (link) {
        slug = link.getAttribute("href");
        link.removeAttribute("href");
        link.style.cursor = "pointer";
      }

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

      // Click to load note
      if (slug) {
        item.addEventListener("click", () => {
          loadNote(slug);
        });
      }
    });
  });
}
