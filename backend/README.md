<div align="center">

# ⚙️ Backend API Services

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=Health%20System%20Backend&fontSize=50&animation=fadeIn" alt="Header Banner" />

**The core API services, business logic, authentication flow, and database interactions for the Health Management System.**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini API](https://img.shields.io/badge/Gemini_API-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)

</div>

---

<br/>

## 💻 Tech Stack & Why We Used It

| Technology | Rationale |
| :--- | :--- |
| **Node.js & Express.js** | Minimalist and flexible routing for modular REST endpoints and custom middleware. |
| **TypeScript** | Static typing for strictly defining models (`Patient`, `Appointment`, etc.), preventing platform data mismatches. |
| **Supabase PostgreSQL** | Robust relational databases and authentication provider with easy row-level security and seamless auth workflow. |
| **Google Gemini API** | Server-side AI powering Smart Diagnosis, Health Chatbots, and Lab Analyzers natively via queues. |
| **PDF Generation** | Dynamic text generation for doctors to uniformly export prescriptions and save reliable patient records. |
| **Swagger (OpenAPI)** | Auto-generated, interactive documentation (`src/docs/swagger.ts`) to radically simplify endpoint testing locally. |

<br/>

## 📂 Key Architecture

*   🛤️ **Controllers & Routes**: Separated logic directly tied to `/admin`, `/patient`, `/doctor`, `/appointment`, and `/ai`.
*   🛡️ **Middleware Layers**: Custom reusable scripts like `authMiddleware.ts` (Validating tokens), `roleMiddleware.ts` (Ensuring correct privileges), and `rateLimiter.ts` (DDOS protection).
*   🛠️ **Services**: Dedicated helper modules encapsulating complex logic (e.g., Supabase client connection, Queue management, and PDF formatting tasks).

<br/>

## 🚀 Getting Started

1. Install backend dependencies:
   ```bash
   npm install
   # or yarn / pnpm install
   ```
2. Set up your `.env` file with essential environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`).
3. Run the development server build step:
   ```bash
   npm run dev
   ```
4. Access the API documentation dynamically (Swagger UI) typically at `/api-docs` to test existing routes.

<br/>

---

<div align="center">
  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Rocket.png" alt="Rocket" width="25" height="25" />
  <p><i>The engine behind an intelligent healthcare system.</i></p>
</div>
