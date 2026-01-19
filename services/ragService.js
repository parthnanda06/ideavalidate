const axios = require("axios");
const natural = require("natural");
const { TfIdf } = natural;

class RAGService {
  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.tfidf = new TfIdf();
    this.initializeTfIdf();
  }

  initializeKnowledgeBase() {
    // Comprehensive startup validation knowledge base
    return [
      {
        id: 1,
        category: "market_validation",
        content:
          "Market validation requires analyzing total addressable market (TAM), serviceable addressable market (SAM), and serviceable obtainable market (SOM). A strong startup idea should have a TAM of at least $1B for venture-scale opportunities.",
        keywords: ["market", "TAM", "SAM", "SOM", "addressable", "opportunity"],
      },
      {
        id: 2,
        category: "product_market_fit",
        content:
          "Product-market fit is achieved when customers are willing to pay for your solution and actively seek it out. Key indicators include high retention rates (>40% monthly), strong word-of-mouth growth, and customers expressing disappointment if your product disappeared.",
        keywords: [
          "product",
          "market",
          "fit",
          "retention",
          "customers",
          "growth",
        ],
      },
      {
        id: 3,
        category: "competitive_advantage",
        content:
          "Sustainable competitive advantages include network effects, high switching costs, proprietary technology, exclusive partnerships, and brand strength. Technology alone is rarely a defensible moat unless patent-protected.",
        keywords: [
          "competitive",
          "advantage",
          "moat",
          "defensible",
          "network",
          "technology",
        ],
      },
      {
        id: 4,
        category: "revenue_models",
        content:
          "Proven revenue models include SaaS subscriptions (high recurring revenue), marketplace transactions (network effects), freemium (viral growth), enterprise sales (high contract values), and usage-based pricing (scales with customer success).",
        keywords: [
          "revenue",
          "pricing",
          "subscription",
          "marketplace",
          "monetization",
          "SaaS",
        ],
      },
      {
        id: 5,
        category: "scalability",
        content:
          "Scalable startups have low marginal costs per new customer, can grow without proportional increase in resources, leverage technology for automation, and have clear paths to operational efficiency at scale.",
        keywords: [
          "scalability",
          "growth",
          "automation",
          "efficiency",
          "marginal cost",
        ],
      },
      {
        id: 6,
        category: "fundraising",
        content:
          "Pre-seed funding typically ranges $100k-$500k, seed $500k-$2M, Series A $2M-$15M. Investors look for traction metrics, strong team, large market, unique insight, and clear path to product-market fit.",
        keywords: [
          "funding",
          "investment",
          "capital",
          "investors",
          "valuation",
          "fundraising",
        ],
      },
      {
        id: 7,
        category: "team_building",
        content:
          "Successful startup teams balance technical and business expertise, have complementary skill sets, demonstrate strong commitment, and possess domain expertise. Co-founder conflicts are a leading cause of startup failure.",
        keywords: [
          "team",
          "co-founder",
          "talent",
          "expertise",
          "hiring",
          "skills",
        ],
      },
      {
        id: 8,
        category: "mvp_development",
        content:
          "Minimum Viable Product should take 3-4 months to build, test core hypothesis, require minimal resources, and provide clear learning feedback. Focus on solving one specific problem exceptionally well.",
        keywords: [
          "MVP",
          "prototype",
          "development",
          "build",
          "product",
          "iteration",
        ],
      },
      {
        id: 9,
        category: "customer_acquisition",
        content:
          "Customer Acquisition Cost (CAC) should be recovered within 12 months. Lifetime Value (LTV) to CAC ratio should be 3:1 or higher. Optimize for channels with best unit economics before scaling.",
        keywords: [
          "acquisition",
          "CAC",
          "LTV",
          "marketing",
          "customers",
          "channels",
        ],
      },
      {
        id: 10,
        category: "industry_trends",
        content:
          "High-growth industries include AI/ML, healthcare tech, fintech, climate tech, Web3, and SaaS. B2B SaaS typically has better unit economics than B2C. Enterprise deals have longer cycles but higher values.",
        keywords: [
          "industry",
          "trends",
          "technology",
          "AI",
          "SaaS",
          "B2B",
          "B2C",
        ],
      },
      {
        id: 11,
        category: "risk_assessment",
        content:
          "Major startup risks include market risk (no demand), execution risk (cant build), timing risk (too early/late), competition risk, regulatory risk, and team risk. Mitigate risks through validation experiments.",
        keywords: ["risk", "challenges", "threats", "mitigation", "validation"],
      },
      {
        id: 12,
        category: "go_to_market",
        content:
          "Effective go-to-market strategies include product-led growth, sales-led growth, community-led growth, and partner-led growth. Choose based on product complexity, price point, and target customer.",
        keywords: [
          "go-to-market",
          "GTM",
          "strategy",
          "launch",
          "distribution",
          "sales",
        ],
      },
      {
        id: 13,
        category: "technology_industry",
        content: "In the technology sector, rapid iteration and user feedback are critical. Technical debt should be managed carefully while scaling.",
        keywords: ["technology", "tech", "software", "scaling", "debt"],
      },
      {
        id: 14,
        category: "healthcare_industry",
        content: "Healthcare startups must navigate complex regulatory environments (HIPAA, FDA). Trust and data privacy are paramount for user adoption.",
        keywords: ["healthcare", "medical", "regulation", "privacy", "trust"],
      },
      {
        id: 15,
        category: "fintech_industry",
        content: "Fintech solutions require bank-grade security and compliance with financial regulations. Trust is the primary currency.",
        keywords: ["finance", "fintech", "security", "compliance", "money"],
      },
       {
        id: 16,
        category: "b2b_market",
        content: "B2B sales often involve multiple stakeholders and longer sales cycles. ROI demonstration is crucial for closing deals.",
        keywords: ["b2b", "sales", "enterprise", "stakeholders", "roi"],
      },
       {
        id: 17,
        category: "b2c_market",
        content: "B2C success relies heavily on brand building, user experience, and viral loops. Customer acquisition costs can skyrocket without organic growth.",
        keywords: ["b2c", "consumer", "brand", "viral", "ux"],
      }
    ];
  }

  initializeTfIdf() {
    // Add all knowledge base documents to TF-IDF
    this.knowledgeBase.forEach((doc) => {
      this.tfidf.addDocument(doc.content);
    });
  }

  retrieveRelevantKnowledge(query, topK = 5) {
    const scores = [];

    // Calculate TF-IDF scores for query against all documents
    this.tfidf.tfidfs(query, (i, measure) => {
      if (this.knowledgeBase[i]) {
        scores.push({
          document: this.knowledgeBase[i],
          score: measure,
        });
      }
    });

    // Sort by relevance score and return top K
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((item) => item.score > 0);
  }

  async generateAugmentedResponse(ideaData) {
    // Create comprehensive query from idea data
    const query = `${ideaData.ideaDescription} ${ideaData.problemSolved} ${
      ideaData.industry
    } ${ideaData.targetMarket} ${ideaData.uniqueValue || ""}`;

    // Retrieve relevant knowledge
    const relevantKnowledge = this.retrieveRelevantKnowledge(query, 5);

    // Build context from retrieved knowledge
    const context = relevantKnowledge
      .map((item) => item.document.content)
      .join("\n\n");

    return {
      context,
      relevantCategories: relevantKnowledge.map(
        (item) => item.document.category
      ),
      knowledgeUsed: relevantKnowledge.length,
    };
  }

  async enhanceValidationWithRAG(ideaData, baseAnalysis) {
    try {
      const ragData = await this.generateAugmentedResponse(ideaData);

      // Enhance recommendations based on retrieved knowledge
      const enhancedRecommendations = this.generateEnhancedRecommendations(
        ideaData,
        baseAnalysis,
        ragData
      );

      // Enhance insights with knowledge base
      const enhancedInsights = this.generateEnhancedInsights(ideaData, ragData);

      return {
        ...baseAnalysis,
        recommendations: enhancedRecommendations,
        insights: enhancedInsights,
        knowledgeSourcesUsed: ragData.relevantCategories,
        confidenceScore: this.calculateConfidenceScore(ragData),
      };
    } catch (error) {
      console.error("Error in RAG enhancement:", error);
      // Return base analysis if RAG fails
      return baseAnalysis;
    }
  }

  generateEnhancedRecommendations(ideaData, baseAnalysis, ragData) {
    const recommendations = [...baseAnalysis.recommendations];

    // Add recommendations based on relevant knowledge categories
    if (ragData.relevantCategories.includes("market_validation")) {
      recommendations.push(
        `Calculate your TAM, SAM, and SOM to validate the market size for your ${ideaData.industry} concept.`
      );
    }

    if (ragData.relevantCategories.includes("customer_acquisition")) {
      recommendations.push(
        "Establish target CAC and LTV metrics early, especially given your market focus."
      );
    }

    if (ragData.relevantCategories.includes("mvp_development")) {
      recommendations.push(
        `Focus on solving the core problem: "${ideaData.problemSolved.substring(0, 50)}..." in your initial MVP.`
      );
    }

    if (ideaData.targetMarket === "b2b") {
      recommendations.push(
        "Leverage strategic partnerships to accelerate B2B market entry and build credibility."
      );
    }

    return recommendations.slice(0, 8);
  }

  generateEnhancedInsights(ideaData, ragData) {
    const insights = [];

    ragData.relevantCategories.forEach((category) => {
      const knowledge = this.knowledgeBase.find(
        (kb) => kb.category === category
      );
      if (knowledge) {
        // Extract key insight from knowledge
        const keyInsight = this.extractKeyInsight(knowledge.content, ideaData, category);
        if (keyInsight) insights.push(keyInsight);
      }
    });

    return insights.slice(0, 6);
  }

  extractKeyInsight(content, ideaData, category) {
    // Make insight dynamic based on category and input
    const baseInsight = content.split(". ")[0];
    
    if (category.includes("industry")) {
        return `As a ${ideaData.industry} startup, ${baseInsight.toLowerCase()}.`;
    }
    
    if (category.includes("market")) {
        return `For your ${ideaData.targetMarket} strategy: ${baseInsight}.`;
    }

    return baseInsight + ".";
  }

  calculateConfidenceScore(ragData) {
    // Higher confidence when more relevant knowledge is found
    const baseConfidence = 0.7;
    const knowledgeBonus = Math.min(0.25, ragData.knowledgeUsed * 0.05);
    return Math.min(0.95, baseConfidence + knowledgeBonus);
  }
}

module.exports = new RAGService();
