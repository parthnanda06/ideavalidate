const axios = require("axios");
const ragService = require("../services/ragService");
const mlService = require("../services/mlService");

// AI-based validation logic with RAG and ML
async function validateIdea(req, res) {
  try {
    const {
      ideaName,
      ideaDescription,
      industry,
      targetMarket,
      targetAudience,
      problemSolved,
      uniqueValue,
      estimatedBudget,
      timeframe,
      competitors,
    } = req.body;

    // Validate required fields
    if (
      !ideaName ||
      !ideaDescription ||
      !industry ||
      !targetMarket ||
      !targetAudience ||
      !problemSolved
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "ideaName",
          "ideaDescription",
          "industry",
          "targetMarket",
          "targetAudience",
          "problemSolved",
        ],
      });
    }

    // Generate validation analysis
    const analysis = await analyzeStartupIdea({
      ideaName,
      ideaDescription,
      industry,
      targetMarket,
      targetAudience,
      problemSolved,
      uniqueValue,
      estimatedBudget,
      timeframe,
      competitors,
    });

    // Save to Firestore (if DB is configured)
    const { db } = require("../config/firebase");
    try {
        if (db && db.collection) {
            await db.collection("validations").add({
                ...req.body,
                analysis,
                createdAt: new Date().toISOString(),
                userId: req.body.userId || "anonymous" // Link to user if logged in
            });
        }
    } catch (dbError) {
        console.warn("⚠️ Failed to save to Firestore:", dbError.message);
        // Continue - don't fail the request just because save failed
    }

    res.json(analysis);
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({
      error: "Failed to validate idea",
      message: error.message,
    });
  }
}

async function analyzeStartupIdea(data) {
  // Try to use OpenAI API if available
  if (process.env.OPENAI_API_KEY && process.env.USE_OPENAI === "true") {
    try {
      return await analyzeWithOpenAI(data);
    } catch (error) {
      console.log(
        "OpenAI API error, falling back to algorithmic analysis:",
        error.message
      );
    }
  }

  // Fallback to enhanced algorithmic analysis with RAG and ML
  return performEnhancedAnalysis(data);
}

async function analyzeWithOpenAI(data) {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const prompt = `Analyze this startup idea and provide a detailed validation report:

Idea Name: ${data.ideaName}
Description: ${data.ideaDescription}
Industry: ${data.industry}
Target Market: ${data.targetMarket}
Target Audience: ${data.targetAudience}
Problem Solved: ${data.problemSolved}
Unique Value: ${data.uniqueValue || "Not specified"}
Budget: ${data.estimatedBudget || "Not specified"}
Timeframe: ${data.timeframe || "Not specified"}
Competitors: ${data.competitors || "Not specified"}

Please provide:
1. Overall viability score (0-100)
2. Individual scores for: Market Potential, Uniqueness, Feasibility, Revenue Potential (each 0-100)
3. 5 key insights
4. Target audience analysis
5. 5 potential challenges
6. 6 actionable recommendations

Format as JSON with the following structure:
{
  "overallScore": number,
  "metrics": {
    "marketPotential": {"score": number, "description": string},
    "uniqueness": {"score": number, "description": string},
    "feasibility": {"score": number, "description": string},
    "revenuePotential": {"score": number, "description": string}
  },
  "insights": [strings],
  "audienceAnalysis": string,
  "challenges": [strings],
  "recommendations": [strings]
}`;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert startup advisor and business analyst. Provide detailed, actionable insights for startup idea validation.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    },
    {
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const aiResponse = response.data.choices[0].message.content;
  return JSON.parse(aiResponse);
}

async function performEnhancedAnalysis(data) {
  try {
    // Get base algorithmic analysis
    const baseAnalysis = performAlgorithmicAnalysis(data);

    // Enhance with RAG (Retrieval-Augmented Generation)
    const ragEnhanced = await ragService.enhanceValidationWithRAG(
      data,
      baseAnalysis
    );

    // Get ML predictions and insights
    const successProbability = mlService.predictSuccessProbability(
      baseAnalysis.metrics
    );
    const mlInsights = mlService.generateMLInsights(data, baseAnalysis.metrics);
    const sentiment = mlService.analyzeSentiment(data.ideaDescription);
    const complexity = mlService.analyzeTextComplexity(data.ideaDescription);
    const keyPhrases = mlService.detectKeyPhrases(data.ideaDescription);

    // Combine all insights
    const combinedInsights = [
      ...ragEnhanced.insights,
      ...mlInsights,
      ...baseAnalysis.insights,
    ].slice(0, 8);

    return {
      ...ragEnhanced,
      overallScore: Math.round(
        (ragEnhanced.overallScore + successProbability) / 2
      ),
      mlPredictions: {
        successProbability,
        sentimentAnalysis: sentiment,
        textComplexity: complexity,
        keyPhrases: keyPhrases.slice(0, 5),
      },
      insights: combinedInsights,
      aiEnhanced: true,
      technologyUsed: [
        "RAG",
        "Neural Network",
        "NLP",
        "TF-IDF",
        "Sentiment Analysis",
      ],
    };
  } catch (error) {
    console.error("Error in performEnhancedAnalysis:", error);
    // Fallback to basic analysis
    return performAlgorithmicAnalysis(data);
  }
}

