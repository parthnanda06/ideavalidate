// API Configuration
const API_BASE_URL = "/api";

// Firebase removed as per user request

// State Management
let savedValidations = [];
try {
  savedValidations = JSON.parse(localStorage.getItem("validations")) || [];
} catch (e) {
  console.error("Error parsing saved validations:", e);
  savedValidations = [];
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  loadSavedValidations();
  // checkUserSession(); // Replaced by Firebase Auth Observer
  setupSmoothScroll();
  setupNavigation();
}

// Auth setup removed

// Event Listeners
function setupEventListeners() {
  // Form submission
  const validatorForm = document.getElementById("validatorForm");
  if (validatorForm) {
    validatorForm.addEventListener("submit", handleFormSubmit);
  }

  // Hamburger menu
  document
    .querySelector(".hamburger")
    ?.addEventListener("click", toggleMobileMenu);

  // Note: Old auth listeners removed

  // Hamburger menu
  document
    .querySelector(".hamburger")
    ?.addEventListener("click", toggleMobileMenu);

  // Navigation links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      scrollToSection(targetId);
      document
        .querySelectorAll(".nav-link")
        .forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

// Navigation
function setupNavigation() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.pageYOffset >= sectionTop - 100) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });
}

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function scrollToValidator() {
  scrollToSection("validator");
}

function scrollToFeatures() {
  scrollToSection("features");
}

function toggleMobileMenu() {
  const navMenu = document.querySelector(".nav-menu");
  navMenu.classList.toggle("active");
}

// Form Handling

// --- WIZARD LOGIC ---
let currentStep = 1;
let chartInstance = null;

