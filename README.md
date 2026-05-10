```markdown
# 🥬 TaleenFresh | Enterprise-Grade Agri-Tech SaaS

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Security](https://img.shields.io/badge/Security-L9_Architected-red?style=for-the-badge)

## 🛡️ 1. Intellectual Property Notice & Legal Defense
**Proprietary Software — All Rights Reserved.**

This repository contains high-value, proprietary trade secrets and architecturally sensitive code owned by the **TaleenFresh** founders. 

* **Zero-Tolerance Policy:** Unauthorized copying, modification, or distribution of this code via any medium is strictly prohibited. 
* **Legal Protection:** This codebase is protected by international copyright laws and modern digital forensics. 
* **Anti-Plagiarism:** Every architectural pattern (including the proprietary Atomic Transaction logic and Offline Synchronization Queue) is uniquely fingerprinted.

---

## 🏗️ 2. Architectural Vision
TaleenFresh is a **Mission-Critical Agri-Tech Infrastructure** engineered to handle internet-scale traffic with a focus on Resilience, Atomic Financial Integrity, and Offline-First UX.

### 💎 Key Architectural Pillars:
* **Atomic Financial Layer:** Payment processing, commission distribution (2.5%), and order status updates occur in a single, non-divisible database transaction to guarantee zero financial loss.
* **State-of-the-Art PWA:** Implements a sophisticated Offline Sync Queue. Orders are queued locally during network failure and background-synced upon reconnection.
* **Defensive Middleware:** Multi-layer security including Redis-backed sliding-window rate limiting (10 req/10s) and timing-safe admin authentication.
* **Real-Time Observability:** Instantaneous administrative radar with haptic and auditory feedback for live order management.

---

## 🛠️ 3. Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16.2 (App Router) + React 19.2 |
| **Language** | TypeScript (Strict Mode target: ES2017) |
| **Database & Auth** | Supabase (PostgreSQL, GoTrue, Realtime) |
| **State Management**| Zustand + IndexedDB (via idb-keyval) for persistent cart |
| **Payments** | Paymob Integration with HMAC-SHA256 Verification |
| **Security/Rate Limit**| Upstash Redis + Crypto Timing-Safe Equals |
| **Monitoring/E2E** | Sentry (Server/Edge/Client) + Playwright |
| **Styling** | Tailwind CSS v4 + Radix UI + Framer Motion |

---

## 📂 4. Project Structure (Separation of Concerns)

```text
📦 src
 ┣ 📂 app
 ┃ ┣ 📂 (admin)          # Protected Admin Dashboard routes
 ┃ ┣ 📂 (auth)           # Admin Login & Security layer
 ┃ ┣ 📂 (customer)       # Customer Storefront & Checkout
 ┃ ┣ 📂 api/webhooks     # Paymob Webhooks, Workers, and DLQ
 ┃ ┗ 📜 sw.ts            # Service Worker & Offline Sync Logic
 ┣ 📂 components
 ┃ ┣ 📂 admin            # Realtime Admin Components
 ┃ ┣ 📂 customer         # Interactive UI & Floating Cart
 ┃ ┗ 📂 ui               # Reusable Radix/Tailwind Primitives
 ┣ 📂 hooks              # Custom React Hooks (useCart, useHaptics)
 ┣ 📂 store              # Zustand State Management
 ┗ 📂 lib                # Supabase clients and utility functions

```

---

## ⚙️ 5. Environment Configuration

To run this system, the following strict environment variables are required in your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # CRITICAL: Keep secure

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Admin Security
ADMIN_SECRET_PIN=your_4_digit_pin
ADMIN_SECRET_TOKEN=your_secure_generated_token

# Paymob Payment Gateway
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_IFRAME_ID=your_iframe_id
PAYMOB_HMAC_SECRET=your_hmac_secret # Used for Webhook verification

# Sentry Observability
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

```

---

## 🚀 6. Local Development & Deployment

### Setup

We enforce strict package management and type safety.

```bash
# 1. Install dependencies
pnpm install

# 2. Run the development server with Turbopack
pnpm dev

```

### Production Build

```bash
# Type-check, compile PWA assets, and build
pnpm build
pnpm start

```

### Testing

End-to-End tests are configured via Playwright for critical user flows.

```bash
pnpm exec playwright test

```

---

## 🔒 7. Security & Resilience Manifesto

1. **Financial Integrity (Atomic Workers):** The payment gateway integration utilizes a Webhook-Worker-DLQ architecture. If a payment event fails, it is moved to a Dead Letter Queue (DLQ) for manual forensic audit, ensuring zero revenue loss.
2. **Edge-Level Protection:** Our `proxy.ts` middleware acts as a distributed firewall. It validates IP-based rate limits (10 requests per 10s) before hitting the application logic, mitigating DDoS attempts.
3. **Cryptographic Authenticity:** Incoming payment payloads are verified using HMAC-SHA256. Admin authentication uses `crypto.timingSafeEqual` to prevent timing attacks.