function performAlgorithmicAnalysis(data) {
  // Scoring factors - REDUCED BASELINES for more realistic scoring
  const industryScores = {
    technology: 75,
    healthcare: 70,
    finance: 65,
    education: 60,
    ecommerce: 65,
    saas: 78,
    marketplace: 60,
    other: 50,
  };

  const marketScores = {
    b2b: 65,
    b2c: 55, // Harder to succeed in B2C
    b2b2c: 70,
  };

  const budgetScores = {
    "0-10k": 40, // Very hard with low budget
    "10k-50k": 60,
    "50k-100k": 75,
    "100k-500k": 85,
    "500k+": 90,
    "": 50,
  };

  const timeframeScores = {
    "1-3months": 60, // Rushed
    "3-6months": 80, // Good pace
    "6-12months": 75,
    "12months+": 60, // Too slow?
    "": 60,
  };

  // Calculate individual scores
  const baseIndustryScore = industryScores[data.industry] || 50;
  const baseMarketScore = marketScores[data.targetMarket] || 60;
  const baseBudgetScore = budgetScores[data.estimatedBudget] || 50;
  const baseTimeScore = timeframeScores[data.timeframe] || 60;

  // Analyze description quality - STRICTER PENALTY
  const descriptionLength = data.ideaDescription.length;
  // Needs at least 150 chars for distinct score, otherwise heavily penalized
  const descriptionQuality = Math.min(100, (descriptionLength / 500) * 100);
  
  // Has unique value proposition
  const hasUniqueValue = data.uniqueValue && data.uniqueValue.length > 50;
  const uniquenessBonus = hasUniqueValue ? 20 : 0;

  // Has competitor research
  const hasCompetitors = data.competitors && data.competitors.length > 0;
  const competitorBonus = hasCompetitors ? 15 : 0;

  // Calculate scores with some randomization for realism
  const randomVariance = () => Math.floor(Math.random() * 15) - 7;

  const marketPotentialScore = Math.min(
    100,
    Math.max(0, baseIndustryScore * 0.7 + descriptionQuality * 0.3 + randomVariance())
  );

  const uniquenessScore = Math.min(
    100,
    Math.max(
      0,
      baseMarketScore * 0.5 +
        uniquenessBonus +
        descriptionQuality * 0.2 +
        randomVariance()
    )
  );

  const feasibilityScore = Math.min(
    100,
    Math.max(
      0,
      (baseBudgetScore + baseTimeScore) / 2 * 0.8 + competitorBonus * 0.5 + randomVariance()
    )
  );

  const revenueScore = Math.min(
    100,
    Math.max(
      0,
      (baseMarketScore + baseIndustryScore) / 2 * 0.8 +
        descriptionQuality * 0.2 +
        randomVariance()
    )
  );

  const overallScore = Math.floor(
    (marketPotentialScore + uniquenessScore + feasibilityScore + revenueScore) /
      4
  );

  // Generate insights
  const insights = generateInsights(data, {
    marketPotentialScore,
    uniquenessScore,
    feasibilityScore,
    revenueScore,
  });

  // Generate audience analysis
  const audienceAnalysis = generateAudienceAnalysis(data);

  // Generate challenges
  const challenges = generateChallenges(data);

  // Generate recommendations
  const recommendations = generateRecommendations(data, {
    marketPotentialScore,
    uniquenessScore,
    feasibilityScore,
    revenueScore,
  });

  return {
    overallScore: Math.floor(overallScore),
    metrics: {
      marketPotential: {
        score: Math.floor(marketPotentialScore),
        description: `The ${data.industry} industry shows ${
          marketPotentialScore > 75 ? "strong" : "moderate"
        } growth potential with ${
          marketPotentialScore > 80 ? "significant" : "notable"
        } market opportunities.`,
      },
      uniqueness: {
        score: Math.floor(uniquenessScore),
        description: `Your ${
          hasUniqueValue
            ? "unique value proposition offers strong"
            : "idea shows potential for"
        } differentiation in the ${data.targetMarket} market.`,
      },
      feasibility: {
        score: Math.floor(feasibilityScore),
        description: `Based on the ${
          data.estimatedBudget ? "estimated budget and" : ""
        } ${data.timeframe || "planned"} timeframe, this project appears ${
          feasibilityScore > 75 ? "highly" : "reasonably"
        } feasible with proper planning.`,
      },
      revenuePotential: {
        score: Math.floor(revenueScore),
        description: `Revenue projections are ${
          revenueScore > 75 ? "promising" : "viable"
        } for the ${data.targetMarket} segment in the ${
          data.industry
        } industry.`,
      },
    },
    insights,
    audienceAnalysis,
    challenges,
    recommendations,
    solution: generateSolution(data, overallScore),
  };
}

