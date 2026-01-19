// API Configuration
const API_BASE_URL = "/api";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDwuLhzPDeEGGtJ-LbCDCd0iKL10St8qsM",
  authDomain: "finalyearproject-d9bd9.firebaseapp.com",
  projectId: "finalyearproject-d9bd9",
  storageBucket: "finalyearproject-d9bd9.firebasestorage.app",
  messagingSenderId: "326440517004",
  appId: "1:326440517004:web:f81b3bca1fc5607b5e6aa9",
  measurementId: "G-6XKSED8MVT"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
} else {
    console.error("Firebase SDK not loaded");
}

// State Management
let currentUser = null;
let savedValidations = [];
try {
  savedValidations = JSON.parse(localStorage.getItem("validations")) || [];
} catch (e) {
  console.error("Error parsing saved validations:", e);
  savedValidations = [];
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupFirebaseAuth();
});

function initializeApp() {
  setupEventListeners();
  loadSavedValidations();
  // checkUserSession(); // Replaced by Firebase Auth Observer
  setupSmoothScroll();
  setupNavigation();
}

function setupFirebaseAuth() {
    if (typeof firebase === 'undefined') return;

    const auth = firebase.auth();
    const provider = new firebase.auth.GoogleAuthProvider();

    // Sign In Button
    document.getElementById("google-signin-btn")?.addEventListener("click", () => {
        auth.signInWithPopup(provider)
            .catch((error) => {
                console.error("Google Sign-In Error:", error);
                alert("Sign-in failed: " + error.message);
            });
    });

    // Sign Out Button
    document.getElementById("signout-btn")?.addEventListener("click", () => {
        auth.signOut();
    });

    // Auth State Observer
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        updateAuthUI(user);
        if (user) {
            // Sync validations from server (Firestore)
            loadSavedValidations();
        } else {
            // Clear or reset view
            savedValidations = JSON.parse(localStorage.getItem("validations")) || [];
            updateDashboardStats();
        }
    });
}

function updateAuthUI(user) {
    const signInBtn = document.getElementById("google-signin-btn");
    const userInfo = document.getElementById("user-info");
    const userPhoto = document.getElementById("user-photo");

    if (user) {
        signInBtn.style.display = "none";
        userInfo.style.display = "flex";
        userPhoto.src = user.photoURL || "https://via.placeholder.com/32";
    } else {
        signInBtn.style.display = "flex";
        userInfo.style.display = "none";
    }
}

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
async function handleFormSubmit(e) {
  e.preventDefault();

  const formData = {
    ideaName: document.getElementById("ideaName").value,
    ideaDescription: document.getElementById("ideaDescription").value,
    industry: document.getElementById("industry").value,
    targetMarket: document.getElementById("targetMarket").value,
    targetAudience: document.getElementById("targetAudience").value,
    problemSolved: document.getElementById("problemSolved").value,
    uniqueValue: document.getElementById("uniqueValue").value,
    estimatedBudget: document.getElementById("estimatedBudget").value,
    timeframe: document.getElementById("timeframe").value,
    competitors: document.getElementById("competitors").value,
  };

  // Show loading state
  document.getElementById("validatorForm").style.display = "none";
  document.getElementById("loadingState").style.display = "block";
  document.getElementById("resultsContainer").style.display = "none";

  try {
    // Call API
    const results = await validateIdea(formData);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Hide loading, show results
    document.getElementById("loadingState").style.display = "none";
    document.getElementById("resultsContainer").style.display = "block";

    // Display results
    displayResults(results, formData);

    // Scroll to results
    document
      .getElementById("resultsContainer")
      .scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Validation error:", error);
    alert(`An error occurred while validating your idea: ${error.message}. Please try again.`);
    resetForm();
  }
}

async function validateIdea(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    return await response.json();
  } catch (error) {
    console.log("Using mock data due to API error:", error);
    // Return mock data if API is not available
    return generateMockValidation(formData);
  }
}

