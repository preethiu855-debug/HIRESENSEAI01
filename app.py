import os
import re
import json
import time
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory
from pypdf import PdfReader

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max

# Enable CORS for direct HTML file access
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

# Master Skill Dictionary for Skill Extraction
SKILLS_TAXONOMY = {
    # Frontend
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3", "sass", "scss", "tailwind", "bootstrap"],
    "JavaScript": ["javascript", "js", "es6"],
    "TypeScript": ["typescript", "ts"],
    "React": ["react", "react.js", "reactjs"],
    "Next.js": ["next.js", "nextjs"],
    "Vue.js": ["vue", "vue.js", "vuejs"],
    "Angular": ["angular", "angularjs"],
    "Redux": ["redux", "redux toolkit"],

    # Backend
    "Python": ["python", "python3"],
    "Django": ["django", "django rest framework"],
    "Flask": ["flask"],
    "FastAPI": ["fastapi"],
    "Node.js": ["node.js", "nodejs", "node"],
    "Express.js": ["express", "express.js"],
    "Java": ["java", "spring", "spring boot"],
    "C++": ["c++", "cpp"],
    "C#": ["c#", ".net", "dotnet"],
    "PHP": ["php", "laravel"],
    "Go": ["golang", "go"],
    "Rust": ["rust"],

    # Databases
    "SQL": ["sql", "mysql", "postgresql", "postgres", "sqlite"],
    "MongoDB": ["mongodb", "mongo", "nosql"],
    "Redis": ["redis"],
    "Firebase": ["firebase", "firestore"],

    # Cloud & DevOps
    "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda"],
    "Azure": ["azure"],
    "GCP": ["gcp", "google cloud platform", "google cloud"],
    "Docker": ["docker", "containerization"],
    "Kubernetes": ["kubernetes", "k8s"],
    "Git": ["git", "github", "gitlab"],
    "CI/CD": ["ci/cd", "ci cd", "jenkins", "github actions"],
    "Linux": ["linux", "bash", "shell scripting"],

    # AI / ML & Data
    "Machine Learning": ["machine learning", "ml", "scikit-learn", "sklearn"],
    "Deep Learning": ["deep learning", "neural networks"],
    "TensorFlow": ["tensorflow", "keras"],
    "PyTorch": ["pytorch"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "NLP": ["nlp", "natural language processing", "spacy", "nltk"],
    "Computer Vision": ["computer vision", "opencv"],
    "Generative AI": ["generative ai", "genai", "llm", "rag", "langchain", "prompt engineering", "gemini", "openai"],

    # Other / Testing / APIs
    "REST API": ["rest api", "restful api", "apis", "graphql"],
    "Postman": ["postman"],
    "Agile / Scrum": ["agile", "scrum", "jira"]
}

