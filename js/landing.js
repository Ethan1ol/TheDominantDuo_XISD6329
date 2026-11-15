/* landing.js - public home page: track an order by its reference without signing in. */
(function () {
  "use strict";
  const form = document.getElementById("trackForm");
  const input = document.getElementById("trackRef");
  const result = document.getElementById("trackResult");
  const statusBox = document.getElementById("trackStatus");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    LSP.track.trackByRef(input.value, result, statusBox);
  });

  const ref = new URLSearchParams(window.location.search).get("ref");
  if (ref) {
    input.value = ref;
    LSP.track.trackByRef(ref, result, statusBox);
  }
})();