function generateMockValidation(formData) {
  // Generate realistic mock data based on input
  const baseScore = 60 + Math.random() * 30;

  const marketScore = Math.floor(baseScore + (Math.random() - 0.5) * 20);
  const uniquenessScore = Math.floor(baseScore + (Math.random() - 0.5) * 25);
  const feasibilityScore = Math.floor(baseScore + (Math.random() - 0.5) * 15);
  const revenueScore = Math.floor(baseScore + (Math.random() - 0.5) * 20);

  const overallScore = Math.floor(
    (marketScore + uniquenessScore + feasibilityScore + revenueScore) / 4
  );

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    metrics: {
      marketPotential: {
        score: Math.min(100, Math.max(0, marketScore)),
        description: `The ${formData.industry} industry shows strong growth potential with significant market opportunities.`,
      },
      uniqueness: {
        score: Math.min(100, Math.max(0, uniquenessScore)),
        description: `Your unique value proposition offers differentiation in the ${formData.targetMarket} market.`,
      },
      feasibility: {
        score: Math.min(100, Math.max(0, feasibilityScore)),
        description: `Based on the estimated budget and timeframe, this project appears feasible with proper planning.`,
      },
      revenuePotential: {
        score: Math.min(100, Math.max(0, revenueScore)),
        description: `Revenue projections are promising for the ${formData.targetMarket} segment.`,
      },
    },
    insights: [
      `Strong alignment with current ${formData.industry} industry trends`,
      `Clear value proposition for ${formData.targetAudience}`,
      `Addressable market size appears substantial`,
      `Technology requirements are within reasonable bounds`,
      `Customer acquisition channels are identifiable`,
    ],
    audienceAnalysis: `Your target audience of ${formData.targetAudience} represents a viable market segment. The ${formData.targetMarket} approach is well-suited for this demographic, with clear pain points that your solution addresses.`,
    challenges: [
      `Competition in the ${formData.industry} space is significant`,
      `Customer acquisition costs may be high initially`,
      `Technical implementation complexity should be carefully managed`,
      `Regulatory compliance requirements need thorough investigation`,
      `Scaling strategy will require careful planning`,
    ],
    recommendations: [
      `Conduct detailed competitor analysis in the ${formData.industry} sector`,
      `Develop a minimum viable product (MVP) to test market fit`,
      `Build strategic partnerships to accelerate growth`,
      `Focus on a specific niche within ${formData.targetAudience} initially`,
      `Establish clear metrics for success and iterate based on feedback`,
      `Consider multiple revenue streams to diversify income`,
    ],
  };
}