# Live Job Vacancies Database
INITIAL_JOBS = [
    {
        "id": "job-101",
        "title": "Junior Frontend Developer",
        "company": "PixelCraft Technologies",
        "location": "Chennai (Hybrid)",
        "type": "Full-time",
        "experience": "0-2 Years",
        "salary": "₹4.5 - ₹6.5 LPA",
        "category": "Frontend",
        "skills": ["HTML", "CSS", "JavaScript", "React", "Git"],
        "description": "Looking for an energetic frontend developer to build sleek web interfaces. Knowledge of React and modern CSS frameworks like Tailwind is a strong plus.",
        "posted": "10 mins ago",
        "urgent": True,
        "applicants": 14
    },
    {
        "id": "job-102",
        "title": "Python & AI Associate",
        "company": "CognitiveWave Labs",
        "location": "Bangalore / Remote",
        "type": "Full-time",
        "experience": "0-1 Years",
        "salary": "₹6.0 - ₹8.5 LPA",
        "category": "AI / Data Science",
        "skills": ["Python", "Pandas", "NumPy", "Machine Learning", "Generative AI", "Git"],
        "description": "Join our AI research team to build cutting-edge LLM and agentic workflows. Experience in Prompt Engineering or RAG is an added bonus.",
        "posted": "35 mins ago",
        "urgent": True,
        "applicants": 28
    },
    {
        "id": "job-103",
        "title": "Full Stack Web Engineer",
        "company": "ZetaCloud Systems",
        "location": "Coimbatore / Remote",
        "type": "Full-time",
        "experience": "1-3 Years",
        "salary": "₹7.0 - ₹10.0 LPA",
        "category": "Full Stack",
        "skills": ["JavaScript", "React", "Node.js", "Express.js", "MongoDB", "REST API", "Git"],
        "description": "Build scalable web applications end-to-end. You will work on responsive dashboards, secure RESTful APIs, and MongoDB integrations.",
        "posted": "1 hour ago",
        "urgent": False,
        "applicants": 42
    },
    {
        "id": "job-104",
        "title": "Backend Developer (Python / Flask)",
        "company": "FinEdge Digital",
        "location": "Hyderabad",
        "type": "Full-time",
        "experience": "1-2 Years",
        "salary": "₹5.5 - ₹8.0 LPA",
        "category": "Backend",
        "skills": ["Python", "Flask", "SQL", "REST API", "Docker", "Git"],
        "description": "Develop high-throughput payment and analytics microservices with Python, Flask, and PostgreSQL.",
        "posted": "2 hours ago",
        "urgent": False,
        "applicants": 19
    },
    {
        "id": "job-105",
        "title": "Associate Cloud & DevOps Engineer",
        "company": "SkySphere Infrastructure",
        "location": "Remote",
        "type": "Full-time",
        "experience": "0-2 Years",
        "salary": "₹6.5 - ₹9.0 LPA",
        "category": "DevOps",
        "skills": ["Linux", "AWS", "Docker", "Git", "CI/CD", "Python"],
        "description": "Manage containerized deployments, automate deployment pipelines, and maintain AWS cloud infrastructure.",
        "posted": "3 hours ago",
        "urgent": False,
        "applicants": 31
    },
    {
        "id": "job-106",
        "title": "Junior Data Analyst",
        "company": "MetricMinds Analytics",
        "location": "Chennai",
        "type": "Full-time",
        "experience": "0-1 Years",
        "salary": "₹4.0 - ₹5.5 LPA",
        "category": "Data Science",
        "skills": ["Python", "Pandas", "SQL", "NumPy", "Git"],
        "description": "Extract insights from business data, build dynamic reports and assist senior data scientists in data preprocessing.",
        "posted": "4 hours ago",
        "urgent": False,
        "applicants": 50
    }
]

# Simulated incoming live vacancies for the Real-Time Alert Demonstration
SIMULATION_STREAM = [
    {
        "id": "job-alert-201",
        "title": "Urgent: Junior React Frontend Developer",
        "company": "HyperDrive Innovations",
        "location": "Chennai / Remote",
        "type": "Immediate Joining",
        "experience": "0-1 Years",
        "salary": "₹5.0 - ₹7.0 LPA",
        "category": "Frontend",
        "skills": ["HTML", "CSS", "JavaScript", "React", "Git", "REST API"],
        "description": "High priority hiring! Seeking a skilled React developer who can start immediately. Friendly team and rapid growth path.",
        "posted": "Just now",
        "urgent": True,
        "applicants": 3
    },
    {
        "id": "job-alert-202",
        "title": "AI & GenAI Solutions Engineer",
        "company": "NextGen Intelligence",
        "location": "Bangalore (Hybrid)",
        "type": "Full-time",
        "experience": "0-2 Years",
        "salary": "₹8.0 - ₹12.0 LPA",
        "category": "AI / Data Science",
        "skills": ["Python", "Machine Learning", "Generative AI", "Pandas", "Docker", "REST API"],
        "description": "Build next-generation generative AI tools with LLMs and vector databases. Fantastic opportunity for AI enthusiasts.",
        "posted": "Just now",
        "urgent": True,
        "applicants": 2
    },
    {
        "id": "job-alert-203",
        "title": "MERN Stack Graduate Trainee",
        "company": "CodeOrbit Studios",
        "location": "Coimbatore / Remote",
        "type": "Full-time",
        "experience": "0-1 Years",
        "salary": "₹4.8 - ₹6.2 LPA",
        "category": "Full Stack",
        "skills": ["JavaScript", "React", "Node.js", "Express.js", "MongoDB", "Git"],
        "description": "Freshers and 2024/2025/2026 graduates with hands-on MERN stack project experience are warmly invited to apply.",
        "posted": "Just now",
        "urgent": True,
        "applicants": 5
    }
]