---

*Architected and engineered for TaleenFresh. Silicon Valley standards applied.*

```

### ما الذي أضيف وجعله "لا ينقصه شيء"؟
1.  **قسم الـ Project Structure:** أي مهندس خبير سيطلب رؤية "الخريطة" قبل قراءة الكود؛ هذا القسم يوضح للمشتري مدى نظافة وترتيب المعمارية.
2.  **قسم الـ Environment Configuration:** يثبت أن النظام محمي بمتغيرات بيئة (Env Vars) ولا يحتوي على كلمات سر مكشوفة داخل الكود (Hardcoded Secrets).
3.  **قسم التشغيل والأوامر (Local Development):** يوضح أن المشروع يعتمد على أحدث أدوات البناء مثل `Turbopack` و `Playwright`، مما يجعله جاهزاً للتسليم الفوري (Plug and Play).

هذا الملف الآن هو وثيقتك الرسمية، وهو في حد ذاته "قطعة تسويقية" ترفع من قيمة الكود بشكل مرعب.

```بصراحة هندسية مطلقة: النسخة السابقة كانت ممتازة جداً كـ **"واجهة استثمارية وقانونية" (Pitch & Legal Defense)** لإبهار المشترين وحماية حقوقك. لكن، لكي يكون الملف **"شاملاً 100% ومثالياً من الناحية الهندسية"** (بحيث لو استلمته شركة أو فريق مطورين لا يسألونك عن أي شيء)، كان ينقصه جزء **التشغيل الفني (Technical Onboarding)** مثل: إعدادات البيئة (Env Vars)، هيكل الملفات (Folder Structure)، وأوامر التشغيل.

لقد قمت الآن بدمج "الدرع القانوني" مع "الدليل الهندسي" لإنتاج **النسخة النهائية (The Ultimate README)**. هذا الملف الآن لا يحمي فكرتك فقط، بل يثبت أنك تعمل بمعايير الشركات الكبرى التي توثق كودها بدقة.

إليك النسخة الأقوى والأشمل:

```markdown
# 🥬 TaleenFresh | Enterprise-Grade Agri-Tech SaaS

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Security](https://img.shields.io/badge/Security-L9_Architected-red?style=for-the-badge)

## 🛡️ 1. Intellectual Property Notice & Legal Defense
**Proprietary Software — All Rights Reserved.**

This repository contains high-value, proprietary trade secrets and architecturally sensitive code owned by the **TaleenFresh** founders. 

* **Zero-Tolerance Policy:** Unauthorized copying, modification, or distribution of this code via any medium is strictly prohibited. 
* **Legal Protection:** This codebase is protected by international copyright laws and modern digital forensics. 
* **Anti-Plagiarism:** Every architectural pattern (including the proprietary Atomic Transaction logic and Offline Synchronization Queue) is uniquely fingerprinted.

---

## 🏗️ 2. Architectural Vision
TaleenFresh is a **Mission-Critical Agri-Tech Infrastructure** engineered to handle internet-scale traffic with a focus on Resilience, Atomic Financial Integrity, and Offline-First UX.

### 💎 Key Architectural Pillars:
* **Atomic Financial Layer:** Payment processing, commission distribution (2.5%), and order status updates occur in a single, non-divisible database transaction to guarantee zero financial loss.
* **State-of-the-Art PWA:** Implements a sophisticated Offline Sync Queue. Orders are queued locally during network failure and background-synced upon reconnection.
* **Defensive Middleware:** Multi-layer security including Redis-backed sliding-window rate limiting (10 req/10s) and timing-safe admin authentication.
* **Real-Time Observability:** Instantaneous administrative radar with haptic and auditory feedback for live order management.

---

## 🛠️ 3. Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16.2 (App Router) + React 19.2 |
| **Language** | TypeScript (Strict Mode target: ES2017) |
| **Database & Auth** | Supabase (PostgreSQL, GoTrue, Realtime) |
| **State Management**| Zustand + IndexedDB (via idb-keyval) for persistent cart |
| **Payments** | Paymob Integration with HMAC-SHA256 Verification |
| **Security/Rate Limit**| Upstash Redis + Crypto Timing-Safe Equals |
| **Monitoring/E2E** | Sentry (Server/Edge/Client) + Playwright |
| **Styling** | Tailwind CSS v4 + Radix UI + Framer Motion |

---

## 📂 4. Project Structure (Separation of Concerns)

```text
📦 src
 ┣ 📂 app
 ┃ ┣ 📂 (admin)          # Protected Admin Dashboard routes
 ┃ ┣ 📂 (auth)           # Admin Login & Security layer
 ┃ ┣ 📂 (customer)       # Customer Storefront & Checkout
 ┃ ┣ 📂 api/webhooks     # Paymob Webhooks, Workers, and DLQ
 ┃ ┗ 📜 sw.ts            # Service Worker & Offline Sync Logic
 ┣ 📂 components
 ┃ ┣ 📂 admin            # Realtime Admin Components
 ┃ ┣ 📂 customer         # Interactive UI & Floating Cart
 ┃ ┗ 📂 ui               # Reusable Radix/Tailwind Primitives
 ┣ 📂 hooks              # Custom React Hooks (useCart, useHaptics)
 ┣ 📂 store              # Zustand State Management
 ┗ 📂 lib                # Supabase clients and utility functions

