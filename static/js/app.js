// HireSense AI - Client Application Logic

// Application State
const state = {
    currentProfile: null,
    userSkills: [],
    matchedJobs: [],
    allJobs: [],
    targetJob: null,
    selectedCategory: 'All',
    searchQuery: '',
    audioCtx: null,
    backendOnline: false,
    apiBase: ''
};

// Fallback Embedded Jobs Data (Ensures HTML file works standalone if double-clicked)
const EMBEDDED_JOBS = [
    {
        id: "job-101",
        title: "Junior Frontend Developer",
        company: "PixelCraft Technologies",
        location: "Chennai (Hybrid)",
        type: "Full-time",
        experience: "0-2 Years",
        salary: "₹4.5 - ₹6.5 LPA",
        category: "Frontend",
        skills: ["HTML", "CSS", "JavaScript", "React", "Git"],
        description: "Looking for an energetic frontend developer to build sleek web interfaces. Knowledge of React and modern CSS frameworks like Tailwind is a strong plus.",
        posted: "10 mins ago",
        urgent: true,
        applicants: 14
    },
    {
        id: "job-102",
        title: "Python & AI Associate",
        company: "CognitiveWave Labs",
        location: "Bangalore / Remote",
        type: "Full-time",
        experience: "0-1 Years",
        salary: "₹6.0 - ₹8.5 LPA",
        category: "AI / Data Science",
        skills: ["Python", "Pandas", "NumPy", "Machine Learning", "Generative AI", "Git"],
        description: "Join our AI research team to build cutting-edge LLM and agentic workflows. Experience in Prompt Engineering or RAG is an added bonus.",
        posted: "35 mins ago",
        urgent: true,
        applicants: 28
    },
    {
        id: "job-103",
        title: "Full Stack Web Engineer",
        company: "ZetaCloud Systems",
        location: "Coimbatore / Remote",
        type: "Full-time",
        experience: "1-3 Years",
        salary: "₹7.0 - ₹10.0 LPA",
        category: "Full Stack",
        skills: ["JavaScript", "React", "Node.js", "Express.js", "MongoDB", "REST API", "Git"],
        description: "Build scalable web applications end-to-end. You will work on responsive dashboards, secure RESTful APIs, and MongoDB integrations.",
        posted: "1 hour ago",
        urgent: false,
        applicants: 42
    },
    {
        id: "job-104",
        title: "Backend Developer (Python / Flask)",
        company: "FinEdge Digital",
        location: "Hyderabad",
        type: "Full-time",
        experience: "1-2 Years",
        salary: "₹5.5 - ₹8.0 LPA",
        category: "Backend",
        skills: ["Python", "Flask", "SQL", "REST API", "Docker", "Git"],
        description: "Develop high-throughput payment and analytics microservices with Python, Flask, and PostgreSQL.",
        posted: "2 hours ago",
        urgent: false,
        applicants: 19
    },
    {
        id: "job-105",
        title: "Associate Cloud & DevOps Engineer",
        company: "SkySphere Infrastructure",
        location: "Remote",
        type: "Full-time",
        experience: "0-2 Years",
        salary: "₹6.5 - ₹9.0 LPA",
        category: "DevOps",
        skills: ["Linux", "AWS", "Docker", "Git", "CI/CD", "Python"],
        description: "Manage containerized deployments, automate deployment pipelines, and maintain AWS cloud infrastructure.",
        posted: "3 hours ago",
        urgent: false,
        applicants: 31
    },
    {
        id: "job-106",
        title: "Junior Data Analyst",
        company: "MetricMinds Analytics",
        location: "Chennai",
        type: "Full-time",
        experience: "0-1 Years",
        salary: "₹4.0 - ₹5.5 LPA",
        category: "Data Science",
        skills: ["Python", "Pandas", "SQL", "NumPy", "Git"],
        description: "Extract insights from business data, build dynamic reports and assist senior data scientists in data preprocessing.",
        posted: "4 hours ago",
        urgent: false,
        applicants: 50
    }
];

