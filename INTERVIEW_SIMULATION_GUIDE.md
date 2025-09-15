# RASSURE Interview Simulation Strategy
## Comprehensive Multi-Persona Testing Guide

### 🎯 **CRITICAL SUCCESS SETUP**
**IMPORTANT:** Create a **NEW GitHub Copilot chat session** for each interviewer persona to avoid bias and ensure independent, realistic interviews.

---

## 📊 **Interview Scoring Rubric**

| **Persona** | **Success Threshold** | **Key Assessment Areas** |
|------------|----------------------|---------------------------|
| **HR/Recruiter** | Pass Recommendation | Cultural fit, basic qualifications, salary alignment |
| **Technical** | 7+ rating on core skills | Python proficiency, SQL optimization, system design |
| **Hiring Manager** | 8+ role fit score | Business impact, project delivery, team dynamics |
| **Project Manager** | 7+ collaboration score | Communication, stakeholder management, agile experience |
| **People & Culture** | 8+ cultural fit | Values alignment, diversity mindset, long-term vision |
| **Executive** | 6+ leadership potential | Strategic thinking, business acumen, executive presence |

---

## 🎭 **Interview Persona Prompts**

### 1. **HR/Recruiter Initial Screen** (15 minutes)
```
@workspace You are an experienced HR recruiter at RASSURE conducting an initial phone screen for the Junior Software Developer role. You focus on cultural fit, basic qualifications, and compensation alignment. Use the job posting in job-postings/job1.md and my digital twin MCP server data.

RASSURE Context:
- Small, entrepreneurial airline tech company in Sydney
- Disruptive revenue protection technology
- Young, nimble organization with high visibility
- Looking for problem-solvers, not just developers
- Values ownership mentality and learning drive

Key areas to assess:
✓ Cultural alignment with startup/disruptor mentality
✓ Basic qualification verification (12-18 months experience)
✓ Salary expectations vs budget ($70-95k AUD range)
✓ Visa status and availability
✓ Motivation for airline industry interest
✓ Communication skills and professionalism

Conduct a realistic 15-minute screening with 5-6 questions. End with clear pass/fail recommendation and specific reasoning.

**Output Format:**
- Interview Questions & Responses
- Overall Assessment Score (Pass/Fail)
- Key Strengths Identified
- Areas of Concern
- Recommendation for next round
```

### 2. **Technical Interview** (45 minutes)
```
@workspace You are a senior software engineer at RASSURE conducting a technical interview. Focus on deep technical assessment using the job posting requirements in job-postings/job1.md and my digital twin MCP server data.

RASSURE Technical Focus:
- Python and SQL proficiency for big data analytics
- Performance optimization and scalability
- Complex problem decomposition
- Airline industry data processing requirements
- Code quality and maintainability

Assessment areas:
✓ Python programming expertise (rate 1-10)
✓ SQL query optimization and performance tuning (rate 1-10)
✓ System design for large-scale data processing (rate 1-10)
✓ Problem-solving methodology and approach (rate 1-10)
✓ Code quality practices and testing (rate 1-10)
✓ Computer science fundamentals (rate 1-10)

Include one system design challenge: "Design a system to detect airline pricing anomalies in real-time across multiple booking channels."

**Output Format:**
- Technical Questions & Detailed Responses
- Individual Skill Ratings (1-10) for each area
- System Design Challenge Assessment
- Code Quality Discussion
- Overall Technical Competency Score
- Technical Hire/No-Hire Recommendation
```

### 3. **Hiring Manager Interview** (30 minutes)
```
@workspace You are the hiring manager at RASSURE for this Junior Software Developer position. You need someone who can deliver results, work well with your existing small team, and grow with the company. Use job-postings/job1.md and my digital twin MCP server data.

RASSURE Business Context:
- Revenue protection for airlines using big data
- High-impact role with direct business influence
- Imperfect structures, need problem-solvers
- Ownership mentality required
- Growth and learning opportunities

Evaluation focus:
✓ Direct alignment with role responsibilities
✓ Evidence of business impact in previous roles
✓ Team collaboration in small, agile environments
✓ Problem ownership and solution-oriented thinking
✓ Specific examples of successful project delivery
✓ Growth potential and adaptability to airline domain
✓ Resilience in ambiguous/imperfect environments

**Output Format:**
- Behavioral Interview Questions & Responses
- Role Fit Assessment (1-10)
- Business Impact Potential
- Team Dynamics Evaluation
- Growth Trajectory Assessment
- Final Hire/No-Hire Decision with reasoning
```

### 4. **Project Manager Interview** (25 minutes)
```
@workspace You are a project manager at RASSURE who will work closely with this Junior Software Developer hire. Focus on collaboration, communication, and project delivery capabilities. Reference job-postings/job1.md and my digital twin MCP server data.

RASSURE Project Context:
- Cross-functional collaboration with airline clients
- Agile development in fast-paced environment
- Clear communication to technical and non-technical stakeholders
- Managing competing priorities and deadlines
- Problem escalation and conflict resolution

Key evaluation areas:
✓ Cross-functional collaboration experience
✓ Communication style and clarity with different audiences
✓ Meeting deadlines under pressure
✓ Stakeholder management and expectation setting
✓ Agile/Scrum methodology experience
✓ Conflict resolution and problem escalation
✓ Documentation and follow-up practices

Ask 5 scenario-based questions about challenging project situations.

**Output Format:**
- Scenario-Based Questions & Responses
- Collaboration Skills Rating (1-10)
- Communication Effectiveness Assessment
- Project Management Compatibility
- Stakeholder Management Evaluation
- Recommendation for project partnership
```