function generateInsights(data, scores) {
  const insights = [];

  if (scores.marketPotentialScore > 75) {
    insights.push(
      `Strong alignment with current ${data.industry} industry trends and market demands`
    );
  } else {
    insights.push(
      `Opportunity to capture niche segments in the ${data.industry} industry`
    );
  }

  insights.push(
    `Clear value proposition for ${data.targetAudience} demographic`
  );

  if (data.competitors && data.competitors.length > 0) {
    insights.push(
      `Competitive landscape identified - strategic positioning will be crucial`
    );
  } else {
    insights.push(
      `Further competitor research recommended to identify market gaps`
    );
  }

  if (scores.feasibilityScore > 75) {
    insights.push(
      `Resource allocation and timeline appear well-structured for execution`
    );
  } else {
    insights.push(
      `Consider additional resources or extended timeline for optimal execution`
    );
  }

  insights.push(
    `${data.targetMarket.toUpperCase()} approach provides ${
      data.targetMarket === "b2b2c" ? "diverse" : "focused"
    } revenue streams`
  );

  return insights.slice(0, 5);
}

function generateAudienceAnalysis(data) {
  return `Your target audience of ${data.targetAudience} represents a ${
    data.targetMarket === "b2b" ? "business-focused" : "consumer-oriented"
  } market segment with specific needs. The ${data.targetMarket.toUpperCase()} approach is well-suited for this demographic, addressing the core problem: "${
    data.problemSolved
  }". ${
    data.uniqueValue
      ? `Your unique positioning - ${data.uniqueValue.substring(0, 100)}${
          data.uniqueValue.length > 100 ? "..." : ""
        } - provides clear differentiation.`
      : "Consider developing a more distinct unique value proposition to stand out in the market."
  }`;
}

function generateChallenges(data) {
  const challenges = [];

  challenges.push(
    `Competition in the ${data.industry} space requires continuous innovation and differentiation`
  );

  if (data.targetMarket === "b2c") {
    challenges.push(
      `Customer acquisition costs in B2C markets can be high - plan for robust marketing budget`
    );
  } else {
    challenges.push(
      `B2B sales cycles are typically longer - ensure sufficient runway for customer acquisition`
    );
  }

  challenges.push(
    `Technical implementation complexity should be carefully managed with phased approach`
  );

  if (!data.competitors || data.competitors.length === 0) {
    challenges.push(
      `Limited competitor analysis may lead to unforeseen market challenges`
    );
  } else {
    challenges.push(
      `Existing competitors require strategic positioning and unique value delivery`
    );
  }

  challenges.push(
    `Regulatory compliance and industry-specific requirements need thorough investigation`
  );

  return challenges.slice(0, 5);
}

function generateRecommendations(data, scores) {
  const recommendations = [];

  recommendations.push(
    `Conduct detailed competitor analysis in the ${data.industry} sector to identify strategic positioning opportunities`
  );
  recommendations.push(
    `Develop a minimum viable product (MVP) focusing on core features that solve "${data.problemSolved}"`
  );

  if (data.targetMarket === "b2b") {
    recommendations.push(
      `Build strategic partnerships with established businesses to accelerate market entry`
    );
  } else {
    recommendations.push(
      `Leverage social media and digital marketing to reach ${data.targetAudience} cost-effectively`
    );
  }

  recommendations.push(
    `Focus on a specific niche within ${data.targetAudience} initially to establish market presence`
  );

  if (scores.uniquenessScore < 70) {
    recommendations.push(
      `Strengthen your unique value proposition to clearly differentiate from existing solutions`
    );
  } else {
    recommendations.push(
      `Capitalize on your unique value proposition through targeted marketing campaigns`
    );
  }

  recommendations.push(
    `Establish clear KPIs and metrics for success, and iterate based on user feedback`
  );

  if (!data.estimatedBudget || data.estimatedBudget === "") {
    recommendations.push(
      `Develop detailed budget projections including customer acquisition, development, and operational costs`
    );
  }

  return recommendations.slice(0, 6);
}