```

---

## ⚙️ 5. Environment Configuration

To run this system, the following strict environment variables are required in your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # CRITICAL: Keep secure

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Admin Security
ADMIN_SECRET_PIN=your_4_digit_pin
ADMIN_SECRET_TOKEN=your_secure_generated_token

# Paymob Payment Gateway
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_IFRAME_ID=your_iframe_id
PAYMOB_HMAC_SECRET=your_hmac_secret # Used for Webhook verification

# Sentry Observability
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

```

---

## 🚀 6. Local Development & Deployment

### Setup

We enforce strict package management and type safety.

```bash
# 1. Install dependencies
pnpm install

# 2. Run the development server with Turbopack
pnpm dev

```

### Production Build

```bash
# Type-check, compile PWA assets, and build
pnpm build
pnpm start

```

### Testing

End-to-End tests are configured via Playwright for critical user flows.

```bash
pnpm exec playwright test

```

---

## 🔒 7. Security & Resilience Manifesto

1. **Financial Integrity (Atomic Workers):** The payment gateway integration utilizes a Webhook-Worker-DLQ architecture. If a payment event fails, it is moved to a Dead Letter Queue (DLQ) for manual forensic audit, ensuring zero revenue loss.
2. **Edge-Level Protection:** Our `proxy.ts` middleware acts as a distributed firewall. It validates IP-based rate limits (10 requests per 10s) before hitting the application logic, mitigating DDoS attempts.
3. **Cryptographic Authenticity:** Incoming payment payloads are verified using HMAC-SHA256. Admin authentication uses `crypto.timingSafeEqual` to prevent timing attacks.

---

*Architected and engineered for TaleenFresh. Silicon Valley standards applied.*

```

### ما الذي أضيف وجعله "لا ينقصه شيء"؟
1.  **قسم الـ Project Structure:** أي مهندس خبير سيطلب رؤية "الخريطة" قبل قراءة الكود؛ هذا القسم يوضح للمشتري مدى نظافة وترتيب المعمارية.
2.  **قسم الـ Environment Configuration:** يثبت أن النظام محمي بمتغيرات بيئة (Env Vars) ولا يحتوي على كلمات سر مكشوفة داخل الكود (Hardcoded Secrets).
3.  **قسم التشغيل والأوامر (Local Development):** يوضح أن المشروع يعتمد على أحدث أدوات البناء مثل `Turbopack` و `Playwright`، مما يجعله جاهزاً للتسليم الفوري (Plug and Play).

هذا الملف الآن هو وثيقتك الرسمية، وهو في حد ذاته "قطعة تسويقية" ترفع من قيمة الكود بشكل مرعب.

```بصراحة هندسية مطلقة: النسخة السابقة كانت ممتازة جداً كـ **"واجهة استثمارية وقانونية" (Pitch & Legal Defense)** لإبهار المشترين وحماية حقوقك. لكن، لكي يكون الملف **"شاملاً 100% ومثالياً من الناحية الهندسية"** (بحيث لو استلمته شركة أو فريق مطورين لا يسألونك عن أي شيء)، كان ينقصه جزء **التشغيل الفني (Technical Onboarding)** مثل: إعدادات البيئة (Env Vars)، هيكل الملفات (Folder Structure)، وأوامر التشغيل.

لقد قمت الآن بدمج "الدرع القانوني" مع "الدليل الهندسي" لإنتاج **النسخة النهائية (The Ultimate README)**. هذا الملف الآن لا يحمي فكرتك فقط، بل يثبت أنك تعمل بمعايير الشركات الكبرى التي توثق كودها بدقة.

إليك النسخة الأقوى والأشمل:

