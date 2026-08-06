/**
 * Markdown Renderer Module
 * Handles fetching, parsing, and rendering Markdown content.
 */

class MarkdownRenderer {
  constructor() {
    this.cache = new Map();
    this.setupMarked();
  }

  /**
   * Configure marked.js with custom extensions
   */
  setupMarked() {
    if (typeof marked === "undefined") {
      console.warn("marked.js not loaded");
      return;
    }

    // Custom renderer for special components
    const renderer = new marked.Renderer();

    // Override heading rendering to add anchor links
    renderer.heading = (text, level, raw) => {
      const id = raw.toLowerCase().replace(/[^\w]+/g, "-");
      if (level === 2) {
        return `<h${level} id="${id}">${text}</h${level}>`;
      }
      return `<h${level}>${text}</h${level}>`;
    };

    // Override link rendering to add external link indicators
    renderer.link = (href, title, text) => {
      const isExternal = href.startsWith("http") && !href.includes(window.location.hostname);
      const target = isExternal ? 'target="_blank" rel="noopener noreferrer"' : "";
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${href}"${titleAttr} ${target}>${text}</a>`;
    };

    marked.setOptions({
      renderer,
      breaks: true,
      gfm: true,
      headerIds: true,
    });
  }

  /**
   * Fetch markdown content from a URL
   * @param {string} url - Path to markdown file
   * @returns {Promise<string>} Raw markdown text
   */
  async fetchMarkdown(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    // Detect file:// protocol and warn early
    if (window.location.protocol === "file:") {
      throw new Error(
        `Cannot load local files via file:// protocol due to browser CORS restrictions.\n\n` +
        `Please use a local HTTP server instead:\n` +
        `  python3 -m http.server 8000\n` +
        `Then open http://localhost:8000`
      );
    }

    try {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      this.cache.set(url, text);
      return text;
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      throw error;
    }
  }

  /**
   * Parse markdown text to HTML
   * @param {string} markdown - Raw markdown
   * @returns {string} Sanitized HTML
   */
  parseMarkdown(markdown) {
    if (typeof marked === "undefined") {
      return `<p class="error-message">Error: Markdown parser not available.</p>`;
    }

    const rawHtml = marked.parse(markdown);

    // Sanitize if DOMPurify is available
    if (typeof DOMPurify !== "undefined") {
      return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          "h1", "h2", "h3", "h4", "h5", "h6",
          "p", "br", "hr",
          "ul", "ol", "li",
          "strong", "em", "b", "i", "u", "s", "del",
          "a", "img",
          "code", "pre", "blockquote",
          "table", "thead", "tbody", "tr", "th", "td",
          "div", "span",
        ],
        ALLOWED_ATTR: [
          "href", "src", "alt", "title", "id", "class",
          "target", "rel",
        ],
      });
    }

    return rawHtml;
  }

  /**
   * Render markdown into a target element
   * @param {string} url - Markdown file URL
   * @param {HTMLElement} target - Element to render into
   * @param {Object} options - Rendering options
   */
  async renderToElement(url, target, options = {}) {
    target.innerHTML = '<div class="loading">Loading content...</div>';

    try {
      const markdown = await this.fetchMarkdown(url);
      const html = this.parseMarkdown(markdown);

      target.innerHTML = `<div class="markdown-content fade-in">${html}</div>`;

      // Apply post-processing
      if (options.postProcess) {
        options.postProcess(target);
      }

      // Dispatch custom event
      target.dispatchEvent(new CustomEvent("contentLoaded", {
        detail: { url, markdown, html },
      }));
    } catch (error) {
      const isCors = error.message.includes("file://") || error.message.includes("CORS");
      target.innerHTML = `
        <div class="error-message" style="white-space: pre-wrap; text-align: left;">
          <strong>⚠️ Failed to load content</strong><br><br>
          ${error.message.replace(/\n/g, "<br>")}<br><br>
          <small style="color: var(--color-text-muted)">File: ${url}</small>
        </div>
      `;
    }
  }

  /**
   * Clear cache for a specific URL or all URLs
   * @param {string} [url] - Specific URL to clear, or omit to clear all
   */
  clearCache(url) {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }
}

// Global instance
const renderer = new MarkdownRenderer();
