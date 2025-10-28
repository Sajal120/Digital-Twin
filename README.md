<div align="center">

# 🤖 AI-Powered Digital Twin Portfolio

### Built by Sajal Basnet

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

**An intelligent, AI-enhanced portfolio and content management system featuring advanced voice interaction, multi-language support, and RAG (Retrieval-Augmented Generation) chatbot capabilities.**

[🌐 Live Demo](https://www.sajal-app.online/) • [💼 LinkedIn](https://www.linkedin.com/in/sajal-basnet-7926aa188/) • [🐙 GitHub](https://github.com/Sajal120)

</div>

---

## 👨‍💻 About Me

**SAJAL BASNET**  
*Graduate Full-Stack Developer & AI Specialist*

📍 Auburn, Sydney, NSW  
📞 +61 424 425 793  
📧 basnetsajal120@gmail.com  
🤖 AI Phone: +61 278 044 137 (AI Voice Assistant)  
🌐 [Portfolio](https://www.sajal-app.online/) | [GitHub](https://github.com/Sajal120) | [LinkedIn](https://www.linkedin.com/in/sajal-basnet-7926aa188/)

### 💼 Professional Summary

Full-Stack Developer & AI Enthusiast with a **Master's in Software Development** (Top 15%, Swinburne University) and 3+ years of experience designing and deploying scalable web and AI-powered solutions. Skilled in React 19, Next.js 15, Node.js, TypeScript, and cloud platforms like Vercel, AWS, and Azure. Experienced in integrating AI models and APIs (OpenAI, Groq, Claude), developing voice-based AI applications, and working with microservices architectures.

### 🎓 Education

**Master of Software Development** | Swinburne University of Technology | 2022 - 2024  
*GPA: 3.688/4.0 | Golden Key International Honour Society Member (Top 15%)*

**Bachelor of IT** | Kings Own Institute | 2019 - 2022  
*GPA: 4.2/5.0*

### 🏆 Certifications

- Google IT Support Professional Certificate (2025)
- Golden Key International Honour Society Member (Top 15%)

---

## 📖 About This Project

This Digital Twin portfolio is my flagship project, showcasing expertise in:

- 🤖 **AI/ML Integration** - LLMs, RAG systems, Voice AI
- 🚀 **Full-Stack Development** - Next.js, React, Node.js, TypeScript
- 🗄️ **Database Architecture** - PostgreSQL, Vector Databases, Upstash
- 🎨 **Modern UI/UX** - TailwindCSS, Framer Motion, 3D Graphics
- 🔐 **Authentication & Security** - OAuth, NextAuth, API Security
- ☁️ **Cloud Deployment** - Vercel, Payload Cloud, Docker

**🎯 Purpose**: Demonstrating my ability to build production-ready AI applications for potential employers and showcasing cutting-edge full-stack development skills.

---

## ✨ Key Features

### 🎯 Core Capabilities

- **🤖 AI Chatbot**: RAG-powered conversational AI using Groq + Upstash Vector DB
- **🎙️ Voice AI**: Real-time voice interaction with OpenAI's Realtime API
- **🌍 Multi-Language**: Voice cloning support for 5+ languages (ElevenLabs)
- **📝 CMS**: Full-featured content management with Payload CMS
- **🎨 Layout Builder**: Flexible page builder with drag-and-drop blocks
- **🔍 SEO Optimized**: Automatic sitemap generation and meta management
- **🌓 Dark Mode**: Beautiful theme switching
- **📱 Responsive**: Mobile-first design

### 🚀 Advanced Features

- **MCP Integration**: Model Context Protocol for advanced AI workflows
- **Conversation Memory**: Context-aware multi-turn conversations
- **Speech-to-Text**: Deepgram integration for transcription
- **Auto Language Detection**: Responds in user's language
- **Vector Search**: Semantic search powered by embeddings
- **OAuth Integration**: GitHub, LinkedIn authentication
- **Draft Preview & Live Preview**: Preview content before publishing

---

## 🛠️ Technical Skills

### Languages
JavaScript (ES6+) • TypeScript • Python • Java • C# • SQL (PostgreSQL)

### Frontend
React 19 • Next.js 15 • Three.js • Framer Motion • GSAP • TailwindCSS • Bootstrap 5 • Radix UI • React Hook Form

### Backend & Databases
Node.js • PostgreSQL • Upstash Redis • Upstash Vector • MongoDB • MySQL • Supabase • Firebase • SQLite • Payload CMS

### AI/ML
OpenAI GPT-4 • Groq API • Claude API • RAG Systems • Vector Embeddings • Semantic Search • Multi-hop RAG • Agentic RAG • MCP (Model Context Protocol) • Deepgram (Speech-to-Text) • ElevenLabs (Voice Cloning/TTS)

### Cloud & DevOps
Vercel • Docker • Git/GitHub • CI/CD • AWS • Azure • Environment Management

### APIs & Integration
RESTful API Design • Webhooks • OAuth 2.0 • GitHub API (Octokit) • Twilio API • NextAuth.js • Real-time Communication

### Testing & Monitoring
Playwright (E2E) • Vitest (Unit Testing) • API Testing • Performance Monitoring

---

## 🏗️ Tech Stack

```
Frontend:     Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui
Backend:      Payload CMS, Node.js, NextAuth.js
Database:     PostgreSQL (Neon), Upstash Vector DB
AI/ML:        Groq, OpenAI, ElevenLabs, Deepgram
Deployment:   Vercel, Docker
Animation:    Framer Motion, GSAP, Three.js
```

---

## 📋 Prerequisites

- Node.js 18.20.2+ or 20.9.0+
- pnpm 9 or 10
- PostgreSQL database (Neon, Supabase, or local)
- API keys for Groq, OpenAI, Upstash, ElevenLabs (optional), and Deepgram (optional)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Sajal120/Digital-Twin.git
cd Digital-Twin
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up the Database

The application will automatically create tables on first run. If you need to reset:

```bash
pnpm payload migrate:create
pnpm payload migrate
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create Admin User

On first run, you'll be prompted to create an admin user through the web interface at `/admin`

### 6. (Optional) Seed Database

You can seed the database with sample content from the admin panel.

---

## 📦 Project Structure

```
├── src/
│   ├── app/              # Next.js app directory
│   ├── collections/      # Payload CMS collections
│   ├── components/       # React components
│   ├── services/         # Service layer (voice, AI)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   └── payload.config.ts # Payload CMS configuration
├── public/               # Static assets
├── tests/                # Test files
└── package.json          # Dependencies
```

---

## 🎨 Key Features Explained

### AI Chatbot with RAG

The chatbot uses Retrieval-Augmented Generation to provide accurate, context-aware responses:

1. User queries are embedded using OpenAI's embedding models
2. Relevant content is retrieved from Upstash Vector Database
3. Context is passed to Groq's LLM for response generation
4. Enhanced with GitHub/LinkedIn integration for professional context

### Voice AI System

Real-time voice interaction powered by:

- **OpenAI Realtime API**: Natural voice conversations
- **ElevenLabs**: Multi-language voice cloning
- **Deepgram**: Accurate speech-to-text transcription
- **Language Detection**: Automatic language identification

### Content Management

Payload CMS provides:

- User-friendly admin panel at `/admin`
- Custom collections for pages, posts, and media
- Draft/publish workflow
- Image optimization and focal point selection
- SEO meta management

---

## 🔧 Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix linting issues

# Database
pnpm payload migrate:create  # Create migration
pnpm payload migrate         # Run migrations

# Testing
pnpm test             # Run all tests
pnpm test:e2e         # Run E2E tests
pnpm test:int         # Run integration tests

# Payload CMS
pnpm payload generate:types  # Generate TypeScript types
```

---

## 🌍 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy!

Vercel automatically detects Next.js and configures optimal settings.

### Deploy to Payload Cloud

1. Connect your GitHub repository at [Payload Cloud](https://payloadcms.com)
2. Configure environment variables
3. Deploy

### Self-Hosting

1. Build the application:
   ```bash
   pnpm build
   ```

2. Start the production server:
   ```bash
   pnpm start
   ```

3. Use a process manager like PM2:
   ```bash
   pm2 start pnpm --name "digital-twin" -- start
   ```

### Docker

```bash
docker build -t digital-twin .
docker run -p 3000:3000 digital-twin
```

---

## 💼 Professional Experience

### AI Software Developer (Bootcamp) | August 2025 - October 2025
- Integrated Groq Llama and OpenAI for language understanding and response generation
- Used Deepgram for speech-to-text and ElevenLabs for AI voice synthesis and cloning
- Implemented MCP to connect multiple AI models and create adaptive "agentic" behavior

### Software Developer (Intern) | Aubot | December 2024 - March 2025
- Developed Python automation scripts improving bug detection efficiency by 30%
- Maintained 9,500+ coding exercises with 99.5% accuracy for 15,000+ learners
- Reduced critical bugs by 15% through systematic testing and Agile collaboration

### Web Developer (Contract) | edgedVR | January 2023 - December 2023
- Built responsive web applications using React and modern APIs
- Optimized performance, reducing load times by 20% (40s to 32s)
- Delivered 12+ training modules achieving 92% user satisfaction across 3 enterprise clients

### Assistant Bar Manager | Kimpton Margot Hotel | March 2022 - Present
- Led 15+ staff team, implementing systems reducing operational conflicts by 40%
- Managed SAP and Oracle Micros POS systems maintaining 4.2/5 customer satisfaction

---

## 🚀 Featured Projects

### Digital Twin | TypeScript, React, AI API, 3D Rendering
[GitHub](https://github.com/Sajal120/Digital-Twin)
- AI-powered digital twin with voice cloning and real-time chat capabilities
- Integrated multiple AI APIs (OpenAI, Groq, Elevenlabs) for intelligent responses

### XC3 Cloud Management | Python, AWS, Azure
[GitHub](https://github.com/Sajal120/XC3)
- Cloud agnostic resource inventory and compliance package powered by Cloud Custodian
- Built comprehensive reporting dashboard with real-time monitoring capabilities

### E-Marketplace | PHP, MySQL, JavaScript
[GitHub](https://github.com/Sajal120/Marketplace-Website)
- E-commerce platform with real-time bidding system and secure payment processing
- Developed responsive design with Bootstrap for optimal cross-device experience

### Movie Database | JavaScript, TMDB API
[GitHub](https://github.com/Sajal120/Movie-Website)
- Responsive movie database with advanced search and filtering capabilities
- Built intuitive user interface with modern JavaScript ES6+ features

### Car Parking | Java
[GitHub](https://github.com/Sajal120/GUI-Car-Parking-System)
- Desktop application with real-time parking slot management and reporting
- Created automated billing system and parking duration tracking

### Fertility App | C#, .NET, SQLite
[GitHub](https://github.com/Sajal120/Fertility-App)
- Health tracking application with data analytics and personalized insights
- Implemented data visualization charts and predictive health analytics

---

## 📈 Performance

- ⚡ Lighthouse Score: 95+
- 🚀 First Contentful Paint: <1s
- 🎯 Time to Interactive: <2s
- 📦 Optimized bundle size
- 🖼️ Lazy-loaded images
- 🔄 Incremental Static Regeneration

---

## 🎓 What I Learned

Building this project taught me:

- 🤖 Implementing production-grade RAG systems
- 🎙️ Real-time voice AI integration
- 📊 Vector database optimization
- 🏗️ Scalable Next.js architecture
- 🔐 OAuth and authentication flows
- ☁️ Cloud deployment and CI/CD
- 🎨 Advanced UI/UX with modern frameworks

---

## 🤝 Contributing

This is a personal portfolio project, but suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License with portfolio terms - See [LICENSE](LICENSE) file.

**Summary:**
- ✅ Study and learn from the code
- ✅ Use concepts in your projects
- ⚠️ Give credit if using significant portions
- ❌ Don't copy and claim as your own

---

## 💼 For Recruiters

This project demonstrates:

- ✅ Full-stack development skills
- ✅ AI/ML integration expertise
- ✅ Modern web technologies
- ✅ Clean, maintainable code
- ✅ Production deployment experience
- ✅ Problem-solving abilities

**Interested in discussing opportunities?** Feel free to reach out!

---

## 🙏 Acknowledgments

Built with amazing technologies:

- [Payload CMS](https://payloadcms.com) - MIT License
- [Next.js](https://nextjs.org) - MIT License
- [shadcn/ui](https://ui.shadcn.com) - MIT License
- [Groq](https://groq.com) - Commercial API
- [OpenAI](https://openai.com) - Commercial API
- [ElevenLabs](https://elevenlabs.io) - Commercial API
- [Upstash](https://upstash.com) - Commercial Service

---

## 📧 Contact

**Sajal Basnet**

- 📧 Email: basnetsajal120@gmail.com
- 💼 LinkedIn: [Sajal Basnet](https://linkedin.com/in/sajal-basnet-7926aa188)
- 🐙 GitHub: [@Sajal120](https://github.com/Sajal120)
- 🤖 AI Phone: +61 278 044 137 (Try my AI Voice Assistant!)
- 🌐 Portfolio: [sajal-app.online](https://www.sajal-app.online/)

---

<div align="center">

**⭐ If this project helped you, please consider giving it a star!**

Made with ❤️ by Sajal Basnet using Next.js, AI, and modern web technologies

</div>