<div align="center">

# 💝 GiftBloom

### *Every Gift Deserves Love* ❤️

**A crowdfunding platform where friends and family come together to fund one perfect gift.**

[![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Powered by Google Apps Script](https://img.shields.io/badge/Backend-Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/apps-script)
[![Database: Google Sheets](https://img.shields.io/badge/Database-Google%20Sheets-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)](https://www.google.com/sheets/about/)
[![AI: Gemini](https://img.shields.io/badge/AI-Gemini-8E75FF?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

[Live Demo](#) · [Report a Bug](#) · [Request a Feature](#)

</div>

---

## 🎁 What is GiftBloom?

Ever wanted to get someone a gift that's just a little too expensive to buy alone? **GiftBloom** turns that into a group effort. Someone creates a campaign for a gift — the receiver, the occasion, the target amount — and shares it with friends and family, who chip in whatever they can. When the goal is hit, the gift gets bought, and the surprise gets delivered. 🎉

No more group-chat chaos of "who's collecting the money" — just one clean link, one shared goal, and one unforgettable moment.

---

## ✨ Features

| | |
|---|---|
| 💌 **Create a Campaign** | Set a gift, receiver, occasion, target amount, and deadline in minutes |
| 🌸 **Live Trending Campaigns** | Homepage dynamically pulls the most-donated-to active campaigns from Google Sheets |
| 💰 **UPI-Based Donations** | Donors scan a QR code and contribute directly — no payment gateway fees |
| 🤖 **AI Gift Assistant** | A Gemini-powered chatbot that suggests gifts, explains how the platform works, and guides users to the right page |
| 🎊 **Smart, Personalized Greetings** | The assistant greets logged-in users by name, and shows festival greetings *based on the visitor's actual state* — Durga Puja for Kolkata, Ganesh Chaturthi for Maharashtra, Teej for Rajasthan, and more — powered by live festival data, not hardcoded dates |
| 📊 **Live Stats Dashboard** | Animated counters for total campaigns, donors, funds raised, and completed gifts |
| 🔐 **Secure Auth Flow** | Signup, login, and email-based password reset with expiring secure tokens |
| 🛠️ **Admin Console** | Verify/reject payments, moderate campaigns, and manage users from a dedicated dashboard |
| 📱 **Fully Responsive** | Glassmorphism UI with smooth scroll reveals, card tilt effects, and a custom canvas heart-particle loader |

---

## 🧱 Tech Stack

```
Frontend    →  HTML5, CSS3, Vanilla JavaScript
Backend     →  Google Apps Script (REST-style API)
Database    →  Google Sheets
File Storage → Google Drive
AI Engine   →  Gemini API
Hosting     →  GitHub Pages
```

No frameworks, no build step, no server to maintain — just Google's own stack doing the heavy lifting behind a hand-built glass-UI frontend.

---

## 🏗️ How It Works

```
   1. Create           2. Share            3. Support           4. Celebrate
  ┌─────────┐       ┌─────────┐         ┌─────────┐         ┌─────────┐
  │  🎁      │  ──▶  │  📤      │   ──▶   │  💝      │   ──▶   │  🎉      │
  │ Campaign │       │  Link    │         │ Donations│         │  Gift!   │
  └─────────┘       └─────────┘         └─────────┘         └─────────┘
```

1. **Create** — Pick a gift, name the occasion, set a target amount and date.
2. **Share** — Send the campaign link to friends and family.
3. **Support** — Everyone chips in via UPI, tracked live on a progress bar.
4. **Celebrate** — Goal reached, gift bought, surprise delivered. ❤️

---

## 📂 Project Structure

```
GiftBloom/
├── index.html              # Homepage — trending campaigns, stats, chatbot
├── login.html               # Login + forgot password
├── signup.html               # Registration
├── create.html               # Campaign creation form
├── allCampaigns.html         # Browse all campaigns
├── campaigns.html            # Single campaign view + donation flow
├── dashboard(combined).html  # User dashboard / profile
├── admin.html                 # Admin console
├── style.css                  # Glassmorphism theme, animations
├── script.js                  # Core frontend logic + chatbot
└── Code.gs                    # Google Apps Script backend (API + Sheets)
```

---

## 🚀 Getting Started

### Prerequisites
- A Google account (for Sheets, Drive, and Apps Script)
- A [Gemini API key](https://ai.google.dev/)

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/<your-username>/GiftBloom.git
   ```

2. **Set up the backend**
   - Create a Google Sheet with `Users`, `Campaigns`, `Donation`, and `Reports` tabs
   - Open [Apps Script](https://script.google.com), paste in `Code.gs`
   - Add your `SHEET_URL` and `FOLDER_ID` in the config section
   - Store your Gemini key in **Project Settings → Script Properties** as `GEMINI_API_KEY`
   - Deploy as a **Web App** (Execute as: *Me*, Access: *Anyone*) and copy the deployment URL

3. **Connect the frontend**
   - Paste your deployment URL into `API_URL` in `script.js`

4. **Run it**
   - Open `index.html` in a browser, or serve the folder with any static host / GitHub Pages

---

## 🎨 Design Philosophy

GiftBloom leans into a soft **pink-and-glass aesthetic** — frosted-glass cards, floating heart particles, gentle scroll reveals, and a custom canvas-based heart-formation loader — to make giving feel warm rather than transactional.

---

## 🗺️ Roadmap

- [ ] Google OAuth login
- [ ] Payment gateway integration (beyond UPI QR)
- [ ] Push notifications for campaign milestones
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#) or open a pull request.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with 💝 by **Piyush**

*If GiftBloom made your day a little brighter, consider giving this repo a ⭐*

</div>