function showStep(step) {
  // Hide all steps
  document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
  
  // Show target step
  document.getElementById(`step${step}`).classList.add('active');
  
  // Update progress bar
  document.querySelectorAll('.progress-step').forEach(el => {
    const stepNum = parseInt(el.getAttribute('data-step'));
    if (stepNum <= step) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  currentStep = step;
}

function nextStep(current) {
  if (validateStep(current)) {
    if (current === 3) {
      updateReviewSummary();
    }
    showStep(current + 1);
  }
}

function prevStep(current) {
  showStep(current - 1);
}

function validateStep(step) {
  const stepEl = document.getElementById(`step${step}`);
  const inputs = stepEl.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;

  inputs.forEach(input => {
    if (!input.value.trim()) {
      isValid = false;
      input.style.borderColor = 'var(--danger-color)';
      // Shake animation or visual cue could be added here
    } else {
      input.style.borderColor = 'var(--border-color)';
    }
  });

  if (!isValid) {
    alert("Please fill in all required fields.");
  }
  return isValid;
}

function handleIndustryChange() {
  const industrySelect = document.getElementById("industry");
  const customIndustryInput = document.getElementById("customIndustry");

  if (industrySelect.value === "Others") {
    customIndustryInput.style.display = "block";
    customIndustryInput.required = true;
  } else {
    customIndustryInput.style.display = "none";
    customIndustryInput.required = false;
    customIndustryInput.value = ""; 
  }
}

function updateReviewSummary() {
  const summary = document.getElementById('reviewSummary');
  const getVal = (id) => document.getElementById(id).value;
  
  // existingAlternatives is radio
  const alternatives = document.querySelector('input[name="existingAlternatives"]:checked')?.value || "No";

  summary.innerHTML = `
      <div class="review-item"><div class="review-label">Idea Name</div><div class="review-value">${getVal('ideaName')}</div></div>
      <div class="review-item"><div class="review-label">Industry</div><div class="review-value">${getVal('industry') === 'Others' ? getVal('customIndustry') : getVal('industry')}</div></div>
      <div class="review-item"><div class="review-label">Target Audience</div><div class="review-value">${getVal('targetAudience')}</div></div>
      <div class="review-item"><div class="review-label">Problem Severity</div><div class="review-value">${getVal('problemSeverity')}</div></div>
      <div class="review-item"><div class="review-label">Alternatives</div><div class="review-value">${alternatives}</div></div>
      <div class="review-item"><div class="review-label">Budget</div><div class="review-value">${getVal('estimatedBudget') || 'Not specified'}</div></div>
  `;
}

// --- FORM SUBMISSION ---
async function handleFormSubmit(e) {
  e.preventDefault();

  const industrySelect = document.getElementById("industry").value;
  const customIndustry = document.getElementById("customIndustry").value;
  const existingAlternatives = document.querySelector('input[name="existingAlternatives"]:checked')?.value;
  const problemSeverity = document.getElementById("problemSeverity").value;

  const formData = {
    ideaName: document.getElementById("ideaName").value,
    ideaDescription: document.getElementById("ideaDescription").value,
    industry: industrySelect === "Others" ? customIndustry : industrySelect,
    targetMarket: document.getElementById("targetMarket").value,
    targetAudience: document.getElementById("targetAudience").value,
    problemSolved: document.getElementById("problemSolved").value,
    uniqueValue: document.getElementById("uniqueValue").value,
    estimatedBudget: document.getElementById("estimatedBudget").value,
    timeframe: document.getElementById("timeframe").value,
    competitors: document.getElementById("competitors").value,
    // New fields
    problemSeverity,
    existingAlternatives
  };

  // Show loading state
  document.getElementById("validatorForm").style.display = "none";
  document.querySelector(".wizard-progress").style.display = "none";
  document.querySelector(".wizard-labels").style.display = "none";
  document.getElementById("loadingState").style.display = "block";
  document.getElementById("resultsContainer").style.display = "none";

  try {
    const results = await validateIdea(formData);
    
    // Hide loading, show results
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("resultsContainer").style.display = "block";

    displayResults(results, formData);
    
    document.getElementById("resultsContainer").scrollIntoView({ behavior: "smooth" });

  } catch (error) {
    console.error("Validation error:", error);
    alert(`An error occurred: ${error.message}`);
    resetForm();
  }
}

async function validateIdea(formData) {
  const response = await fetch(`${API_BASE_URL}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "API request failed");
  }
  return await response.json();
}

// --- RESULTS DISPLAY ---
function displayResults(results, formData) {
  // 1. Overall Score & Verdict
  const overallScore = results.overallScore;
  document.getElementById("overallScore").textContent = overallScore;
  
  const verdictBadge = document.getElementById("verdictBadge");
  const verdictDesc = document.getElementById("scoreDescription");
  
  if (overallScore >= 80) {
      verdictBadge.textContent = "High Potential";
      verdictBadge.style.color = "#047857";
      verdictBadge.style.backgroundColor = "#D1FAE5";
      verdictDesc.textContent = "This idea demonstrates strong market viability and low risk.";
  } else if (overallScore >= 60) {
      verdictBadge.textContent = "Feasible";
      verdictBadge.style.color = "#1D4ED8";
      verdictBadge.style.backgroundColor = "#DBEAFE";
      verdictDesc.textContent = "The idea is viable but requires refinement in specific areas.";
  } else {
      verdictBadge.textContent = "High Risk";
      verdictBadge.style.color = "#B91C1C";
      verdictBadge.style.backgroundColor = "#FEE2E2";
      verdictDesc.textContent = "Significant pivot or validation required before proceeding.";
  }

  // 2. Chart.js Implementation
  const ctx = document.getElementById('radarChart').getContext('2d');
  
  if (chartInstance) {
      chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
          labels: ['Market Demand', 'Uniqueness', 'Feasibility', 'Revenue Potential', 'Risk Mitigation'],
          datasets: [{
              label: 'Idea Score',
              data: [
                  results.metrics.marketPotential.score,
                  results.metrics.uniqueness.score,
                  results.metrics.feasibility.score,
                  results.metrics.revenuePotential.score,
                  overallScore // Using overall as a proxy for risk mitigation for now, or derive it
              ],
              fill: true,
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              borderColor: 'rgb(37, 99, 235)',
              pointBackgroundColor: 'rgb(37, 99, 235)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgb(37, 99, 235)'
          }]
      },
      options: {
          elements: {
              line: { borderWidth: 3 }
          },
          scales: {
              r: {
                  angleLines: { display: false },
                  suggestedMin: 0,
                  suggestedMax: 100
              }
          }
      }
  });

  // 3. AI Recommendations & Lists
  const createList = (id, items, icon) => {
      const list = document.getElementById(id);
      list.innerHTML = "";
      items.slice(0, 4).forEach(item => { // Limit to 4 items
          const li = document.createElement("li");
          li.innerHTML = item; // Allow HTML if needed
          list.appendChild(li);
      });
  };

  createList("strengthsList", results.insights.slice(0, 3) || ["Strong concept alignment"], "check");
  createList("challenges", results.challenges || ["Competition analysis recommended"], "exclamation-triangle");
  createList("recommendations", results.recommendations || ["Conduct user interviews"], "arrow-right");

  // 4. ML Predictions (Append to strengths or logic)
  // ... (ML logic can stay or be simplified)

  // System Save Logic (Keep existing)
  window.currentValidation = {
    ...formData,
    ...results,
    timestamp: new Date().toISOString(),
  };

  // Auto-save removed
  
  // Go/No-Go Logic
  const goNoGo = document.getElementById('goNoGo');
  if (overallScore >= 70) {
      goNoGo.innerHTML = `<div style="margin-top:2rem; padding:1rem; background:#ECFDF5; border:1px solid #10B981; border-radius:8px; color:#065F46; text-align:center; font-weight:bold;">🚀 Recommendation: GO - Proceed to MVP</div>`;
  } else {
      goNoGo.innerHTML = `<div style="margin-top:2rem; padding:1rem; background:#FFFBEB; border:1px solid #F59E0B; border-radius:8px; color:#92400E; text-align:center; font-weight:bold;">⚠️ Recommendation: NO-GO - Refine Concept First</div>`;
  }

  // Display Analysis Method
  const method = results.method || "Standard Algorithmic Analysis";
  const methodColor = method.includes("OpenAI") ? "#10a37f" : "#2563EB";
  const methodIcon = method.includes("OpenAI") ? "fa-robot" : "fa-laptop-code";
  
  goNoGo.innerHTML += `
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e2e8f0; font-size: 0.85rem; color: #64748B; text-align: center;">
          <i class="fas ${methodIcon}" style="color: ${methodColor}; margin-right: 5px;"></i>
          Powered by: <strong style="color: ${methodColor};">${method}</strong>
      </div>
  `;
}

// autoSaveValidation removed as per user request

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${type === "success" ? "#10b981" : "#3b82f6"};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function displayMetric(metricId, metricData) {
  const score = metricData.score;
  const description = metricData.description;

  document.getElementById(`${metricId}Score`).textContent = `${score}/100`;
  document.getElementById(`${metricId}Bar`).style.width = `${score}%`;
  document.getElementById(`${metricId}Desc`).textContent = description;

  // Set color based on score
  const bar = document.getElementById(`${metricId}Bar`);
  if (score >= 80) {
    bar.style.background = "linear-gradient(90deg, #10b981, #059669)";
  } else if (score >= 60) {
    bar.style.background = "linear-gradient(90deg, #3b82f6, #2563eb)";
  } else {
    bar.style.background = "linear-gradient(90deg, #f59e0b, #d97706)";
  }
}

function resetForm() {
  document.getElementById("validatorForm").reset();
  
  // Reset Wizard Logic
  document.querySelector(".wizard-progress").style.display = "flex";
  document.querySelector(".wizard-labels").style.display = "flex";
  
  // Show Step 1
  currentStep = 1;
  showStep(1);
  
  document.getElementById("validatorForm").style.display = "block";
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("resultsContainer").style.display = "none";
  scrollToSection("validator");
}

// Save & Download Functions
async function saveValidation() {
  if (!window.currentValidation) {
    showNotification("No validation to save", "error");
    return;
  }

  // Save to localStorage for offline access
  savedValidations.push(window.currentValidation);
  localStorage.setItem("validations", JSON.stringify(savedValidations));

  showNotification("✓ Saved locally!", "info");

  loadSavedValidations();
}

function downloadReport() {
  if (!window.currentValidation) {
    alert("No validation to download");
    return;
  }

  const report = generateReportText(window.currentValidation);
  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${window.currentValidation.ideaName.replace(
    /\s+/g,
    "-"
  )}-validation-report.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateReportText(validation) {
  return `
STARTUP IDEA VALIDATION REPORT
===============================

Idea Name: ${validation.ideaName}
Industry: ${validation.industry}
Target Market: ${validation.targetMarket}
Date: ${new Date(validation.timestamp).toLocaleDateString()}

OVERALL SCORE: ${validation.overallScore}/100

DETAILED SCORES:
- Market Potential: ${validation.metrics.marketPotential.score}/100
- Uniqueness: ${validation.metrics.uniqueness.score}/100
- Feasibility: ${validation.metrics.feasibility.score}/100
- Revenue Potential: ${validation.metrics.revenuePotential.score}/100

DESCRIPTION:
${validation.ideaDescription}

PROBLEM SOLVED:
${validation.problemSolved}

TARGET AUDIENCE:
${validation.targetAudience}

KEY INSIGHTS:
${validation.insights.map((insight, i) => `${i + 1}. ${insight}`).join("\n")}

AUDIENCE ANALYSIS:
${validation.audienceAnalysis}

POTENTIAL CHALLENGES:
${validation.challenges
  .map((challenge, i) => `${i + 1}. ${challenge}`)
  .join("\n")}

RECOMMENDATIONS:
${validation.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}

---
Generated by AI Startup Idea Validator
© 2026 All rights reserved
`;
}

async function loadSavedValidations() {
  const container = document.getElementById("savedValidations");
  if (!container) return;

  // Load from localStorage first
  let localValidations = [];
  try {
    localValidations = JSON.parse(localStorage.getItem("validations")) || [];
  } catch (e) {
    console.error("Error parsing local validations:", e);
    localValidations = [];
  }

  savedValidations = localValidations;

  if (savedValidations.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-secondary);">No saved validations yet. Validate your first idea!</p>';
    updateDashboardStats();
    return;
  }

  container.innerHTML = "";
  savedValidations.reverse().forEach((validation, index) => {
    const card = createValidationCard(
      validation,
      savedValidations.length - 1 - index
    );
    container.appendChild(card);
  });

  updateDashboardStats();
}

function createValidationCard(validation, index) {
  const card = document.createElement("div");
  card.className = "validation-card";
  card.style.cssText = `
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: var(--shadow-md);
        border-left: 4px solid var(--primary-color);
        cursor: pointer;
        transition: all 0.3s;
    `;

  const scoreColor =
    validation.overallScore >= 80
      ? "#10b981"
      : validation.overallScore >= 60
      ? "#3b82f6"
      : "#f59e0b";

  card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <div>
                <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">${
                  validation.ideaName
                }</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">${
                  validation.industry
                } • ${validation.targetMarket}</p>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 2rem; font-weight: 700; color: ${scoreColor};">${
    validation.overallScore
  }</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">/ 100</div>
            </div>
        </div>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">${validation.ideaDescription.substring(
          0,
          150
        )}...</p>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
            <span style="background: rgba(99, 102, 241, 0.1); color: var(--primary-color); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">Market: ${
              validation.metrics.marketPotential.score
            }</span>
            <span style="background: rgba(139, 92, 246, 0.1); color: var(--secondary-color); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">Unique: ${
              validation.metrics.uniqueness.score
            }</span>
            <span style="background: rgba(16, 185, 129, 0.1); color: var(--success-color); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">Feasible: ${
              validation.metrics.feasibility.score
            }</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <small style="color: var(--text-secondary);">${new Date(
              validation.timestamp
            ).toLocaleDateString()}</small>
            <button onclick="deleteValidation(${index}); event.stopPropagation();" style="background: var(--danger-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Delete</button>
        </div>
    `;

  card.addEventListener("mouseenter", () => {
    card.style.transform = "translateY(-3px)";
    card.style.boxShadow = "var(--shadow-lg)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0)";
    card.style.boxShadow = "var(--shadow-md)";
  });

  return card;
}

async function deleteValidation(index) {
  if (confirm("Are you sure you want to delete this validation?")) {
    const validation = savedValidations[savedValidations.length - 1 - index];

    // Delete from server if user is logged in and validation has an ID
    if (currentUser && validation._id) {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `${API_BASE_URL}/validations/${validation._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.error("Failed to delete from server");
        }
      } catch (error) {
        console.error("Error deleting from server:", error);
      }
    }

    // Delete from local storage
    savedValidations.splice(savedValidations.length - 1 - index, 1);
    localStorage.setItem("validations", JSON.stringify(savedValidations));
    loadSavedValidations();
  }
}

function updateDashboardStats() {
  const totalIdeas = savedValidations.length;
  const avgScore =
    totalIdeas > 0
      ? Math.round(
          savedValidations.reduce((sum, v) => sum + v.overallScore, 0) /
            totalIdeas
        )
      : 0;
  const topScore =
    totalIdeas > 0
      ? Math.max(...savedValidations.map((v) => v.overallScore))
      : 0;

  document.getElementById("totalIdeas").textContent = totalIdeas;
  document.getElementById("avgScore").textContent = avgScore;
  document.getElementById("topScore").textContent = topScore;
}

// Modal Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    modal.style.display = "flex";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
}

function switchModal(fromModalId, toModalId) {
  closeModal(fromModalId);
  openModal(toModalId);
}

// Click outside modal to close
window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.classList.remove("active");
    e.target.style.display = "none";
  }
});

// Auth Functions
async function handleLogin(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;
  const password = e.target.querySelector('input[type="password"]').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      localStorage.setItem("token", data.token);
      closeModal("loginModal");
      updateUIForLoggedInUser();
      alert("Login successful!");
    } else {
      const errorData = await response.json();
      alert(
        "Login failed: " + (errorData.error || "Please check your credentials.")
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Please check your connection and try again.");
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = e.target.querySelector('input[type="text"]').value;
  const email = e.target.querySelector('input[type="email"]').value;
  const password = e.target.querySelector('input[type="password"]').value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      localStorage.setItem("token", data.token);
      closeModal("signupModal");
      updateUIForLoggedInUser();
      alert("Signup successful!");
    } else {
      const errorData = await response.json();
      alert("Signup failed: " + (errorData.error || "Please try again."));
    }
  } catch (error) {
    console.error("Signup error:", error);
    alert("Signup failed. Please check your connection and try again.");
  }
}

function checkUserSession() {
  const token = localStorage.getItem("token");

  if (token) {
    // Verify token with backend
    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Invalid token");
        }
      })
      .then((data) => {
        currentUser = data.user;
        updateUIForLoggedInUser();
      })
      .catch((error) => {
        console.log("Session invalid:", error);
        localStorage.removeItem("token");
      });
  }
}

function updateUIForLoggedInUser() {
  if (currentUser) {
    const authButtons = document.querySelector(".auth-buttons");
    if (authButtons) {
      authButtons.innerHTML = `
                <span style="color: var(--text-primary); margin-right: 1rem;">Welcome, ${currentUser.name}!</span>
                <button class="btn-login" onclick="logout()">Logout</button>
            `;
    }
    // Show dashboard
    document.getElementById("dashboard").style.display = "block";
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("token");
  location.reload();
}

// Utility function to show dashboard
function showDashboard() {
  document.getElementById("dashboard").style.display = "block";
  scrollToSection("dashboard");
}