// Fallback Embedded Sample Profiles
const EMBEDDED_PROFILES = {
    frontend: {
        name: "Arun Kumar",
        title: "Aspiring Frontend Developer",
        education: "B.E. Computer Science (2025)",
        experience_level: "Fresher (0-1 yr)",
        summary: "Enthusiastic front-end developer passionate about creating responsive, interactive web interfaces with React, JavaScript, and Tailwind CSS. Built 3 portfolio projects.",
        skills: ["HTML", "CSS", "JavaScript", "React", "Git", "REST API"],
        target_role: "Junior Frontend Developer"
    },
    ai_data: {
        name: "Priya Sharma",
        title: "AI & Data Science Enthusiast",
        education: "B.Tech Information Technology (2025)",
        experience_level: "Fresher (0-1 yr)",
        summary: "Data enthusiast with strong foundations in Python programming, Pandas, NumPy, and Machine Learning algorithms. Familiar with Prompt Engineering and Generative AI tools.",
        skills: ["Python", "Pandas", "NumPy", "SQL", "Machine Learning", "Generative AI", "Git"],
        target_role: "Python & AI Associate"
    },
    fullstack: {
        name: "Karthik Raja",
        title: "MERN Full Stack Developer",
        education: "B.Sc Computer Science (2024)",
        experience_level: "Junior (1-2 yrs)",
        summary: "Full stack web developer with hands-on experience in building RESTful web services, responsive UI with React, and backend services with Node.js and MongoDB.",
        skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Express.js", "MongoDB", "REST API", "Git"],
        target_role: "Full Stack Web Engineer"
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initDropzone();
    initFilterControls();
    initAlertButtons();
    await detectBackend();
    loadLiveJobs();
});

// Detect whether Python Flask backend is reachable
async function detectBackend() {
    const statusText = document.getElementById('backendStatusText');
    const badge = document.getElementById('backendStatusBadge');

    // If opened via file://, check if http://127.0.0.1:5000 is running
    state.apiBase = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : '';

    try {
        const res = await fetch(`${state.apiBase}/api/jobs`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
            state.backendOnline = true;
            statusText.textContent = "Python Backend Connected 🟢";
            badge.style.borderColor = "rgba(16, 185, 129, 0.4)";
            badge.style.color = "#34d399";
            return;
        }
    } catch (e) {
        // Backend offline or running in standalone HTML file mode
    }

    state.backendOnline = false;
    statusText.textContent = "HTML Client Mode ⚡ (Python Server Optional)";
    badge.style.borderColor = "rgba(99, 102, 241, 0.4)";
    badge.style.color = "#c7d2fe";
}


// Sound synthesizer using Web Audio API (Zero external audio file dependency!)
function playAlertChime() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!state.audioCtx) {
            state.audioCtx = new AudioContext();
        }
        if (state.audioCtx.state === 'suspended') {
            state.audioCtx.resume();
        }
        const ctx = state.audioCtx;

        // Play high-tech dual chime
        const now = ctx.currentTime;
        
        // Note 1
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Note 2
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, now + 0.12); // A5
        gain2.gain.setValueAtTime(0.2, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.55);
    } catch (e) {
        console.log("Audio alert playback muted or blocked by browser:", e);
    }
}

