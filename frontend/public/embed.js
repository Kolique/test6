/**
 * MairIA — Embeddable Chat Widget
 *
 * Usage: add this to any website:
 *
 *   <script src="https://your-mairia-domain.com/embed.js"
 *           data-tenant-id="YOUR_TENANT_UUID"
 *           data-color="#0055A4"></script>
 *
 * Options (via data attributes):
 *   data-tenant-id  (required) — UUID of the mairie tenant
 *   data-color      (optional) — Primary color, default #0055A4
 *   data-position   (optional) — "right" (default) or "left"
 *   data-base-url   (optional) — MairIA frontend URL (auto-detected)
 */
(function () {
  "use strict";

  // Find our own script tag to read data attributes
  var scripts = document.querySelectorAll('script[data-tenant-id]');
  var script = scripts[scripts.length - 1];
  if (!script) return;

  var tenantId = script.getAttribute("data-tenant-id");
  if (!tenantId) {
    console.error("[MairIA] data-tenant-id is required");
    return;
  }

  var color = script.getAttribute("data-color") || "#0055A4";
  var position = script.getAttribute("data-position") || "right";
  var baseUrl =
    script.getAttribute("data-base-url") ||
    script.src.replace(/\/embed\.js.*$/, "");

  // Styles
  var BUTTON_SIZE = 56;
  var WIDGET_WIDTH = 380;
  var WIDGET_HEIGHT = 560;
  var MARGIN = 16;

  // State
  var isOpen = false;

  // Create container
  var container = document.createElement("div");
  container.id = "mairia-widget-container";
  container.style.cssText =
    "position:fixed;bottom:" +
    MARGIN +
    "px;" +
    position +
    ":" +
    MARGIN +
    "px;z-index:999999;font-family:system-ui,sans-serif;";
  document.body.appendChild(container);

  // Create toggle button
  var button = document.createElement("button");
  button.id = "mairia-toggle";
  button.setAttribute("aria-label", "Ouvrir le chat");
  button.style.cssText =
    "width:" +
    BUTTON_SIZE +
    "px;height:" +
    BUTTON_SIZE +
    "px;border-radius:50%;border:none;cursor:pointer;" +
    "background:" +
    color +
    ";color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.15);" +
    "display:flex;align-items:center;justify-content:center;transition:transform 0.2s;" +
    "position:absolute;bottom:0;" +
    position +
    ":0;";
  button.innerHTML =
    '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" ' +
    'd="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>' +
    "</svg>";
  container.appendChild(button);

  // Create chat iframe container
  var chatBox = document.createElement("div");
  chatBox.id = "mairia-chatbox";
  chatBox.style.cssText =
    "position:absolute;bottom:" +
    (BUTTON_SIZE + 12) +
    "px;" +
    position +
    ":0;" +
    "width:" +
    WIDGET_WIDTH +
    "px;height:" +
    WIDGET_HEIGHT +
    "px;" +
    "border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.16);" +
    "display:none;background:#fff;transition:opacity 0.2s,transform 0.2s;" +
    "opacity:0;transform:translateY(10px);";
  container.appendChild(chatBox);

  // Create iframe
  var iframe = document.createElement("iframe");
  iframe.src = baseUrl + "/widget/" + tenantId;
  iframe.style.cssText =
    "width:100%;height:100%;border:none;border-radius:16px;";
  iframe.setAttribute("title", "Chat MairIA");
  iframe.setAttribute(
    "sandbox",
    "allow-scripts allow-same-origin allow-forms"
  );
  chatBox.appendChild(iframe);

  // Toggle logic
  function toggle() {
    isOpen = !isOpen;
    if (isOpen) {
      chatBox.style.display = "block";
      // Trigger reflow then animate
      chatBox.offsetHeight;
      chatBox.style.opacity = "1";
      chatBox.style.transform = "translateY(0)";
      button.innerHTML =
        '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>' +
        "</svg>";
      button.setAttribute("aria-label", "Fermer le chat");
    } else {
      chatBox.style.opacity = "0";
      chatBox.style.transform = "translateY(10px)";
      setTimeout(function () {
        chatBox.style.display = "none";
      }, 200);
      button.innerHTML =
        '<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" ' +
        'd="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>' +
        "</svg>";
      button.setAttribute("aria-label", "Ouvrir le chat");
    }
  }

  button.addEventListener("click", toggle);

  // Responsive: on small screens, make the widget full-width
  function handleResize() {
    var isMobile = window.innerWidth < 480;
    if (isMobile) {
      chatBox.style.width = "calc(100vw - " + MARGIN * 2 + "px)";
      chatBox.style.height = "calc(100vh - " + (BUTTON_SIZE + MARGIN * 2 + 12) + "px)";
      chatBox.style[position] = "0";
    } else {
      chatBox.style.width = WIDGET_WIDTH + "px";
      chatBox.style.height = WIDGET_HEIGHT + "px";
    }
  }

  window.addEventListener("resize", handleResize);
  handleResize();
})();