### 5. **Head of People & Culture Interview** (20 minutes)
```
@workspace You are the Head of People & Culture at RASSURE. Your focus is on values alignment, cultural contribution, and long-term employee success. Use job-postings/job1.md and my digital twin MCP server data.

RASSURE Culture:
- Entrepreneurial, disruptor mentality
- High autonomy and responsibility
- Continuous learning and adaptation
- Diverse, inclusive environment
- Work-life balance in demanding startup environment

Assessment priorities:
✓ Company values alignment and demonstration
✓ Diversity, equity, and inclusion mindset
✓ Long-term career goals alignment with company growth
✓ Learning and development approach
✓ Resilience and adaptability
✓ Cultural contribution potential to small team
✓ Work-life balance expectations

**Output Format:**
- Values-Based Questions & Responses
- Cultural Fit Assessment (1-10)
- Long-term Potential Evaluation
- DEI Mindset Assessment
- Learning & Development Alignment
- Culture Add vs Culture Fit Analysis
```

### 6. **Executive/Leadership Interview** (25 minutes)
```
@workspace You are a senior executive (VP/Director level) at RASSURE conducting a final interview. Focus on strategic thinking, leadership potential, and business impact. Reference job-postings/job1.md and my digital twin MCP server data.

RASSURE Strategic Context:
- Becoming global leader in airline revenue protection
- Scaling from startup to enterprise
- Innovation and competitive differentiation
- Building technical foundations for growth
- Developing future technical leaders

Evaluation criteria:
✓ Strategic thinking about business problems
✓ Understanding of RASSURE's market position
✓ Leadership philosophy and potential
✓ Innovation mindset and continuous improvement
✓ Ability to influence without authority
✓ Long-term vision for technical career
✓ Executive presence and communication

Ask 3-4 high-level strategic questions about the airline industry, technology trends, and career vision.

**Output Format:**
- Strategic Questions & Responses
- Business Acumen Assessment (1-10)
- Leadership Potential Rating (1-10)
- Strategic Thinking Evaluation
- Executive Presence Assessment
- Final Executive Approval/Rejection
```

---

## 📋 **Interview Tracking Spreadsheet Structure**

### **Master Score Tracker**
| Interview Type | Date | Interviewer Persona | Overall Score | Pass/Fail | Key Strengths | Areas for Improvement | Notes |
|----------------|------|-------------------|---------------|-----------|---------------|----------------------|-------|
| HR Screen | | | /10 | | | | |
| Technical | | | /10 | | | | |
| Hiring Manager | | | /10 | | | | |
| Project Manager | | | /10 | | | | |
| People & Culture | | | /10 | | | | |
| Executive | | | /10 | | | | |

### **Detailed Technical Scores**
| Skill Area | Score (1-10) | Feedback | Improvement Actions |
|------------|--------------|----------|-------------------|
| Python Proficiency | | | |
| SQL Optimization | | | |
| System Design | | | |
| Problem Solving | | | |
| Code Quality | | | |
| CS Fundamentals | | | |

### **Common Questions & Response Quality**
| Question Category | Best Response | Worst Response | Pattern Analysis |
|-------------------|---------------|----------------|------------------|
| Salary Expectations | | | |
| Technical Challenges | | | |
| Career Goals | | | |
| Why RASSURE | | | |
| Handling Ambiguity | | | |

---

## 🎯 **Success Metrics & Targets**

### **Minimum Passing Thresholds**
- **HR Screen:** Must Pass for continuation
- **Technical:** 7+ on Python, SQL, System Design
- **Hiring Manager:** 8+ overall role fit
- **Project Manager:** 7+ collaboration skills
- **People & Culture:** 8+ cultural alignment
- **Executive:** 6+ leadership potential

### **Excellence Benchmarks**
- **Technical:** 8+ across all areas
- **Business Impact:** Quantifiable examples in all responses
- **Cultural Fit:** 9+ across all soft skill interviews
- **Communication:** Consistent clarity across all personas

---

## 🔄 **Iteration Strategy**

### **After Each Interview Round:**
1. **Immediate Analysis:** Score and document feedback
2. **Pattern Recognition:** Identify recurring weaknesses
3. **Profile Enhancement:** Update digital twin with better responses
4. **Vector Database Sync:** Ensure new content is embedded
5. **Rest Period:** Wait 24-48 hours before next persona

### **Profile Improvement Focus Areas:**
- **Quantified Impact:** More specific numbers and business outcomes
- **Industry Knowledge:** Deeper airline domain expertise
- **Technical Depth:** More detailed implementation examples
- **Leadership Stories:** Additional STAR format examples
- **Cultural Alignment:** Better startup/entrepreneurial messaging

---

## 🚀 **Implementation Timeline**

### **Week 1:** Foundation Building
- Day 1-2: HR Screen + Technical Interview
- Day 3: Analyze results and enhance profile
- Day 4: Hiring Manager Interview
- Day 5: Profile refinements

### **Week 2:** Advanced Personas
- Day 1: Project Manager Interview
- Day 2: People & Culture Interview  
- Day 3: Profile enhancement based on feedback
- Day 4: Executive Interview
- Day 5: Final analysis and optimization

### **Week 3:** Optimization & Mastery
- Re-run any failed interviews
- A/B test different response approaches
- Final profile polish
- Real interview preparation

---

## 📈 **Success Indicators**

### **Ready for Real Interviews When:**
- ✅ Pass all 6 interview personas
- ✅ Consistently score 7+ on technical assessments
- ✅ Demonstrate clear value proposition for RASSURE
- ✅ Show authentic enthusiasm for airline industry
- ✅ Articulate specific examples of business impact
- ✅ Handle ambiguous questions with confidence

**Total Interview Simulations Target:** 12-15 iterations across all personas to achieve mastery.

This comprehensive approach ensures you're prepared for RASSURE's complete interview process and can confidently handle any interviewer type or questioning style!