// Navigation Stepper & Tabs
function initNavigation() {
    const stepItems = document.querySelectorAll('.step-item');
    stepItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

function switchTab(tabId) {
    // Update step bar
    document.querySelectorAll('.step-item').forEach(step => {
        if (step.getAttribute('data-tab') === tabId) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Show tab pane
    document.querySelectorAll('.tab-pane').forEach(pane => {
        if (pane.id === tabId) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 1-Click Sample Profile Loader
async function loadSampleProfile(type) {
    try {
        let profile = null;
        if (state.backendOnline) {
            const response = await fetch(`${state.apiBase}/api/sample_profiles`);
            const data = await response.json();
            profile = data.profiles[type];
        } else {
            profile = EMBEDDED_PROFILES[type];
        }

        if (profile) {
            state.currentProfile = profile;
            state.userSkills = profile.skills;
            displayExtractedProfile({
                name: profile.name,
                skills: profile.skills,
                experience_level: profile.experience_level,
                extracted_preview: profile.summary,
                source: "Sample Profile: " + profile.title
            });

            showToast("✨ Sample Profile Loaded", `${profile.name} (${profile.title}) loaded! Now checking matching jobs...`, "success");

            // Auto-switch to matching after a short pause
            setTimeout(() => {
                runJobMatching();
            }, 600);
        }
    } catch (err) {
        showToast("Error", "Could not load sample profile: " + err.message, "error");
    }
}

// Drag & Drop Resume File Handler
function initDropzone() {
    const dropzone = document.getElementById('resumeDropzone');
    const fileInput = document.getElementById('resumeFileInput');
    const analyzeTextBtn = document.getElementById('btnAnalyzeText');
    const rawResumeText = document.getElementById('rawResumeText');

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadResumeFile(files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            uploadResumeFile(fileInput.files[0]);
        }
    });

    analyzeTextBtn.addEventListener('click', () => {
        const text = rawResumeText.value.trim();
        if (!text) {
            alert('Please paste some resume or skills text first.');
            return;
        }
        uploadResumeText(text);
    });
}

async function uploadResumeFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const badge = document.getElementById('resumeStatusBadge');
    badge.textContent = "Extracting with AI...";

    try {
        const res = await fetch('/api/parse_resume', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            displayExtractedProfile(data);
            showToast("📄 Resume Parsed Successfully", `Extracted ${data.skills.length} skills from ${file.name}.`, "success");
        } else {
            alert("Error parsing resume: " + data.error);
        }
    } catch (err) {
        alert("Upload error: " + err.message);
    }
}

async function uploadResumeText(text) {
    const formData = new FormData();
    formData.append('resume_text', text);

    try {
        const res = await fetch('/api/parse_resume', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            displayExtractedProfile(data);
            showToast("✅ Text Analyzed", `Extracted ${data.skills.length} technical skills.`, "success");
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        alert("Analyze error: " + err.message);
    }
}

// Display Extracted Profile in Stage 2
function displayExtractedProfile(data) {
    state.userSkills = data.skills || [];
    state.currentProfile = data;

    // Update Header Pill
    const initials = (data.name || "AK").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    document.getElementById('headerAvatar').textContent = initials;
    document.getElementById('headerProfileName').textContent = data.name || "Candidate";

    // Update Stage 2 Card
    document.getElementById('profileEmptyState').style.display = 'none';
    document.getElementById('profileDataView').style.display = 'block';

    document.getElementById('profileAvatarLg').textContent = initials;
    document.getElementById('profileNameDisplay').textContent = data.name || "Candidate";
    document.getElementById('profileTitleDisplay').textContent = data.source || "Uploaded Resume";
    document.getElementById('profileExpDisplay').textContent = data.experience_level || "Entry Level";
    document.getElementById('skillCount').textContent = state.userSkills.length;
    document.getElementById('resumeSnippetDisplay').textContent = data.extracted_preview || "No summary provided.";
    document.getElementById('resumeStatusBadge').textContent = "Ready for Matching";
    document.getElementById('resumeStatusBadge').className = "tag-badge";

    // Metric stat in overview
    document.getElementById('statExtractedSkills').textContent = state.userSkills.length;

    // Render skills cloud
    const cloud = document.getElementById('extractedSkillsCloud');
    cloud.innerHTML = '';
    if (state.userSkills.length === 0) {
        cloud.innerHTML = '<span class="text-muted">No specific tech skills recognized. You can type more in the text box.</span>';
    } else {
        state.userSkills.forEach(skill => {
            const span = document.createElement('span');
            span.className = 'skill-tag';
            span.textContent = skill;
            cloud.appendChild(span);
        });
    }

    // Switch to profile tab view if currently on dashboard
    switchTab('tab-profile');
}

// AI Job Matching (Stage 3)
async function runJobMatching(targetJobId = null) {
    if (!state.userSkills || state.userSkills.length === 0) {
        alert('Please upload a resume or select a sample profile first!');
        switchTab('tab-profile');
        return;
    }

    try {
        let scoredJobs = [];
        let selectedTarget = null;
        let careerGuidance = null;

        if (state.backendOnline) {
            const response = await fetch(`${state.apiBase}/api/analyze_matches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skills: state.userSkills,
                    target_job_id: targetJobId
                })
            });
            const data = await response.json();
            if (data.success) {
                scoredJobs = data.matches;
                selectedTarget = data.target_job;
                careerGuidance = data.career_guidance;
            }
        }

        // Fallback to client-side matching if backend is offline
        if (scoredJobs.length === 0) {
            const pool = state.allJobs.length > 0 ? state.allJobs : EMBEDDED_JOBS;
            scoredJobs = clientSideMatch(state.userSkills, pool);
            if (targetJobId) {
                selectedTarget = scoredJobs.find(j => j.id === targetJobId);
            }
            if (!selectedTarget && scoredJobs.length > 0) {
                selectedTarget = scoredJobs[0];
            }
            if (selectedTarget) {
                careerGuidance = clientSideGuidance(state.userSkills, selectedTarget);
            }
        }

        state.matchedJobs = scoredJobs;
        state.targetJob = selectedTarget;

        renderMatchingCards(scoredJobs);

        if (selectedTarget && careerGuidance) {
            renderSkillGapAndRoadmap(selectedTarget, careerGuidance);
        }

        // Update stats
        document.getElementById('evaluatedJobsCount').textContent = scoredJobs.length;
        const topScore = scoredJobs.length > 0 ? scoredJobs[0].match_percentage : 0;
        document.getElementById('topMatchPercentage').textContent = `${topScore}%`;
        document.getElementById('statMatchScore').textContent = `${topScore}%`;

        switchTab('tab-matching');
        showToast("🎯 Matching Complete", `Evaluated ${scoredJobs.length} live jobs. Highest match is ${topScore}%!`, "success");

    } catch (err) {
        console.error('Job matching error:', err);
    }
}

// Client-side matching algorithm
function clientSideMatch(userSkills, jobs) {
    const uSet = new Set(userSkills.map(s => s.toLowerCase()));
    const scored = jobs.map(job => {
        const matched = (job.skills || []).filter(s => uSet.has(s.toLowerCase()));
        const missing = (job.skills || []).filter(s => !uSet.has(s.toLowerCase()));
        const score = job.skills.length > 0 ? Math.round((matched.length / job.skills.length) * 100) : 0;
        return {
            ...job,
            match_percentage: score,
            matched_skills: matched,
            missing_skills: missing,
            status: score >= 75 ? "High Match" : (score >= 50 ? "Moderate Match" : "Potential Fit")
        };
    });
    scored.sort((a, b) => b.match_percentage - a.match_percentage);
    return scored;
}

// Client-side guidance generator
function clientSideGuidance(userSkills, targetJob) {
    const jobSkills = targetJob.skills || [];
    const uSet = new Set(userSkills.map(s => s.toLowerCase()));
    const matched = jobSkills.filter(s => uSet.has(s.toLowerCase()));
    const missing = jobSkills.filter(s => !uSet.has(s.toLowerCase()));
    const score = jobSkills.length > 0 ? Math.round((matched.length / jobSkills.length) * 100) : 0;

    const roadmap = [
        {
            week: "Week 1: Core Fundamentals",
            topic: `Master ${missing[0] || 'Core Architecture'} Fundamentals`,
            action: `Study official documentation for ${missing[0] || 'the stack'}, build 2 mini-exercises, and push to GitHub.`,
            resources: `FreeCodeCamp / YouTube crash course on ${missing[0] || 'Tech Stack'}`
        },
        {
            week: "Week 2: Practical Integration",
            topic: `Integrate ${matched[0] || 'Frontend'} with ${missing[1] || missing[0] || 'Backend API'}`,
            action: `Build an end-to-end feature integrating ${matched[0] || 'Core Stack'} with modern API services.`,
            resources: `Official documentation & GitHub sample repositories`
        },
        {
            week: "Week 3: Showcase Capstone Project",
            topic: `Build a Showcase Project for ${targetJob.title}`,
            action: `Create a deployable full-stack application highlighting ${(matched.concat(missing)).slice(0, 3).join(', ')}.`,
            resources: `GitHub README best practices & Portfolio templates`
        },
        {
            week: "Week 4: Mock Interviews & Applications",
            topic: "Interview Readiness & ATS Resume Polish",
            action: `Practice STAR method interview responses and submit targeted applications.`,
            resources: `LeetCode & Peer Mock Interviews`
        }
    ];

    const resume_tips = [
        `Prominently highlight target skills (${(matched.concat(missing)).slice(0, 4).join(', ')}) at the top of your resume for ATS parsers.`,
        `Add measurable impact metrics: e.g., 'Improved web performance by 30% using modern ${matched[0] || 'frontend'} practices.'`,
        `Include clickable GitHub and Live Demo links for all 2-3 key projects.`,
        `Keep resume to 1 clean page with clear sections: Summary, Technical Skills, Projects, Education.`
    ];

    const interview_qa = [
        {
            q: `How do you approach learning and integrating an unfamiliar technology like ${missing[0] || 'a modern library'} into a project?`,
            tip: `Explain your structured methodology: reading docs, building a prototype, evaluating trade-offs, and gradual testing.`
        },
        {
            q: `What was the most challenging technical bug you solved in your recent project?`,
            tip: `Use the STAR method (Situation, Task, Action, Result). Highlight debugging tools, root cause analysis, and measurable outcome.`
        },
        {
            q: `How do you ensure your code is maintainable, scalable, and easy for other developers to review?`,
            tip: `Mention version control best practices (clean commits, PR reviews), unit testing, modular components, and clear documentation.`
        }
    ];

    return {
        gap_info: {
            matched_skills: matched,
            missing_skills: missing,
            match_percentage: score
        },
        roadmap,
        resume_tips,
        interview_qa
    };
}

function renderMatchingCards(jobs) {
    const grid = document.getElementById('matchingResultsGrid');
    const emptyPrompt = document.getElementById('matchingEmptyPrompt');

    emptyPrompt.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';

    jobs.forEach(job => {
        const card = document.createElement('div');
        const scoreClass = job.match_percentage >= 75 ? 'score-high' : (job.match_percentage >= 50 ? 'score-medium' : 'score-low');
        card.className = `matched-job-card ${job.match_percentage >= 75 ? 'high-match' : ''}`;

        const matchedTags = (job.matched_skills || []).map(s => `<span class="skill-tag matched">✓ ${s}</span>`).join(' ');
        const missingTags = (job.missing_skills || []).map(s => `<span class="skill-tag missing">+ ${s}</span>`).join(' ');

        card.innerHTML = `
            <div>
                <div class="match-score-badge ${scoreClass}">
                    <span>${job.match_percentage}%</span> Match
                </div>
                <h4>${job.title}</h4>
                <p class="text-muted">${job.company} • ${job.location}</p>

                <div class="job-card-meta">
                    <span class="meta-item">💼 ${job.experience}</span>
                    <span class="meta-item">💰 ${job.salary}</span>
                    <span class="meta-item">🏷️ ${job.category}</span>
                </div>

                <div class="job-skills-section">
                    <span class="skills-subheading">Matching Skills (${(job.matched_skills || []).length})</span>
                    <div class="skills-tag-cloud">
                        ${matchedTags || '<span class="text-muted" style="font-size:0.8rem">No direct overlap</span>'}
                    </div>
                </div>

                ${(job.missing_skills || []).length > 0 ? `
                <div class="job-skills-section">
                    <span class="skills-subheading">Skill Gap to Cover (${job.missing_skills.length})</span>
                    <div class="skills-tag-cloud">
                        ${missingTags}
                    </div>
                </div>` : ''}
            </div>

            <div class="job-actions">
                <button class="btn btn-primary btn-sm btn-block" onclick="selectTargetJobForGap('${job.id}')">
                    🎯 View Skill Gap & 4-Week Roadmap
                </button>
                <button class="btn btn-secondary btn-sm" onclick="openJobDetailsModal('${job.id}')">
                    Details
                </button>
            </div>
        `;

        grid.appendChild(card);
    });
}

function selectTargetJobForGap(jobId) {
    runJobMatching(jobId);
    switchTab('tab-skills');
}

// Stage 4: Render Skill Gap & Career Assistant Roadmap
function renderSkillGapAndRoadmap(targetJob, guidance) {
    document.getElementById('gapEmptyPrompt').style.display = 'none';
    document.getElementById('gapContentWrapper').style.display = 'block';

    document.getElementById('targetRoleTitle').textContent = `${targetJob.title} @ ${targetJob.company}`;

    const gap = guidance.gap_info;

    // 1. Have skills
    const haveContainer = document.getElementById('skillsHaveList');
    haveContainer.innerHTML = '';
    if (gap.matched_skills.length === 0) {
        haveContainer.innerHTML = '<span class="text-muted">None directly matched yet.</span>';
    } else {
        gap.matched_skills.forEach(s => {
            const span = document.createElement('span');
            span.className = 'skill-tag matched';
            span.textContent = `✓ ${s}`;
            haveContainer.appendChild(span);
        });
    }

    // 2. Missing skills
    const missingContainer = document.getElementById('skillsMissingList');
    missingContainer.innerHTML = '';
    if (gap.missing_skills.length === 0) {
        missingContainer.innerHTML = '<span class="tag-badge">🎉 100% Skill Coverage! You have all required skills.</span>';
    } else {
        gap.missing_skills.forEach(s => {
            const span = document.createElement('span');
            span.className = 'skill-tag missing';
            span.textContent = `⚡ Learn: ${s}`;
            missingContainer.appendChild(span);
        });
    }

    // 3. 4-Week Learning Roadmap
    const timeline = document.getElementById('roadmapTimeline');
    timeline.innerHTML = '';
    (guidance.roadmap || []).forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-dot"></div>
            <span class="timeline-week">${item.week}</span>
            <h5 class="timeline-topic">${item.topic}</h5>
            <p class="timeline-action">${item.action}</p>
            <p class="timeline-resource">📚 Recommended: ${item.resources}</p>
        `;
        timeline.appendChild(div);
    });

    // 4. Resume Tips
    const tipsList = document.getElementById('resumeTipsList');
    tipsList.innerHTML = '';
    (guidance.resume_tips || []).forEach(tip => {
        const li = document.createElement('li');
        li.textContent = tip;
        tipsList.appendChild(li);
    });

    // 5. Interview Q&As
    const qaList = document.getElementById('interviewQaList');
    qaList.innerHTML = '';
    (guidance.interview_qa || []).forEach(item => {
        const div = document.createElement('div');
        div.className = 'qa-box';
        div.innerHTML = `
            <h5>❓ ${item.q}</h5>
            <p><strong>Coach Tip:</strong> ${item.tip}</p>
        `;
        qaList.appendChild(div);
    });
}

// Stage 5: Live Vacancies & Real-Time Feed
async function loadLiveJobs() {
    try {
        let jobs = [];
        if (state.backendOnline) {
            const res = await fetch(`${state.apiBase}/api/jobs?category=${encodeURIComponent(state.selectedCategory)}&search=${encodeURIComponent(state.searchQuery)}`);
            const data = await res.json();
            jobs = data.jobs;
        } else {
            // Client-side filtering
            jobs = EMBEDDED_JOBS.filter(j => {
                const matchCat = state.selectedCategory === 'All' || j.category === state.selectedCategory;
                const matchSearch = !state.searchQuery || 
                    j.title.toLowerCase().includes(state.searchQuery) ||
                    j.company.toLowerCase().includes(state.searchQuery) ||
                    j.skills.some(s => s.toLowerCase().includes(state.searchQuery));
                return matchCat && matchSearch;
            });
        }
        state.allJobs = jobs;
        document.getElementById('statTotalJobs').textContent = jobs.length;
        renderLiveJobsFeed(jobs);
    } catch (err) {
        console.error('Error fetching jobs feed:', err);
    }
}

function renderLiveJobsFeed(jobs) {
    const container = document.getElementById('liveJobsContainer');
    container.innerHTML = '';

    if (!jobs || jobs.length === 0) {
        container.innerHTML = `
            <div class="card empty-state">
                <h4>No jobs match your filter.</h4>
                <p>Try searching for a different keyword or select "All Jobs".</p>
            </div>
        `;
        return;
    }

    jobs.forEach(job => {
        const item = document.createElement('div');
        item.className = `live-job-item ${job.urgent ? 'urgent-item' : ''}`;

        const skillsTags = (job.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join(' ');

        item.innerHTML = `
            <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <h4>${job.title}</h4>
                    ${job.urgent ? '<span class="urgent-badge">⚡ URGENT HIRING</span>' : ''}
                </div>
                <p class="text-muted" style="margin: 4px 0 10px;">${job.company} • 📍 ${job.location} • 🕒 ${job.posted}</p>
                <div class="job-card-meta">
                    <span class="meta-item">💼 ${job.experience}</span>
                    <span class="meta-item">💰 ${job.salary}</span>
                    <span class="meta-item">👥 ${job.applicants || 12} Applicants</span>
                </div>
                <div class="skills-tag-cloud" style="margin-top: 10px;">
                    ${skillsTags}
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; min-width: 140px;">
                <button class="btn btn-primary btn-sm" onclick="openJobDetailsModal('${job.id}')">
                    Quick Apply 🚀
                </button>
                <button class="btn btn-secondary btn-sm" onclick="matchSingleJob('${job.id}')">
                    Check Match %
                </button>
            </div>
        `;

        container.appendChild(item);
    });
}

function initFilterControls() {
    const searchInput = document.getElementById('jobSearchInput');
    const catPills = document.querySelectorAll('.cat-pill');

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            state.searchQuery = e.target.value.trim();
            loadLiveJobs();
        }, 300);
    });

    catPills.forEach(pill => {
        pill.addEventListener('click', () => {
            catPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.selectedCategory = pill.getAttribute('data-cat');
            loadLiveJobs();
        });
    });

    document.getElementById('btnResetJobs').addEventListener('click', async () => {
        await fetch('/api/reset_jobs', { method: 'POST' });
        state.searchQuery = '';
        searchInput.value = '';
        state.selectedCategory = 'All';
        catPills.forEach(p => p.classList.remove('active'));
        catPills[0].classList.add('active');
        await loadLiveJobs();
        showToast("🔄 Jobs Feed Reset", "Restored initial vacancy list.", "info");
    });
}

// Special Feature: Real-Time Live Job Alert Simulation
function initAlertButtons() {
    const triggerSimAlert = async () => {
        try {
            let newJob = null;
            let matchResult = null;

            if (state.backendOnline) {
                const res = await fetch(`${state.apiBase}/api/simulate_new_job`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_skills: state.userSkills })
                });
                const data = await res.json();
                if (data.success) {
                    newJob = data.new_job;
                    matchResult = data.match_result;
                }
            } else {
                // Client-side simulation
                newJob = {
                    id: "live-" + Date.now(),
                    title: "Urgent: Junior AI / Full-Stack Trainee",
                    company: "HyperTech Innovations",
                    location: "Chennai / Remote",
                    type: "Immediate Joining",
                    experience: "0-1 Years",
                    salary: "₹5.5 - ₹7.5 LPA",
                    category: "Frontend",
                    skills: ["HTML", "CSS", "JavaScript", "React", "Python", "Git"],
                    description: "High priority opening for enthusiastic freshers and entry-level engineers.",
                    posted: "Just now 🔥",
                    urgent: true,
                    applicants: 3
                };
                EMBEDDED_JOBS.unshift(newJob);
                if (state.userSkills && state.userSkills.length > 0) {
                    const uSet = new Set(state.userSkills.map(s => s.toLowerCase()));
                    const matched = newJob.skills.filter(s => uSet.has(s.toLowerCase()));
                    matchResult = {
                        match_percentage: Math.round((matched.length / newJob.skills.length) * 100),
                        matched_skills: matched
                    };
                }
            }

            if (newJob) {
                // Play audio chime
                playAlertChime();

                // Refresh feed
                loadLiveJobs();

                const matchMsg = matchResult 
                    ? `Match Score: ${matchResult.match_percentage}% (${matchResult.matched_skills.join(', ')})`
                    : 'Upload your resume to check instant compatibility!';

                // Fire Rich Toast Notification
                showToast(
                    `⚡ URGENT JOB ALERT: ${newJob.title}`,
                    `${newJob.company} posted a new opening! ${matchMsg}`,
                    "urgent",
                    newJob.id
                );
            }
        } catch (err) {
            console.error('Alert simulation error:', err);
        }
    };

    document.getElementById('btnSimulateAlert').addEventListener('click', triggerSimAlert);
    document.getElementById('btnSimulateFeed').addEventListener('click', triggerSimAlert);
}

