/* Website settings: the API address and the Google client ID.
 * Set PRODUCTION_API_URL once the API is hosted and googleClientId once Google sign-in is set up. */
(function () {
  "use strict";

  // Hosted API address, e.g. "https://legacies-api.azurewebsites.net/api".
  const PRODUCTION_API_URL = "https://legacies-api-f3aegcbcfdh9azhm.uaenorth-01.azurewebsites.net/api";
  const LOCAL_API_URL = "http://localhost:5000/api";

  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "" || window.location.protocol === "file:";

  window.LSP_CONFIG = Object.freeze({
    apiBaseUrl: isLocal || !PRODUCTION_API_URL ? LOCAL_API_URL : PRODUCTION_API_URL,
    googleClientId: "",
  });
})();
