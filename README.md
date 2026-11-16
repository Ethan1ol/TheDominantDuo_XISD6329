[README.md](https://github.com/user-attachments/files/34923932/README.md)

# Legacies Screen Printers – Customer & Staff Website

Live Site: https://ethan1ol.github.io/TheDominantDuo_XISD6329/

A responsive **web application** built for **Legacies Screen Printers**, with a customer portal for placing and tracking orders and a staff portal for running the workshop. The website talks to a **C# ASP.NET Core Web API** hosted on **Azure App Service**, which stores everything in an **Azure SQL Database** shared with the Legacies Android app.

This project was built to move the business away from manual paper records, centralise customer orders and vinyl stock, and cut down on constant phone and email enquiries about order progress.

---

## 🚀 Key Features
* **Public Order Tracking:** Anyone can track an order by its reference from the home page without signing in. Names and phone numbers are masked.
* **Sign In, Registration & Google Single Sign-On:** Customers sign in with email and password or with Google. The same account works on the website and the mobile app.
* **Customer Portal:** Customers see their latest order on their home page, place new orders with several designs and live vinyl prices, and follow each order through a four-stage production timeline.
* **Staff Dashboard:** Live counts of customers, orders still in production and low-stock materials, with cards linking to each section.
* **Customers & Walk-in Orders:** Staff search customers, add someone who phoned or walked in, and record their order at the counter so every job ends up in the same system.
* **Production Orders:** Staff see every order, where it came from (app, website or walk-in), and move it to the next production stage. Customers see the change on the website and the app.
* **Vinyl Inventory:** A live stock table with low-stock flags, stock adjustments and adding new materials.
* **Secure Sessions & Roles:** JWT tokens protect every request, staff pages are restricted to admin accounts, and expired sessions send the user back to sign in.
* **Privacy & Account Deletion:** Privacy policy and account deletion pages, as required for Google Play.

---

## 🛠️ Technology Stack & Architecture
* **Frontend:** HTML5, CSS3, vanilla JavaScript (no framework), Google Identity Services (Google sign-in)
* **Backend:** C#, ASP.NET Core Web API (.NET 10), Entity Framework Core, JWT authentication, BCrypt password hashing ([API repo](https://github.com/Ethan1ol/LegaciesScreenPrintersAPI))
* **Database:** Azure SQL Database (relational design shared with the mobile app)
* **Hosting & DevOps:** GitHub Pages (website), Azure App Service (API), GitHub Actions (HTML validation, JavaScript checks, link checks and automatic deployment)
* **Related:** Android mobile app ([APK repo](https://github.com/Saafie/LegaciesScreenPrintersAPK))

---

## 📂 Project Structure
```text
TheDominantDuo_XISD6329/
│
├── index.html                # Public home page with order tracking
├── login.html                # Sign in, registration and Google sign-in
├── customer_dashboard.html   # Customer home with their latest order
├── customers_order.html      # Customer order placement
├── order_search.html         # Customer "My orders" and production timeline
├── dashboard.html            # Staff dashboard
├── customers.html            # Staff customers and walk-in orders
├── orders.html               # Staff production orders
├── inventory.html            # Staff vinyl inventory
├── privacy.html              # Privacy policy
├── delete-account.html       # Account deletion request
│
├── css/style.css             # Shared styles for every page
├── js/
│   ├── config.js             # API address and Google client ID
│   ├── api.js                # API calls and shared page helpers
│   ├── auth.js               # Signed-in session and page access rules
│   ├── layout.js             # Shared header, navigation and footer
│   └── *.js                  # One script per page (dashboard, inventory, orders, etc.)
├── images/                   # Logo and site images
├── docs/screenshots/         # Screenshots of every page
└── .github/                  # Pages workflow and check scripts
```

---

## ⚙️ Setup & Local Installation

### 1. Viewing the Website
1. Open the live site: https://ethan1ol.github.io/TheDominantDuo_XISD6329/
2. Or run it locally from the project folder with any static web server, for example:
   ```bash
   python -m http.server 8080
   ```
   Then browse to `http://localhost:8080`.
3. The site uses the hosted Azure API by default, so no backend setup is needed.

### 2. Using a Local API (optional)
1. Clone and run the [API project](https://github.com/Ethan1ol/LegaciesScreenPrintersAPI) on your machine.
2. Change the API address in `js/config.js`:
   ```javascript
   const API_URL = "http://localhost:5000/api";
   ```
3. Google sign-in only works on addresses added to the Google client's authorised origins.

### 3. Deploying
* Every push to `main` is checked and then deployed to GitHub Pages automatically.
* In the repository, set **Settings → Pages → Source** to **GitHub Actions**.

---

## 🔄 Development & Collaboration Workflow
* Managed with Git branches for feature development and bug fixes.
* GitHub Actions validates the HTML, checks the JavaScript and local links on every push and pull request, and only deploys when the checks pass.
* Shared scripts for the API, sessions and page layout keep every page consistent, and all data goes through the API over structured JSON REST contracts.