// Toast Notifications
function showToast(title, message, type = "info", jobId = null) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = "🔔";
    if (type === "urgent") icon = "⚡";
    if (type === "success") icon = "🎉";
    if (type === "error") icon = "⚠️";

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <h5>${title}</h5>
            <p>${message}</p>
            ${jobId ? `
            <div class="toast-action">
                <button class="btn btn-primary btn-sm" onclick="openJobDetailsModal('${jobId}')">View & Apply</button>
                <button class="btn btn-secondary btn-sm" onclick="matchSingleJob('${jobId}')">Check Match</button>
            </div>` : ''}
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Auto-remove after 7 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 7000);
}

function matchSingleJob(jobId) {
    if (!state.userSkills || state.userSkills.length === 0) {
        showToast("⚠️ Profile Needed", "Upload a resume first to calculate match score.", "error");
        switchTab('tab-profile');
        return;
    }
    runJobMatching(jobId);
}

// Job Details & Quick Apply Modal
function openJobDetailsModal(jobId) {
    const job = (state.matchedJobs && state.matchedJobs.find(j => j.id === jobId)) 
             || (state.allJobs && state.allJobs.find(j => j.id === jobId));

    if (!job) return;

    document.getElementById('modalJobTitle').textContent = job.title;
    document.getElementById('modalJobCompany').textContent = `${job.company} • ${job.location} • ${job.salary}`;

    const body = document.getElementById('modalJobBody');
    const skillsPills = (job.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join(' ');

    body.innerHTML = `
        <p style="margin-bottom: 16px; font-size: 0.95rem; line-height: 1.6;">${job.description}</p>
        
        <h5 style="margin-bottom: 8px;">Key Qualifications & Skills:</h5>
        <div class="skills-tag-cloud" style="margin-bottom: 18px;">
            ${skillsPills}
        </div>

        <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; font-size: 0.85rem;">
            <div>📅 <strong>Posted:</strong> ${job.posted}</div>
            <div>💼 <strong>Experience:</strong> ${job.experience}</div>
            <div>👥 <strong>Applicants:</strong> ${job.applicants || 15} candidates applied</div>
        </div>
    `;

    document.getElementById('jobModalOverlay').classList.add('active');
}

function closeJobModal() {
    document.getElementById('jobModalOverlay').classList.remove('active');
}

function applyJobAction() {
    alert("🎉 Application Submitted Successfully! HireSense AI has sent your profile and matching score to the recruiter.");
    closeJobModal();
}