# Pre-packaged sample profiles for instant 1-click testing
SAMPLE_PROFILES = {
    "frontend": {
        "name": "Arun Kumar",
        "title": "Aspiring Frontend Developer",
        "education": "B.E. Computer Science (2025)",
        "experience_level": "Fresher (0-1 yr)",
        "summary": "Enthusiastic front-end developer passionate about creating responsive, interactive web interfaces with React, JavaScript, and Tailwind CSS. Built 3 portfolio projects.",
        "skills": ["HTML", "CSS", "JavaScript", "React", "Git", "REST API"],
        "target_role": "Junior Frontend Developer"
    },
    "ai_data": {
        "name": "Priya Sharma",
        "title": "AI & Data Science Enthusiast",
        "education": "B.Tech Information Technology (2025)",
        "experience_level": "Fresher (0-1 yr)",
        "summary": "Data enthusiast with strong foundations in Python programming, Pandas, NumPy, and Machine Learning algorithms. Familiar with Prompt Engineering and Generative AI tools.",
        "skills": ["Python", "Pandas", "NumPy", "SQL", "Machine Learning", "Generative AI", "Git"],
        "target_role": "Python & AI Associate"
    },
    "fullstack": {
        "name": "Karthik Raja",
        "title": "MERN Full Stack Developer",
        "education": "B.Sc Computer Science (2024)",
        "experience_level": "Junior (1-2 yrs)",
        "summary": "Full stack web developer with hands-on experience in building RESTful web services, responsive UI with React, and backend services with Node.js and MongoDB.",
        "skills": ["HTML", "CSS", "JavaScript", "React", "Node.js", "Express.js", "MongoDB", "REST API", "Git"],
        "target_role": "Full Stack Web Engineer"
    }
}

# In-memory storage for active session jobs
current_jobs = list(INITIAL_JOBS)
simulation_pointer = 0


def extract_skills_from_text(text: str) -> list:
    """Extract known technical skills from text using taxonomy patterns."""
    text_lower = " " + re.sub(r'[^\w\+\#\.\/]', ' ', text.lower()) + " "
    matched_skills = set()

    for skill_name, aliases in SKILLS_TAXONOMY.items():
        for alias in aliases:
            # Word boundary regex
            pattern = r'(?:\b|[^a-zA-Z0-9])' + re.escape(alias) + r'(?:\b|[^a-zA-Z0-9])'
            if re.search(pattern, text_lower):
                matched_skills.add(skill_name)
                break

    return sorted(list(matched_skills))


def calculate_match(user_skills: list, job_skills: list):
    """Calculate match percentage and skill gap."""
    user_skills_set = set(user_skills)
    job_skills_set = set(job_skills)

    matched = sorted(list(user_skills_set.intersection(job_skills_set)))
    missing = sorted(list(job_skills_set.difference(user_skills_set)))
    bonus = sorted(list(user_skills_set.difference(job_skills_set)))

    total_required = len(job_skills_set)
    if total_required == 0:
        score = 0
    else:
        score = int(round((len(matched) / total_required) * 100))

    return {
        "match_percentage": min(score, 100),
        "matched_skills": matched,
        "missing_skills": missing,
        "bonus_skills": bonus[:4],  # top 4 extra skills
        "status": "High Match" if score >= 75 else ("Moderate Match" if score >= 50 else "Potential Fit")
    }


