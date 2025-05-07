# AI Plan Poker (Scrum Estimator)

A modern, collaborative Scrum Poker web application for agile teams. Estimate user stories in real-time with your team, powered by Supabase and React, and enhanced by AI-driven suggestions for faster, smarter planning.

---

## 🚀 Features
- **Session-based Planning:** Create or join planning sessions with unique IDs
- **Real-Time Collaboration:** See team votes instantly with live updates
- **Secure Authentication:** User registration, login, logout, and password reset via Supabase Auth
- **Story Management:** Add, edit, and estimate user stories per session
- **Voting & Finalization:** Vote on stories, finalize estimates, and view summary results
- **AI Suggestions:** Get AI-generated estimate hints and notes for each story
- **Collapsible Summaries:** Clean UI with expandable/collapsible story summaries
- **Admin Controls:** Delete sessions, end sessions, and secure access
- **Glassmorphism UI:** Beautiful, modern, and responsive design

---

## 🛠️ Tech Stack
- **Frontend:** React (TypeScript), Zustand, React Router, Lucide Icons, Tailwind CSS
- **Backend:** Supabase (Database, Auth, Realtime)
- **State Management:** Zustand
- **Deployment:** Vercel/Netlify (or any static host)

---

## ⚡ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/JasonViviers/AIPlanPoker.git
cd AIPlanPoker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase keys:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note:** `.env` is gitignored for security.

### 4. Set Up Supabase
- Create a new project at [supabase.com](https://supabase.com/)
- Create the following tables:
  - `sessions` (id: uuid, name: text, created_by: uuid, created_at: timestamp, ended_at: timestamp nullable)
  - `stories` (id: uuid, session_id: uuid, title: text, description: text, suggested_estimate: int, final_estimate: int, created_at: timestamp)
  - `votes` (id: uuid, story_id: uuid, user_id: uuid, estimate: int)
  - `participants` (session_id: uuid, user_id: uuid)
- Enable Row Level Security (RLS) and configure policies for each table.
- Set up Supabase Auth (email/password).

### 5. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Security
- All sensitive files (like `.env`) are excluded from git via `.gitignore`.
- Supabase RLS policies restrict access by user/session.
- Never expose your service keys in the frontend.

---

## 📦 Deployment
- Deploy to [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/) for instant hosting.
- Configure the same environment variables in your deployment dashboard.
- Ensure your Supabase project is production-ready (email confirmation, RLS, etc).

---

## 🧩 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Open a Pull Request

---

## 📄 License
[MIT](LICENSE)

---

## 🙏 Credits
- [Supabase](https://supabase.com/)
- [React](https://react.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Lucide Icons](https://lucide.dev/)

---

## 📊 Analytics & Future
- Add analytics integrations for team insights
- Expand AI features for smarter estimation
- Integrate with Jira/Linear for story import/export

---

For questions or support, please open an issue on GitHub.
