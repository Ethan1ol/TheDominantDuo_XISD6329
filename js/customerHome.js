/* customerHome.js - customer home page: greets the user and shows their most recent order. */
(function () {
  "use strict";
  const session = LSP.session.requireSignedIn();
  if (!session) return; // redirecting to login or the customer home page
  const { status } = LSP.dom;

  document.getElementById("welcome").textContent = `Welcome, ${session.fullName.split(" ")[0] || "back"}`;

  /** Loads the signed-in customer's orders (newest first) and shows the latest one. */
  async function loadLatest() {
    const statusBox = document.getElementById("latestStatus");
    try {
      const orders = await LSP.api.fetch("/orders/mine");
      if (!orders.length) {
        status(statusBox, "You haven't placed any orders yet.", "info");
        return;
      }
      status(statusBox, "");
      LSP.track.render(document.getElementById("latestOrder"), orders[0]);
      LSP.log("Orders", "info", `Loaded ${orders.length} order(s); latest ${orders[0].orderRef}.`);
    } catch (e) {
      status(statusBox, e.message, "error");
    }
  }

  loadLatest();
})();