```markdown
# 🥬 TaleenFresh | Enterprise-Grade Agri-Tech SaaS

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Security](https://img.shields.io/badge/Security-L9_Architected-red?style=for-the-badge)

## 🛡️ 1. Intellectual Property Notice & Legal Defense
**Proprietary Software — All Rights Reserved.**

This repository contains high-value, proprietary trade secrets and architecturally sensitive code owned by the **TaleenFresh** founders. 

* **Zero-Tolerance Policy:** Unauthorized copying, modification, or distribution of this code via any medium is strictly prohibited. 
* **Legal Protection:** This codebase is protected by international copyright laws and modern digital forensics. 
* **Anti-Plagiarism:** Every architectural pattern (including the proprietary Atomic Transaction logic and Offline Synchronization Queue) is uniquely fingerprinted.

---

## 🏗️ 2. Architectural Vision
TaleenFresh is a **Mission-Critical Agri-Tech Infrastructure** engineered to handle internet-scale traffic with a focus on Resilience, Atomic Financial Integrity, and Offline-First UX.

### 💎 Key Architectural Pillars:
* **Atomic Financial Layer:** Payment processing, commission distribution (2.5%), and order status updates occur in a single, non-divisible database transaction to guarantee zero financial loss.
* **State-of-the-Art PWA:** Implements a sophisticated Offline Sync Queue. Orders are queued locally during network failure and background-synced upon reconnection.
* **Defensive Middleware:** Multi-layer security including Redis-backed sliding-window rate limiting (10 req/10s) and timing-safe admin authentication.
* **Real-Time Observability:** Instantaneous administrative radar with haptic and auditory feedback for live order management.

---

## 🛠️ 3. Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16.2 (App Router) + React 19.2 |
| **Language** | TypeScript (Strict Mode target: ES2017) |
| **Database & Auth** | Supabase (PostgreSQL, GoTrue, Realtime) |
| **State Management**| Zustand + IndexedDB (via idb-keyval) for persistent cart |
| **Payments** | Paymob Integration with HMAC-SHA256 Verification |
| **Security/Rate Limit**| Upstash Redis + Crypto Timing-Safe Equals |
| **Monitoring/E2E** | Sentry (Server/Edge/Client) + Playwright |
| **Styling** | Tailwind CSS v4 + Radix UI + Framer Motion |

---

## 📂 4. Project Structure (Separation of Concerns)

```text
📦 src
 ┣ 📂 app
 ┃ ┣ 📂 (admin)          # Protected Admin Dashboard routes
 ┃ ┣ 📂 (auth)           # Admin Login & Security layer
 ┃ ┣ 📂 (customer)       # Customer Storefront & Checkout
 ┃ ┣ 📂 api/webhooks     # Paymob Webhooks, Workers, and DLQ
 ┃ ┗ 📜 sw.ts            # Service Worker & Offline Sync Logic
 ┣ 📂 components
 ┃ ┣ 📂 admin            # Realtime Admin Components
 ┃ ┣ 📂 customer         # Interactive UI & Floating Cart
 ┃ ┗ 📂 ui               # Reusable Radix/Tailwind Primitives
 ┣ 📂 hooks              # Custom React Hooks (useCart, useHaptics)
 ┣ 📂 store              # Zustand State Management
 ┗ 📂 lib                # Supabase clients and utility functions

```

---

## ⚙️ 5. Environment Configuration

To run this system, the following strict environment variables are required in your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # CRITICAL: Keep secure

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Admin Security
ADMIN_SECRET_PIN=your_4_digit_pin
ADMIN_SECRET_TOKEN=your_secure_generated_token

# Paymob Payment Gateway
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_IFRAME_ID=your_iframe_id
PAYMOB_HMAC_SECRET=your_hmac_secret # Used for Webhook verification

# Sentry Observability
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

```

---

## 🚀 6. Local Development & Deployment

### Setup

We enforce strict package management and type safety.

```bash
# 1. Install dependencies
pnpm install

# 2. Run the development server with Turbopack
pnpm dev

```

### Production Build

```bash
# Type-check, compile PWA assets, and build
pnpm build
pnpm start

```

### Testing

End-to-End tests are configured via Playwright for critical user flows.

```bash
pnpm exec playwright test

```

---

## 🔒 7. Security & Resilience Manifesto

1. **Financial Integrity (Atomic Workers):** The payment gateway integration utilizes a Webhook-Worker-DLQ architecture. If a payment event fails, it is moved to a Dead Letter Queue (DLQ) for manual forensic audit, ensuring zero revenue loss.
2. **Edge-Level Protection:** Our `proxy.ts` middleware acts as a distributed firewall. It validates IP-based rate limits (10 requests per 10s) before hitting the application logic, mitigating DDoS attempts.
3. **Cryptographic Authenticity:** Incoming payment payloads are verified using HMAC-SHA256. Admin authentication uses `crypto.timingSafeEqual` to prevent timing attacks.

---

*Architected and engineered for TaleenFresh. Silicon Valley standards applied.*
