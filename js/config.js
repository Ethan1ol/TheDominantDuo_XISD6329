/* Website settings: the API address and the Google client ID. */
(function () {
  "use strict";

  // The hosted API on Azure (used when the site runs locally and on GitHub Pages).
  const API_URL = "https://legacies-api-f3aegcbcfdh9azhm.uaenorth-01.azurewebsites.net/api";

  window.LSP_CONFIG = Object.freeze({
    apiBaseUrl: API_URL,
    googleClientId: "493224130544-54qp1tj0s79lekair2scgqb1l34bitit.apps.googleusercontent.com",
  });
})();
