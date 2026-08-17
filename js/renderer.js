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

    // Protect math blocks from Markdown backslash escaping
    const mathBlocks = [];
    let protectedMd = markdown;

    // Protect display math $$...$$
    protectedMd = protectedMd.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
      const id = mathBlocks.length;
      mathBlocks.push({ type: "display", math });
      return `MATHDISPLAY${id}`;
    });

    // Protect inline math $...$
    protectedMd = protectedMd.replace(/(?<!\$)\$(?!\$)([^\n$]+?)\$(?!\$)/g, (match, math) => {
      const id = mathBlocks.length;
      mathBlocks.push({ type: "inline", math });
      return `MATHINLINE${id}`;
    });

    const rawHtml = marked.parse(protectedMd);

    // Restore math blocks
    let html = rawHtml;
    mathBlocks.forEach((block, id) => {
      const placeholder = block.type === "display"
        ? `MATHDISPLAY${id}`
        : `MATHINLINE${id}`;
      const replacement = block.type === "display"
        ? `$$${block.math}$$`
        : `$${block.math}$`;
      html = html.replace(placeholder, replacement);
    });

    // TODO: 公式居中 bug — 解包 <p> 后 MathJax 仍可能将 $$...$$ 当成 inline math 处理，
    // 导致行间公式不居中。当前用 JS 强制设置了 display/textAlign 作为临时 workaround，
    // 需要后续找到更优雅的方案（如 marked 扩展或 MathJax 自定义 tex 处理器）。
    // Unwrap display math from <p> so MathJax treats them as block math
    html = html.replace(/<p>\s*(\$\$[\s\S]*?\$\$)\s*<\/p>/g, "$1");

    // Sanitize if DOMPurify is available
    if (typeof DOMPurify !== "undefined") {
      return DOMPurify.sanitize(html, {
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

    return html;
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

      // Typeset math with MathJax
      // TODO: 行间公式居中问题 — 当前在 typeset 完成后用 JS 强制设置 display/textAlign，
      // 属于临时 workaround。根本原因可能是 marked.js 将 $$...$$ 包进 <p> 后 MathJax
      // 识别为 inline math，或 MathJax 样式表加载时机问题。待后续排查。
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([target]).then(() => {
          target.querySelectorAll("mjx-container").forEach((el) => {
            if (el.getAttribute("display") === "true") {
              el.style.display = "block";
              el.style.textAlign = "center";
              el.style.margin = "20px 0";
            }
          });
        }).catch((err) => {
          console.warn("MathJax typeset failed:", err);
        });
      }

      // Syntax highlight code blocks
      if (window.Prism) {
        const blocks = target.querySelectorAll('pre code[class*="language-"]');
        blocks.forEach((block) => {
          try {
            Prism.highlightElement(block);
          } catch (e) {
            console.warn("Prism highlight failed for", block.className, e);
          }
        });
      } else {
        console.warn("Prism.js not loaded — skipping syntax highlight");
      }

      // Image captions — detect "![alt](src)" followed by "*caption*"
      const contentEl = target.querySelector(".markdown-content");
      if (contentEl) {
        contentEl.querySelectorAll("img").forEach((img) => {
          const imgP = img.closest("p");
          if (!imgP) return;

          // Case 1: caption is in the next <p>
          const nextP = imgP.nextElementSibling;
          if (nextP && nextP.tagName === "P") {
            const em = nextP.querySelector(":scope > em");
            if (em && nextP.children.length === 1) {
              nextP.classList.add("img-caption");
              return;
            }
          }

          // Case 2: caption is in the same <p> after a <br> (breaks: true)
          const allEms = imgP.querySelectorAll("em");
          for (const em of allEms) {
            if (img.compareDocumentPosition(em) & Node.DOCUMENT_POSITION_FOLLOWING) {
              const captionP = document.createElement("p");
              captionP.className = "img-caption";
              captionP.appendChild(em.cloneNode(true));
              imgP.parentNode.insertBefore(captionP, imgP.nextSibling);
              em.remove();
              imgP.querySelectorAll("br").forEach((br) => br.remove());
              break;
            }
          }
        });
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
