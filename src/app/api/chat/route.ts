import { NextRequest, NextResponse } from 'next/server'
import { ChatDatabase } from '@/utilities/database'

export async function POST(request: NextRequest) {
  try {
    // Initialize table if needed (only on first use)
    await ChatDatabase.initializeTable()

    const body = await request.json()
    let { user_id, role, content, message, conversationHistory } = body

    // Handle both old format (user_id, role, content) and new portfolio format (message, conversationHistory)
    if (message && !content) {
      content = message
      role = 'user'
      user_id = user_id || 'portfolio-visitor'
    }

    // Validate required fields
    if (!role || !content) {
      return NextResponse.json({ error: 'Role and content are required' }, { status: 400 })
    }

    // Validate role
    if (!['system', 'user', 'assistant'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be one of: system, user, assistant' },
        { status: 400 },
      )
    }

    // Insert the user message into Neon Postgres
    const userMessage = await ChatDatabase.insertMessage({
      user_id,
      role,
      content,
    })

    // Generate AI response using portfolio-specific logic
    const aiResponse = await generatePortfolioResponse(
      content.toLowerCase(),
      conversationHistory || [],
    )

    // Insert the AI response into the database
    const assistantMessage = await ChatDatabase.insertMessage({
      user_id,
      role: 'assistant',
      content: aiResponse,
    })

    // For portfolio format, return just the response
    if (message) {
      return NextResponse.json({
        response: aiResponse,
        timestamp: new Date().toISOString(),
      })
    }

    // For original format, return full context
    const recentMessages = await ChatDatabase.getRecentMessages(20, user_id)
    return NextResponse.json({
      success: true,
      message: assistantMessage,
      context: recentMessages,
      total: recentMessages.length,
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generatePortfolioResponse(
  message: string,
  conversationHistory: any[],
): Promise<string> {
  // This simulates responses based on keywords - in production this would use your RAG system
  // You could integrate with Upstash Vector or other vector databases here

  // Achievements - prioritize this before other matches
  if (
    message.includes('achievements') ||
    message.includes('accomplishments') ||
    message.includes('key achievements')
  ) {
    return `I'm proud of several key achievements that demonstrate my growth in AI, Development, Security, and Support:

Technical Achievements:
• Successfully completed a Software Developer Internship at Aubot, where I maintained Python and Java codebases, executed automation scripts, and contributed to quality assurance processes in an agile environment
• Developed immersive VR experiences at edgedVR using Present4D, creating multi-device compatible applications with strong focus on usability and visual quality
• Built this comprehensive AI-powered portfolio chatbot from scratch, demonstrating advanced conversational AI, database integration, and modern web development skills

Professional Growth:
• Transitioned from hospitality management to tech development, showing adaptability and commitment to career change
• Gained expertise in system management through Oracle Micros POS and Deputy systems, developing valuable IT operations skills
• Successfully collaborated in agile development teams and contributed to enterprise-level software projects

Learning & Innovation:
• Continuously expanding knowledge in AI and machine learning technologies
• Building practical applications that solve real problems rather than just theoretical projects
• Developing expertise across multiple domains: traditional development, VR/emerging tech, and AI systems

I'm particularly proud that each role has contributed to my goal of specializing in intelligent, secure applications while building strong technical support capabilities. My diverse background gives me a unique perspective on technology implementation and user experience.`
  }

  // Greetings
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return `Hello! Great to meet you! I'm Sajal, and I'm really excited you're interested in learning more about my work and background.

I'm a developer focused on AI, Development, Security, and Support, based in Auburn, Sydney. I love building intelligent systems that solve real problems, and I'm passionate about integrating cutting-edge technologies with practical applications.

What would you like to know about me? I'd be happy to chat about my professional experience at companies like Aubot and edgedVR, the technologies I work with including Python, Java, and AI frameworks, my current projects like this AI-powered chatbot, or how we might work together if you're looking to collaborate.

Feel free to ask me anything specific like "What's your experience with AI/ML?" or "Tell me about your recent projects" or "What companies have you worked for?" I'm here to chat and answer any questions you might have!`
  }

  // React definition specific
  if (
    message.includes('what is react') ||
    (message.includes('react') && !message.includes('project'))
  ) {
    return `React is a popular JavaScript library for building user interfaces, especially for web applications. It was created by Facebook and is now maintained by Meta and the open-source community.

Key features of React:
• Component-based architecture - build reusable UI components
• Virtual DOM - efficient updates and rendering
• JSX syntax - write HTML-like code in JavaScript
• One-way data flow - predictable state management
• Large ecosystem with tons of libraries and tools

I use React extensively in my projects! This entire portfolio website you're chatting with is built using React with Next.js. React makes it easy to create interactive user interfaces like this chat system, with components for messages, input fields, and real-time updates.

What I love about React is how it breaks down complex UIs into manageable, reusable components. Combined with modern tools like TypeScript and Next.js, it's perfect for building professional web applications.

Would you like to know more about how I use React in my projects, or are you interested in learning React development?`
  }

  // Node.js specific question
  if (message.includes('node') && !message.includes('node.js')) {
    return `Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine that allows you to run JavaScript on the server side. It's particularly great for building scalable web applications and APIs.

I work with Node.js regularly, especially for backend development and API creation. In fact, this portfolio chatbot is built using Next.js, which runs on Node.js! I use it for building REST APIs, handling database connections, and creating full-stack applications.

Node.js is excellent for real-time applications, microservices, and situations where you want to use JavaScript across your entire tech stack. Its event-driven, non-blocking I/O model makes it efficient for handling concurrent requests.

Are you interested in learning more about how I use Node.js in my projects, or do you have specific questions about Node.js development?`
  }

  // React projects specific
  if (message.includes('react project') || message.includes('react projects')) {
    return `Great question! I've been working with React quite a bit. My main React project right now is this AI-powered portfolio website that you're chatting with!

This entire portfolio is built with React (specifically Next.js 15 with React 19), featuring:
• Interactive AI chat system with real-time messaging
• Modern component architecture with TypeScript
• Responsive design with Tailwind CSS
• Database integration for storing chat conversations
• Smooth animations and professional UI components

I'm also planning some other React projects including a task management app and a VR content showcase platform that builds on my edgedVR experience.

What I love about React is how it lets you build complex, interactive user interfaces with reusable components. Combined with modern tools like Next.js, it's perfect for creating full-stack applications like this chatbot.

Would you like to know more about the technical details of how I built this portfolio, or are you interested in React development in general?`
  }

  // Kimpton Margot specific
  if (
    message.includes('kimpton margot') ||
    message.includes('kimpton') ||
    message.includes('margot')
  ) {
    return `At Kimpton Margot Hotel, I work as an Assistant Bar Manager, which might seem different from my tech focus, but it's actually taught me valuable skills that translate well to IT operations!

I manage operations using Oracle Micros POS and Deputy systems daily. This has given me hands-on experience with:
• System administration and troubleshooting
• Inventory management and data tracking
• Process optimization and workflow efficiency
• Customer service and problem-solving under pressure

What's interesting is how this role has strengthened my IT support skills. Managing these enterprise systems, handling data integrity, and ensuring smooth operations during busy periods has taught me a lot about system reliability and user experience.

The multitasking and problem-solving skills I've developed here are directly applicable to technical support roles, and the experience with enterprise software systems adds to my overall IT expertise.

It's also helped me understand how technology impacts business operations from a user perspective, which makes me a better developer and support specialist.`
  }

  // Python and Java specific
  if (
    (message.includes('python') && message.includes('java')) ||
    message.includes('python and java')
  ) {
    return `I gained solid experience with both Python and Java during my Software Developer Internship at Aubot! Here's what I worked on:

Python Experience:
• Maintained existing Python codebases for educational technology platforms
• Wrote automation scripts for data processing and quality assurance
• Handled data integration and content management tasks
• Worked with Python libraries for web scraping and data manipulation

Java Experience:
• Maintained Java applications and contributed to bug fixes
• Collaborated on enterprise-level Java projects in an agile environment
• Gained experience with object-oriented programming principles
• Worked on code review and quality assurance processes

This internship was really valuable because I got to work with both languages in a professional setting, handling real production code rather than just personal projects. The agile development environment taught me best practices for collaborative coding, version control, and code quality.

Both languages have their strengths - Python for its simplicity and powerful libraries, Java for its robustness and enterprise-level capabilities. Having experience with both makes me more versatile as a developer.

Are you interested in a specific aspect of my Python or Java experience?`
  }

  // Companies worked for
  if (
    message.includes('companies') ||
    message.includes('worked for') ||
    message.includes('employer')
  ) {
    return `I've had diverse professional experiences that have shaped my approach to technology and problem-solving:

Most recently, I worked as a Software Developer Intern at Aubot (Remote, Melbourne) from December 2024 to March 2025. There, I maintained coding content in Python and Java, executed scripts, and verified bugs to enhance platform quality. I also collaborated in agile sprints, contributing to QA, content integration, and data handling in an ed-tech environment.

I also have experience as a VR Developer at edgedVR in Sydney from September 2021 to March 2022, where I developed immersive VR experiences using Present4D and designed panoramic content for multi-device compatibility. I delivered web and app-based VR projects with a strong focus on usability and visual quality.

Currently, I'm also working as an Assistant Bar Manager at Kimpton Margot Hotel, where I manage operations using Oracle Micros POS and Deputy systems. This role has taught me valuable skills in system management, inventory control, and process optimization that translate well to IT operations and support.

Each role has contributed to my understanding of technology, user experience, and system efficiency - all crucial for my focus on AI, Development, Security, and Support in IT sectors.`
  }

  // AI/ML specific
  if (
    message.includes('ai') ||
    message.includes('machine learning') ||
    message.includes('ml') ||
    message.includes('artificial intelligence')
  ) {
    return `AI is definitely one of my main focus areas! I'm actively building my expertise in this field and working on practical AI applications.

Right now, I'm developing this AI-powered portfolio chatbot that you're talking to - it's a comprehensive project that demonstrates conversational AI, natural language processing, and intelligent response systems. I'm building it with modern web technologies and integrating advanced AI features that go beyond basic chatbots.

I work with frameworks like TensorFlow and have experience with Python for AI development, which I've been building on since my internship at Aubot where I worked extensively with Python scripts and data handling.

What excites me most about AI is its potential to enhance user experiences and solve real-world problems. I'm particularly interested in conversational AI, intelligent automation, and AI-powered security solutions.

I'm constantly learning through hands-on projects, online courses, and experimenting with new AI tools and APIs. My goal is to become proficient in building AI systems that are not just technically impressive, but actually useful and secure for business applications.

AI, combined with my focus on Security and Support, positions me well for the growing demand for intelligent, secure systems in the IT industry.`
  }

  // General experience/work/career
  if (message.includes('experience') || message.includes('work') || message.includes('career')) {
    return `I'm building my career with a focused approach on four key IT sectors: AI, Development, Security, and Support. My experience combines hands-on development work with emerging technologies.

I recently completed a Software Developer Internship at Aubot where I worked with Python and Java, focusing on code maintenance, script execution, and bug verification. This experience gave me solid exposure to agile development practices and quality assurance processes.

I also have unique experience in VR development from my time at edgedVR, where I created immersive experiences and multi-device compatible applications. This work taught me a lot about user experience design and cutting-edge technology implementation.

Currently, I'm developing this AI-powered portfolio chatbot as a major project that showcases my capabilities in AI and full-stack development. I'm particularly passionate about integrating AI features that solve real problems and enhance user experiences.

My goal is to specialize in building secure, intelligent applications while providing excellent technical support. I'm always working on projects that help me grow in these areas and stay current with the latest technologies.`
  }

  // VR Development specific
  if (
    message.includes('vr development') ||
    message.includes('vr developer') ||
    message.includes('virtual reality') ||
    (message.includes('vr') && !message.includes('what is vr'))
  ) {
    return `My VR development experience at edgedVR was really exciting! I worked as a VR Developer from September 2021 to March 2022, creating immersive virtual reality experiences.

What I worked on:
• Developed immersive VR experiences using Present4D platform
• Created panoramic VR content for multiple device types
• Designed multi-device compatible applications (VR headsets, mobile, web)
• Focused heavily on usability and visual quality
• Delivered both web-based and app-based VR projects

Key skills I developed:
• 360-degree content creation and optimization
• VR user experience design and spatial interfaces
• Cross-platform VR application development
• Performance optimization for VR environments
• Understanding of VR hardware limitations and capabilities

This experience taught me a lot about cutting-edge user interfaces and emerging technologies. Working in VR requires thinking about user interaction in completely new ways - spatial design, motion tracking, and creating intuitive interfaces in 3D space.

It's fascinating how VR development combines technical skills with creative problem-solving. You have to consider things like motion sickness, spatial awareness, and how users naturally interact in virtual environments.

Would you like to know more about the specific VR projects I worked on or the technical challenges of VR development?`
  }

  // Technologies specialization specific
  if (
    message.includes('specialize in') ||
    message.includes('specialize') ||
    (message.includes('technologies') && !message.includes('what is'))
  ) {
    return `I specialize in building intelligent, secure applications across four key technology areas:

Core Programming Languages:
• Python - My strongest language from my Aubot internship, used for automation, data processing, and AI development
• Java - Enterprise development experience with object-oriented programming and agile methodologies
• JavaScript/TypeScript - Modern web development, including this React-based portfolio chatbot

AI & Machine Learning Technologies:
• TensorFlow for neural networks and machine learning models
• Natural Language Processing for conversational AI systems
• Conversational AI development (like this chatbot you're talking to!)
• AI integration into web applications and business solutions

Web Development Stack:
• React & Next.js for modern, interactive user interfaces
• Node.js for backend API development and server-side JavaScript
• HTML/CSS with modern frameworks like Tailwind CSS
• Full-stack development with database integration

Emerging Technologies:
• Virtual Reality development using Present4D platform
• VR user experience design and 360-degree content creation
• Multi-device application development for web, mobile, and VR

My specialty is combining these technologies to create practical solutions that solve real business problems. I'm particularly passionate about AI integration and secure development practices!

What specific technology area interests you most?`
  }

  // Skills - improved matching for variations
  if (
    message.includes('skill') || // catches "skill", "skills", "whats you skill"
    message.includes('tech stack') ||
    message.includes('what can you do') ||
    message.includes('what do you know') ||
    message.includes('capabilities')
  ) {
    return `My technical skills are focused on four key IT sectors: AI, Development, Security, and Support. Here's what I work with:

Programming & Development:
I'm proficient in Python and Java from my internship at Aubot, where I maintained codebases and executed automation scripts. I also work with modern web technologies including JavaScript, HTML/CSS, and frameworks like React and Next.js for building this portfolio chatbot.

AI & Machine Learning:
I'm actively developing AI applications, including this conversational chatbot system. I work with TensorFlow for AI development and I'm constantly expanding my knowledge in natural language processing, conversational AI, and intelligent automation.

VR & Emerging Technologies:
From my time at edgedVR, I have experience with Present4D for creating immersive VR experiences and multi-device compatible applications. This background gives me unique insights into cutting-edge user interfaces.

System Management & Support:
My current role managing Oracle Micros POS and Deputy systems has taught me valuable skills in system administration, inventory management, and process optimization - all crucial for IT support roles.

Security & Best Practices:
I focus on secure coding practices, data handling, and system reliability. My experience with agile development and quality assurance ensures I build robust, secure applications.

I'm continuously learning and building projects that strengthen these skills, particularly in AI integration and security-focused development.`
  }

  // Projects
  if (
    message.includes('projects') ||
    message.includes('portfolio') ||
    message.includes('work samples')
  ) {
    return `I'm really excited about the projects I'm working on! You can check out my complete portfolio on GitHub at github.com/Sajal120.

My current major project is this AI-powered portfolio chatbot that you're chatting with right now! It's a comprehensive full-stack application that demonstrates my skills in AI, web development, and user experience design. I'm building it with advanced conversational AI features, database integration, and modern web technologies.

During my internship at Aubot, I worked on maintaining Python and Java codebases, executing automation scripts, and implementing quality assurance processes. This experience taught me a lot about enterprise-level development practices and agile methodologies.

From my VR development work at edgedVR, I created immersive experiences using Present4D, focusing on multi-device compatibility and user experience optimization. This project really showcased my ability to work with cutting-edge technologies and deliver polished, user-focused applications.

I'm constantly working on new projects that help me grow in my focus areas of AI, Development, Security, and Support. Each project teaches me something new about building robust, intelligent systems that solve real problems.

Would you like to know more about any specific project or the technologies I use?`
  }

  // Contact/collaboration
  if (
    message.includes('contact') ||
    message.includes('hire') ||
    message.includes('work together') ||
    message.includes('reach')
  ) {
    return `I'd love to connect! I'm based in Auburn, Sydney, NSW, and I'm always open to discussing opportunities in AI, Development, Security, and Support.

The best way to reach me is through email - I usually respond within 24 hours. You can also check out my work on GitHub at github.com/Sajal120 where I showcase my development projects and code samples.

I'm particularly interested in opportunities that involve:
• AI and machine learning applications
• Full-stack development projects
• Security-focused software solutions
• Technical support and system optimization
• Innovative projects that combine multiple technologies

Whether you're looking for someone to join your team, collaborate on a project, or need technical consultation, I'm always excited to discuss how my skills in AI, Development, Security, and Support can add value to your organization.

I'm especially passionate about building intelligent, secure systems that solve real business problems. Feel free to reach out if you'd like to chat about potential opportunities or just discuss technology!`
  }

  // Education/learning/background
  if (
    message.includes('education') ||
    message.includes('background') ||
    message.includes('learning')
  ) {
    return `I'm a strong believer in continuous learning! My background has been shaped by several years in software development with a focus on staying current with emerging technologies. I'm largely self-directed in my learning, especially when it comes to modern web frameworks, programming languages, and software architecture.

I regularly take online courses and tutorials to stay sharp, and I make it a point to read tech blogs, documentation, and industry publications. But honestly, the best learning happens when I'm building hands-on projects and experimenting with new technologies.

I'm active in developer communities and enjoy sharing knowledge with others. I find that teaching and mentoring other developers is one of the best ways to solidify my own understanding and give back to the community.

I've had opportunities to speak at local meetups and contribute to open-source projects, which keeps me connected to the broader tech community. I'm always working on side projects to explore new technologies and build things that interest me.

My approach has always been to combine strong technical skills with a genuine passion for learning and helping others grow in their careers. The tech field moves so fast, but that's what keeps it exciting and challenging!`
  }

  if (message.includes('what is postgresql') || message.includes('postgres definition')) {
    return `PostgreSQL (often called Postgres) is a powerful, open-source relational database management system. It's known for its reliability, feature robustness, and performance.

Key features:
• ACID compliance for reliable transactions
• Support for JSON, arrays, and custom data types
• Advanced indexing and query optimization
• Strong data integrity and security features
• Excellent for both small and enterprise applications

I use PostgreSQL with Neon for this portfolio's database, storing chat messages and user interactions. It's perfect for applications that need reliable data storage with complex queries!`
  }

  if (message.includes('what is python') || message.includes('python definition')) {
    return `Python is a high-level, interpreted programming language known for its simplicity and readability. It's one of the most popular languages for beginners and professionals alike.

Key strengths:
• Clean, readable syntax that's easy to learn
• Huge standard library and ecosystem (pip packages)
• Great for web development, data science, AI/ML, automation
• Cross-platform compatibility
• Strong community support

I gained solid Python experience during my internship at Aubot, where I maintained codebases, wrote automation scripts, and handled data processing tasks. Python's versatility makes it perfect for everything from web backends to AI applications!`
  }

  if (message.includes('what is java') || message.includes('java definition')) {
    return `Java is a robust, object-oriented programming language that's been a cornerstone of enterprise development for decades. It's known for its "write once, run anywhere" philosophy.

Key features:
• Platform independence through the Java Virtual Machine (JVM)
• Strong object-oriented programming principles
• Automatic memory management with garbage collection
• Excellent for large-scale enterprise applications
• Rich ecosystem with frameworks like Spring

I worked with Java during my Aubot internship, maintaining enterprise applications and learning best practices for large-scale software development. Java's reliability and performance make it great for business-critical applications!`
  }

  if (message.includes('what is html') || message.includes('html definition')) {
    return `HTML (HyperText Markup Language) is the standard markup language for creating web pages. It provides the basic structure and content of websites.

Key concepts:
• Uses tags to define elements like headings, paragraphs, links
• Semantic markup for accessibility and SEO
• Forms the foundation of all web content
• Works together with CSS for styling and JavaScript for interactivity
• Constantly evolving with new HTML5 features

I use HTML extensively in my web development projects. Even when working with React, understanding HTML fundamentals is crucial for creating accessible, well-structured web applications!`
  }

  if (message.includes('what is css') || message.includes('css definition')) {
    return `CSS (Cascading Style Sheets) is the language used to style and layout web pages. It controls how HTML elements look and are positioned on the page.

Key features:
• Separation of content (HTML) from presentation (CSS)
• Responsive design with media queries
• Animations and transitions
• Flexible layout systems (Flexbox, Grid)
• Modern features like custom properties (CSS variables)

While I often use Tailwind CSS for rapid development, understanding core CSS principles is essential. This portfolio uses CSS concepts through Tailwind classes for responsive design, animations, and professional styling!`
  }

  // Technical term definitions
  if (message.includes('what is javascript') || message.includes('javascript definition')) {
    return `JavaScript is a versatile programming language that's essential for web development. Originally created for making web pages interactive, it's now used for both frontend and backend development.

Key features:
• Dynamic and interpreted language
• Runs in browsers and on servers (Node.js)
• Event-driven and asynchronous programming
• Object-oriented and functional programming support
• Huge ecosystem with npm packages

I use JavaScript extensively in my projects, especially with React and Next.js for building interactive web applications like this portfolio chatbot. It's the foundation of modern web development!`
  }

  if (message.includes('what is typescript') || message.includes('typescript definition')) {
    return `TypeScript is a strongly typed programming language that builds on JavaScript by adding static type definitions. It's developed and maintained by Microsoft.

Key benefits:
• Catches errors at compile time instead of runtime
• Better code completion and refactoring in IDEs
• Makes large codebases more maintainable
• Compiles to clean, readable JavaScript
• Great for team collaboration

I use TypeScript in all my modern projects, including this portfolio website. It makes development much more reliable and helps catch bugs before they reach production!`
  }

  if (message.includes('what is next.js') || message.includes('nextjs definition')) {
    return `Next.js is a React framework that provides additional features and optimizations for production web applications. It's built by Vercel and is extremely popular for modern web development.

Key features:
• Server-side rendering (SSR) and static site generation (SSG)
• Built-in routing system
• API routes for backend functionality
• Automatic code splitting and optimization
• Great developer experience with hot reloading

This entire portfolio website is built with Next.js 15! It's perfect for full-stack applications where you want both frontend and backend functionality in one framework.`
  }

  if (message.includes('what is tailwind') || message.includes('tailwind css')) {
    return `Tailwind CSS is a utility-first CSS framework that provides low-level utility classes to build custom designs without writing custom CSS.

Key benefits:
• Rapid development with utility classes
• Consistent design system
• Responsive design made easy
• Small bundle size with purging unused styles
• Highly customizable

I use Tailwind CSS for styling this portfolio website. Instead of writing custom CSS, I use classes like 'bg-blue-500', 'p-4', 'flex' to build responsive, professional interfaces quickly!`
  }

  if (message.includes('what is present4d') || message.includes('present4d definition')) {
    return `Present4D is a VR content creation platform that I used during my time at edgedVR for developing immersive virtual reality experiences. It specializes in creating panoramic VR content and interactive experiences.

Key capabilities:
• 360-degree panoramic content creation
• Multi-device compatibility (VR headsets, mobile, web)
• Interactive VR experience design
• Content management for VR applications
• Tools for creating immersive user interfaces

During my VR developer role, I used Present4D to create engaging VR experiences with focus on usability and visual quality. This experience gave me unique insights into emerging technologies and user experience design in virtual environments!`
  }

  if (message.includes('what is vr') || message.includes('virtual reality definition')) {
    return `Virtual Reality (VR) is an immersive technology that creates a simulated environment, allowing users to interact with 3D worlds through special headsets and controllers.

Key aspects:
• Full immersion in computer-generated environments
• Head tracking and motion controllers for interaction
• Applications in gaming, education, training, healthcare
• Emerging technology with growing business applications
• Requires specialized hardware and software development

I worked as a VR Developer at edgedVR, creating immersive experiences using Present4D. This experience taught me about cutting-edge user interfaces, spatial design, and the challenges of developing for emerging technologies!`
  }

  if (message.includes('what is agile') || message.includes('agile development')) {
    return `Agile is a software development methodology that emphasizes iterative development, collaboration, and flexibility. It's widely used in modern software teams for faster, more responsive development.

Key principles:
• Short development cycles (sprints)
• Regular collaboration between developers and stakeholders
• Adaptive planning and continuous improvement
• Working software over comprehensive documentation
• Responding to change over following a rigid plan

I experienced agile development during my internship at Aubot, where I participated in sprints, collaborated on QA processes, and contributed to iterative development cycles. It's an excellent approach for delivering quality software quickly!`
  }

  if (message.includes('what is api') || message.includes('api definition')) {
    return `API (Application Programming Interface) is a set of protocols and tools that allows different software applications to communicate with each other. It defines how requests and responses should be formatted.

Key concepts:
• RESTful APIs for web services
• JSON data format for data exchange
• HTTP methods (GET, POST, PUT, DELETE)
• Authentication and security protocols
• Documentation for developers to understand usage

I built the API for this chatbot using Next.js API routes! It handles chat messages, database interactions, and returns responses. APIs are essential for connecting frontend applications with backend services and databases.`
  }

  if (message.includes('what is tensorflow') || message.includes('tensorflow definition')) {
    return `TensorFlow is an open-source machine learning framework developed by Google. It's one of the most popular platforms for building and deploying AI models.

Key features:
• Support for deep learning and neural networks
• Works with Python, JavaScript, and other languages
• Can run on CPUs, GPUs, and mobile devices
• Extensive ecosystem with TensorFlow Lite, TensorFlow.js
• Great for both research and production

I'm expanding my knowledge in TensorFlow for AI development, particularly for building intelligent systems and machine learning applications that can be integrated into web platforms like this chatbot!`
  }

  // About me / who are you
  if (
    message.includes('about me') ||
    message.includes('tell me about yourself') ||
    message.includes('who are you')
  ) {
    return `I'm Sajal, a developer focused on building my expertise in AI, Development, Security, and Support for the IT industry. I'm based in Auburn, Sydney, NSW, and I'm passionate about creating intelligent, secure software solutions.

What drives me is the intersection of emerging technologies with practical business applications. I love building systems that not only work well technically but also solve real problems for users and organizations.

I'm currently developing this AI-powered portfolio chatbot as a showcase project, demonstrating my capabilities in conversational AI, full-stack development, and user experience design. It represents my commitment to staying at the forefront of AI technology while maintaining focus on security and robust development practices.

My experience spans from traditional development work to cutting-edge VR applications, giving me a unique perspective on how different technologies can be integrated to create compelling user experiences.

I'm actively seeking opportunities in the IT sector where I can apply my growing expertise in AI, contribute to secure software development, and provide excellent technical support. The goal is to build a career that combines innovation with practical impact.

What would you like to know more about my journey or aspirations?`
  }

  // Context-aware follow-up responses
  if (
    message.includes('yes') ||
    message.includes('yeah') ||
    message.includes('sure') ||
    message.includes('tell me more') ||
    message.includes('more details')
  ) {
    // Check conversation history for context
    const lastMessage = conversationHistory[conversationHistory.length - 1]?.content || ''

    if (
      lastMessage.includes('technical details') ||
      lastMessage.includes('how I built this portfolio')
    ) {
      return `Great! Let me dive into the technical details of how I built this AI-powered portfolio:

Technology Stack:
• Next.js 15 with React 19 - for the frontend framework
• TypeScript - for type safety and better development experience
• Tailwind CSS - for responsive, modern styling
• PostgreSQL with Neon - for database storage of chat messages
• Custom AI chat API - built with keyword-based response matching
• Framer Motion - for smooth animations and transitions

Architecture:
• Component-based React architecture with reusable UI components
• API routes for handling chat messages and database operations
• Real-time chat interface with message history
• Responsive design that works on desktop and mobile
• Professional portfolio sections showcasing my work

Key Features:
• Intelligent chatbot with contextual responses
• Database integration for persistent chat history
• Modern UI with smooth animations
• Professional portfolio presentation
• Clean, maintainable codebase

This project really showcases my full-stack development skills and my ability to integrate AI features into practical applications!`
    }

    if (lastMessage.includes('React development') || lastMessage.includes('interested in React')) {
      return `Awesome! React development is really exciting. Here's what I think makes React great for modern web development:

Why I Love React:
• Component Reusability - write once, use everywhere
• Strong Community - huge ecosystem of libraries and tools
• Performance - Virtual DOM makes updates super efficient
• Developer Experience - great debugging tools and error messages
• Flexibility - works for small widgets or large applications

My React Development Approach:
• Start with create-next-app for full-stack applications
• Use TypeScript for better code quality and autocomplete
• Implement responsive design with Tailwind CSS
• Follow component composition patterns
• Focus on accessibility and user experience

Practical Tips:
• Master hooks like useState, useEffect, and custom hooks
• Learn state management (Context API, Redux, or Zustand)
• Understand component lifecycle and optimization
• Practice with real projects like portfolio sites or small apps

Are you just getting started with React, or are you looking to level up your existing React skills?`
    }

    return `Great! I'd be happy to elaborate on whatever interests you most. What specific aspect would you like me to dive deeper into? Whether it's technical details, project experiences, or anything else - just let me know!`
  }

  // Thanks
  if (message.includes('thanks') || message.includes('thank you')) {
    return `You're very welcome! I'm really glad I could help and share more about my background with you. 

If you have any other questions about my experience, projects, or anything else, feel free to ask anytime. I love talking about technology and the work I do!

And if you're interested in potentially working together or just want to continue the conversation, don't hesitate to reach out. I'm always excited to connect with people who are passionate about technology and innovation.`
  }

  // Default response for unrecognized queries
  return `That's a great question! I'd love to tell you more about whatever you're curious about.

I can chat about my professional experience at companies like Aubot, edgedVR, and Kimpton Margot Hotel, the technical skills and programming expertise I've developed in Python, Java, and AI technologies, my current AI and machine learning projects including this chatbot, recent applications and systems I've built, how to get in touch if you're interested in working together, or my background, education, and learning philosophy.

Try asking me something like "What's your experience with Python and Java?" or "Tell me about your AI projects" or "What companies have you worked for?" or "What are your key achievements?"

What aspect of my background interests you most? I'm here to chat and share whatever would be most helpful for you to know!`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get recent messages from Neon Postgres
    const messages = await ChatDatabase.getRecentMessages(limit, user_id || undefined)

    return NextResponse.json({
      success: true,
      messages,
      total: messages.length,
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