def generate_career_guidance(user_skills: list, target_job: dict):
    """Generate personalized skill improvement roadmap, resume tips, and interview Q&As."""
    job_skills = target_job.get("skills", [])
    gap_info = calculate_match(user_skills, job_skills)
    missing = gap_info["missing_skills"]
    matched = gap_info["matched_skills"]
    title = target_job.get("title", "Software Developer")

    # Roadmap creation
    roadmap = []
    if missing:
        week1_skill = missing[0]
        roadmap.append({
            "week": "Week 1: Core Fundamentals",
            "topic": f"Master {week1_skill} Basics & Environment Setup",
            "action": f"Read official documentation for {week1_skill}, build 2 mini-exercises, and commit to GitHub.",
            "resources": f"FreeCodeCamp / YouTube crash course on {week1_skill}"
        })
        if len(missing) > 1:
            week2_skill = missing[1]
            roadmap.append({
                "week": "Week 2: Practical Application",
                "topic": f"Deep Dive into {week2_skill} & Integration",
                "action": f"Build an end-to-end feature integrating {matched[0] if matched else 'Core Stack'} with {week2_skill}.",
                "resources": f"Official tutorial & GitHub sample repositories"
            })
        else:
            roadmap.append({
                "week": "Week 2: Advanced Topics",
                "topic": f"Best Practices & Performance with {week1_skill}",
                "action": f"Implement error handling, testing, and clean architecture with {week1_skill}.",
                "resources": "Medium & Dev.to architectural patterns"
            })
    else:
        roadmap.append({
            "week": "Week 1: System Design Basics",
            "topic": "Architecture & Clean Code Principles",
            "action": "Refactor your portfolio projects to follow industry clean code and SOLID principles.",
            "resources": "Clean Code guide & System Design Primer"
        })
        roadmap.append({
            "week": "Week 2: Cloud Deployment & CI/CD",
            "topic": "Dockerize and Deploy Projects to Cloud",
            "action": "Deploy live full-stack projects on Render/Vercel with automated GitHub Actions CI/CD.",
            "resources": "Docker & GitHub Actions quickstart"
        })

    roadmap.append({
        "week": "Week 3: Capstone Portfolio Project",
        "topic": f"Build a Showcase Project for {title}",
        "action": f"Create a production-ready application showcasing {', '.join((matched + missing)[:3])} with live demo link.",
        "resources": "GitHub README best practices & Portfolio templates"
    })
    roadmap.append({
        "week": "Week 4: Mock Interviews & Job Applications",
        "topic": "Behavioral & Technical Interview Readiness",
        "action": "Practice 20 common interview questions, polish LinkedIn headline, and apply to 5 targeted companies.",
        "resources": "LeetCode / Pramp peer mock interviews"
    })

    # Resume tips
    resume_tips = [
        f"Add measurable impact metrics: e.g., 'Improved web performance by 35% using modern {matched[0] if matched else 'frontend'} practices.'",
        f"Prominently highlight target skills ({', '.join((matched + missing)[:4])}) in the top Skills section of your resume for ATS parsers.",
        "Include clickable GitHub and Live Demo links for all 2-3 key projects.",
        "Keep resume to 1 clean page with clear sections: Summary, Technical Skills, Projects, Education."
    ]

    # Curated Top Interview Questions for this role
    interview_qa = [
        {
            "q": f"How do you approach learning and integrating a new technology like {missing[0] if missing else 'a modern framework'} into an existing project?",
            "tip": "Explain your structured methodology: reading docs, building a prototype, evaluating trade-offs, and gradual testing."
        },
        {
            "q": f"What was the most challenging technical bug you solved in your recent project?",
            "tip": "Use the STAR method (Situation, Task, Action, Result). Highlight debugging tools, root cause analysis, and measurable outcome."
        },
        {
            "q": "How do you ensure your code is maintainable, scalable, and easy for other developers to review?",
            "tip": "Mention version control best practices (clean commits, PR reviews), unit testing, modular components, and clear documentation."
        }
    ]

    return {
        "gap_info": gap_info,
        "roadmap": roadmap,
        "resume_tips": resume_tips,
        "interview_qa": interview_qa
    }


# ================= ROUTES =================

@app.route('/')
def home():
    if os.path.exists(os.path.join(BASE_DIR, 'index.html')):
        return send_from_directory(BASE_DIR, 'index.html')
    return render_template('index.html')


@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    """Retrieve all current job postings with optional filtering."""
    category = request.args.get('category', '').strip()
    search = request.args.get('search', '').strip().lower()

    filtered = current_jobs
    if category and category != 'All':
        filtered = [j for j in filtered if j.get('category') == category]

    if search:
        filtered = [
            j for j in filtered
            if search in j.get('title', '').lower()
            or search in j.get('company', '').lower()
            or any(search in s.lower() for s in j.get('skills', []))
        ]

    return jsonify({"jobs": filtered, "total": len(filtered)})


@app.route('/api/sample_profiles', methods=['GET'])
def get_sample_profiles():
    """Return pre-built student profiles for instant 1-click test drive."""
    return jsonify({"profiles": SAMPLE_PROFILES})