function generateSolution(data, overallScore) {
  const { ideaName, problemSolved, targetAudience, industry, uniqueValue } =
    data;

  let solution = `**Solution Overview for ${ideaName}**\n\n`;

  // Core Solution Description - improved narrative
  solution += `**Core Problem & Solution:**\n`;
  solution += `You have identified a clear problem: "${problemSolved}". `;
  solution += `Your solution, ${ideaName}, addresses this by serving ${targetAudience} within the ${industry} space. `;

  if (uniqueValue && uniqueValue.length > 15) {
    solution += `Crucially, your unique approach of ${uniqueValue.toLowerCase()} positions you to capture market share.\n\n`;
  } else {
    solution += `To succeed, you must ensure your solution offers a distinctive advantage over existing alternatives.\n\n`;
  }

  // Implementation Strategy based on score and inputs
  solution += `**Implementation Strategy:**\n`;
  if (overallScore >= 80) {
    solution += `With a strong validation score of ${overallScore}, focus on execution:\n`;
    solution += `1. **Speed to Market:** Prioritize the feature that best solves "${problemSolved.substring(0, 30)}..." to get early traction.\n`;
    solution += `2. **User Feedback:** Establish a tight feedback loop with ${targetAudience}.\n`;
    solution += `3. **Scaling:** Prepare infrastructure for rapid growth in the ${industry} sector.\n\n`;
  } else if (overallScore >= 60) {
    solution += `This idea shows promise (${overallScore}/100) but needs structural improvements:\n`;
    solution += `1. **Validation:** Interview 20+ members of your target audience (${targetAudience}) to confirm the pain point.\n`;
    solution += `2. **MVP Scope:** Reduce the feature set to only the absolute essentials.\n`;
    solution += `3. **Differentiation:** Refine your unique value proposition to stand out.\n\n`;
  } else {
    solution += `The concept requires significant rethinking (${overallScore}/100):\n`;
    solution += `1. **Problem Verification:** Is "${problemSolved}" a "hair-on-fire" problem customers are willing to pay for?\n`;
    solution += `2. **Market Pivot:** Consider if a different target market has a more urgent need for this solution.\n`;
    solution += `3. **Competitor Deep Dive:** Analyze why existing ${industry} solutions might be insufficient.\n\n`;
  }

  // Technology & Resources
  solution += `**Technology & Resources:**\n`;

  const techStacks = {
    technology:
      "Modern tech stack (React/Next.js + Node/Python) with scalable cloud infrastructure",
    healthcare:
      "Secure, HIPAA-compliant stack with strong data encryption and audit logs",
    finance:
      "High-security financial ledger systems with real-time processing capabilities",
    education:
      "Interactive learning platforms with video streaming and progress analytics",
    ecommerce:
      "Robust e-commerce engine (Shopify/Headless) with inventory and payment integration",
    saas: "Multi-tenant cloud architecture with subscription billing management",
    marketplace:
      "Two-sided platform handling complex transactions and user reputation",
    other: "Flexible technology stack adapted to specific industry needs",
  };

  solution += `${techStacks[industry] || techStacks.other}. `;
  solution += `Key resources: access to ${industry} domain experts and a product-focused engineering team.\n\n`;

  // Go-to-Market Strategy
  solution += `**Go-to-Market Strategy:**\n`;
  
  if (data.targetMarket === "b2b") {
    solution += `Strategy for ${targetAudience} (B2B):\n`;
    solution += `- Direct sales outreach via LinkedIn and industry databases\n`;
    solution += `- Content marketing focusing on "Solving ${problemSolved.substring(0, 20)}..." whitepapers\n`;
    solution += `- Strategic partnerships with complementary ${industry} service providers\n`;
  } else if (data.targetMarket === "b2c") {
     solution += `Strategy for ${targetAudience} (B2C):\n`;
     solution += `- Social media advertising targeting ${targetAudience} demographics\n`;
     solution += `- Influencer marketing within the ${industry} niche\n`;
     solution += `- Referral programs to drive viral growth\n`;
  } else {
    solution += `Hybrid Strategy:\n`;
    solution += `- Combine B2B partnerships for credibility with B2C digital marketing for volume.\n`;
    solution += `- Build a community around the problem space.\n`;
  }

  solution += `\n**Key Success Metric:**\n`;
  solution += `Focus on "Time to Value" - how quickly does a ${targetAudience.slice(0, -1)} realize the benefit of your solution?`;

  return solution;
}


async function trainModel(req, res) {
  try {
    const trainingData = req.body;
    if (trainingData && Array.isArray(trainingData) && trainingData.length > 0) {
      mlService.train(trainingData);
      res.json({
        message: "Model trained with provided data",
        count: trainingData.length,
      });
    } else {
      mlService.loadTrainingData();
      res.json({ message: "Model re-trained from default dataset" });
    }
  } catch (error) {
    console.error("Training error:", error);
    res.status(500).json({ error: "Failed to train model", message: error.message });
  }
}

module.exports = {
  validateIdea,
  trainModel
};