function displayResults(results, formData) {
  // Overall Score
  const overallScore = results.overallScore;
  document.getElementById("overallScore").textContent = overallScore;

  // Set score circle color
  const scoreCircle = document.getElementById("overallScoreCircle");
  scoreCircle.style.setProperty("--score-angle", `${overallScore * 3.6}deg`);

  // Score description
  let scoreTitle = "Good Potential";
  let scoreDesc = "Your idea shows promise with some areas for improvement.";

  if (overallScore >= 80) {
    scoreTitle = "Excellent Potential!";
    scoreDesc = "Your startup idea has strong viability across all metrics.";
  } else if (overallScore >= 60) {
    scoreTitle = "Good Potential";
    scoreDesc = "Your idea shows promise with some areas for improvement.";
  } else {
    scoreTitle = "Needs Refinement";
    scoreDesc =
      "Consider refining your approach based on the recommendations below.";
  }

  document.getElementById("scoreTitle").textContent = scoreTitle;
  document.getElementById("scoreDescription").textContent = scoreDesc;

  // Metrics
  displayMetric("marketPotential", results.metrics.marketPotential);
  displayMetric("uniqueness", results.metrics.uniqueness);
  displayMetric("feasibility", results.metrics.feasibility);
  displayMetric("revenue", results.metrics.revenuePotential);

  // Key Insights
  const insightsList = document.getElementById("keyInsights");
  insightsList.innerHTML = "";
  results.insights.forEach((insight) => {
    const li = document.createElement("li");
    li.textContent = insight;
    insightsList.appendChild(li);
  });

  // Audience Analysis
  document.getElementById("audienceAnalysis").textContent =
    results.audienceAnalysis;

  // Challenges
  const challengesList = document.getElementById("challenges");
  challengesList.innerHTML = "";
  results.challenges.forEach((challenge) => {
    const li = document.createElement("li");
    li.textContent = challenge;
    challengesList.appendChild(li);
  });

  // Recommendations
  const recommendationsList = document.getElementById("recommendations");
  recommendationsList.innerHTML = "";
  results.recommendations.forEach((recommendation) => {
    const li = document.createElement("li");
    li.textContent = recommendation;
    recommendationsList.appendChild(li);
  });

  // ML Predictions (if available)
  if (results.mlPredictions) {
    const section = document.getElementById("mlPredictionsSection");
    const container = document.getElementById("mlPredictions");
    
    if (section && container) {
      section.style.display = "block";
      container.innerHTML = `
            <p><strong>Success Probability:</strong> ${
              results.mlPredictions.successProbability
            }%</p>
            <p><strong>Sentiment:</strong> ${
              results.mlPredictions.sentimentAnalysis.sentiment
            } (${Math.round(
        results.mlPredictions.sentimentAnalysis.score
      )}% positivity)</p>
            <p><strong>Description Quality:</strong> ${
              results.mlPredictions.textComplexity.complexityScore
            }/100</p>
            ${
              results.mlPredictions.keyPhrases &&
              results.mlPredictions.keyPhrases.length > 0
                ? `<p><strong>Key Themes:</strong> ${results.mlPredictions.keyPhrases
                    .map((p) => p.term)
                    .join(", ")}</p>`
                : ""
            }
        `;
    }
  }

  // AI Technologies Used (if available)
  if (results.technologyUsed) {
    const section = document.getElementById("aiTechSection");
    const container = document.getElementById("aiTechnologies");

    if (section && container) {
      section.style.display = "block";
      container.innerHTML = `
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${results.technologyUsed
                  .map(
                    (tech) =>
                      `<span style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); 
                            color: white; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem;">
                        <i class="fas fa-check-circle"></i> ${tech}
                    </span>`
                  )
                  .join("")}
            </div>
            ${
              results.confidenceScore
                ? `<p style="margin-top: 1rem;"><strong>Analysis Confidence:</strong> ${Math.round(
                    results.confidenceScore * 100
                  )}%</p>`
                : ""
            }
        `;
    }
  }

  // Store current validation
  window.currentValidation = {
    ...formData,
    ...results,
    timestamp: new Date().toISOString(),
  };

  // Auto-save if user is logged in
  if (currentUser) {
    autoSaveValidation();
  }
}

async function autoSaveValidation() {
  if (!window.currentValidation || !currentUser) return;

  try {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/validations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(window.currentValidation),
    });

    if (response.ok) {
      // Show subtle success message
      showNotification("✓ Validation saved to your account", "success");
      // Reload dashboard data
      loadSavedValidations();
    }
  } catch (error) {
    console.error("Auto-save error:", error);
  }
}

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

  // If user is logged in, save to database
  if (currentUser) {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/validations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(window.currentValidation),
      });

      if (response.ok) {
        showNotification("✓ Validation saved to your account!", "success");
      } else {
        showNotification("Saved locally, server sync failed", "info");
      }
    } catch (error) {
      console.error("Error saving to server:", error);
      showNotification("Saved locally, server sync failed", "info");
    }
  } else {
    showNotification("✓ Saved locally! Login to sync to your account.", "info");
  }

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

  // If user is logged in, fetch from server and merge
  if (currentUser) {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/validations`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Merge server validations with local ones
        const serverValidations = data.validations.map((v) => ({
          ideaName: v.ideaName,
          ideaDescription: v.ideaDescription,
          industry: v.industry,
          targetMarket: v.targetMarket,
          targetAudience: v.targetAudience,
          problemSolved: v.problemSolved,
          uniqueValue: v.uniqueValue,
          estimatedBudget: v.estimatedBudget,
          timeframe: v.timeframe,
          competitors: v.competitors,
          overallScore: v.overallScore,
          metrics: v.metrics,
          insights: v.insights,
          audienceAnalysis: v.audienceAnalysis,
          challenges: v.challenges,
          recommendations: v.recommendations,
          timestamp: v.createdAt || v.timestamp,
          _id: v._id,
        }));

        // Use server validations as the source of truth
        savedValidations = serverValidations;
      }
    } catch (error) {
      console.error("Error loading validations from server:", error);
      savedValidations = localValidations;
    }
  } else {
    savedValidations = localValidations;
  }

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