@app.route('/api/parse_resume', methods=['POST'])
def parse_resume():
    """Extract text and skills from uploaded PDF or raw text."""
    extracted_text = ""
    source_name = "Text Input"

    if 'file' in request.files:
        file = request.files['file']
        if file.filename != '':
            source_name = file.filename
            if file.filename.lower().endswith('.pdf'):
                try:
                    reader = PdfReader(file)
                    text_parts = [page.extract_text() or '' for page in reader.pages]
                    extracted_text = "\n".join(text_parts)
                except Exception as e:
                    return jsonify({"success": False, "error": f"Failed to parse PDF: {str(e)}"}), 400
            else:
                try:
                    extracted_text = file.read().decode('utf-8', errors='ignore')
                except Exception as e:
                    return jsonify({"success": False, "error": f"Failed to read file: {str(e)}"}), 400

    if not extracted_text:
        extracted_text = request.form.get('resume_text', '')

    if not extracted_text.strip():
        return jsonify({"success": False, "error": "No resume text or document provided."}), 400

    skills = extract_skills_from_text(extracted_text)

    # Estimate experience level from keywords
    text_lower = extracted_text.lower()
    exp = "Fresher / Entry-Level"
    if any(k in text_lower for k in ["3+ years", "4 years", "5 years", "senior", "lead"]):
        exp = "Mid-Senior Level"
    elif any(k in text_lower for k in ["1 year", "2 years", "junior"]):
        exp = "Junior (1-2 Years)"

    # Identify candidate name heuristic
    lines = [line.strip() for line in extracted_text.splitlines() if line.strip()]
    first_name = lines[0] if lines and len(lines[0]) < 40 else "Aspiring Professional"

    return jsonify({
        "success": True,
        "source": source_name,
        "name": first_name,
        "skills": skills,
        "experience_level": exp,
        "extracted_preview": extracted_text[:400] + ("..." if len(extracted_text) > 400 else "")
    })


@app.route('/api/analyze_matches', methods=['POST'])
def analyze_matches():
    """Match user skills with all live jobs and generate gap analysis & career plan."""
    data = request.json or {}
    user_skills = data.get('skills', [])
    target_job_id = data.get('target_job_id', None)

    if not user_skills:
        return jsonify({"success": False, "error": "User skills list is required."}), 400

    scored_jobs = []
    for job in current_jobs:
        match_data = calculate_match(user_skills, job.get('skills', []))
        scored_job = dict(job)
        scored_job.update(match_data)
        scored_jobs.append(scored_job)

    # Sort jobs by highest match percentage first
    scored_jobs.sort(key=lambda x: x['match_percentage'], reverse=True)

    # Pick the target job (either specified or highest matching job)
    selected_target = None
    if target_job_id:
        selected_target = next((j for j in scored_jobs if j['id'] == target_job_id), None)
    if not selected_target and scored_jobs:
        selected_target = scored_jobs[0]

    career_guidance = {}
    if selected_target:
        career_guidance = generate_career_guidance(user_skills, selected_target)

    return jsonify({
        "success": True,
        "total_jobs_evaluated": len(scored_jobs),
        "matches": scored_jobs,
        "target_job": selected_target,
        "career_guidance": career_guidance
    })


@app.route('/api/simulate_new_job', methods=['POST'])
def simulate_new_job():
    """Simulates a live incoming job posting from connected sources to demonstrate real-time alerts."""
    global simulation_pointer
    new_job = dict(SIMULATION_STREAM[simulation_pointer % len(SIMULATION_STREAM)])
    new_job["id"] = f"live-{int(time.time())}"
    new_job["posted"] = "Just now 🔥"
    simulation_pointer += 1

    # Insert at top of current jobs feed
    current_jobs.insert(0, new_job)

    # Optional check against user's skills to see if it's an instant match
    user_skills = request.json.get('user_skills', []) if request.json else []
    match_result = None
    if user_skills:
        match_result = calculate_match(user_skills, new_job.get("skills", []))

    return jsonify({
        "success": True,
        "new_job": new_job,
        "match_result": match_result,
        "message": "New job arrived in the live feed!"
    })


@app.route('/api/reset_jobs', methods=['POST'])
def reset_jobs():
    """Reset jobs list back to initial seed."""
    global current_jobs
    current_jobs = list(INITIAL_JOBS)
    return jsonify({"success": True, "message": "Jobs reset to default list."})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[HireSense AI] Server running at: http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
