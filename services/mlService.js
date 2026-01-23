const natural = require("natural");

class MLPredictionService {
  constructor() {
    // Lightweight neural network implementation
    this.weights = this.initializeWeights();
    this.sentimentAnalyzer = new natural.SentimentAnalyzer(
      "English",
      natural.PorterStemmer,
      "afinn",
    );
    this.tokenizer = new natural.WordTokenizer();

    // Initialize Classifier
    this.classifier = new natural.BayesClassifier();
    this.isTrained = false;
    this.trainingDataPath = require("path").join(
      __dirname,
      "../data/startup_training_data.json",
    );
    this.csvDataPath = require("path").join(
      __dirname,
      "../data/startup_ideas_5000.json",
    );

    // Auto-load and train if data exists (prefer CSV dataset)
    this.loadTrainingData();
  }

  loadTrainingData() {
    try {
      const fs = require("fs");
      // Try loading from CSV dataset first (startup_ideas_5000.json)
      if (fs.existsSync(this.csvDataPath)) {
        const data = JSON.parse(fs.readFileSync(this.csvDataPath, "utf8"));
        this.train(data);
      }
      // Fall back to original training data
      else if (fs.existsSync(this.trainingDataPath)) {
        const data = JSON.parse(fs.readFileSync(this.trainingDataPath, "utf8"));
        this.train(data);
      }
    } catch (error) {
      console.error("Error loading training data:", error);
    }
  }

  train(dataset) {
    if (!dataset || !Array.isArray(dataset)) return;

    dataset.forEach((item) => {
      // Combine features for text classification
      const text = `${item.description} ${item.industry} ${item.market_fit}`;
      this.classifier.addDocument(text, item.status);
    });

    this.classifier.train();
    this.isTrained = true;
    console.log(`ML Model trained with ${dataset.length} examples.`);
  }

  // New method to learn from single new example
  learn(ideaData, status) {
    if (!ideaData || !status) return;

    const text = `${ideaData.description} ${ideaData.industry} ${ideaData.market_fit}`;
    this.classifier.addDocument(text, status);
    
    // Retrain the model with the new data included
    this.classifier.train();
    console.log("ML Model updated with new user data.");
  }

  initializeWeights() {
    // Adjusted weights for more balanced scoring
    return {
      marketScore: 0.35, // Increased weight on market
      uniqueness: 0.2,
      feasibility: 0.25,
      revenue: 0.2,
    };
  }

  predictSuccessProbability(metrics) {
    // Weighted scoring algorithm with stricter baseline
    const normalized = {
      marketScore: metrics.marketPotential.score / 100,
      uniqueness: metrics.uniqueness.score / 100,
      feasibility: metrics.feasibility.score / 100,
      revenue: metrics.revenuePotential.score / 100,
    };

    let score = 0;
    score += normalized.marketScore * this.weights.marketScore;
    score += normalized.uniqueness * this.weights.uniqueness;
    score += normalized.feasibility * this.weights.feasibility;
    score += normalized.revenue * this.weights.revenue;

    // Apply more realistic curve - harder to get very high scores
    // Base capability + bonus for excellence
    const baseScore = score * 0.8;
    const excellenceBonus = score > 0.8 ? (score - 0.8) * 1.5 : 0;

    const finalScore = (baseScore + excellenceBonus) * 100;

    // Adjust based on trained model prediction if available
    let adjustedScore = finalScore;
    if (this.isTrained) {
      // Create a similar text signature for the new idea
      const ideaSignature = `${metrics.ideaDescription || ""} ${metrics.industry} ${metrics.marketPotential?.description || ""}`;
      const prediction = this.classifier.classify(ideaSignature);

      if (prediction === "success") {
        adjustedScore = Math.min(99, finalScore + 5); // Boost for looking like a winner
      } else if (prediction === "failure") {
        adjustedScore = Math.max(10, finalScore - 10); // Penalize for looking like a loser
      }
    }

    return Math.min(98, Math.round(adjustedScore));
  }

  analyzeSentiment(text) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const score = this.sentimentAnalyzer.getSentiment(tokens);

    // Normalize sentiment score to 0-100
    const normalizedScore = ((score + 5) / 10) * 100;

    return {
      score: Math.max(0, Math.min(100, normalizedScore)),
      sentiment: score > 1 ? "positive" : score < -1 ? "negative" : "neutral",
      confidence: Math.min(0.95, Math.abs(score) / 5 + 0.5), // Boost confidence baseline
    };
  }
  analyzeTextComplexity(text) {
    if (!text) return { complexityScore: 0 };

    // Simple complexity metrics
    const words = text.split(" ").length;
    const longWords = text.split(" ").filter((w) => w.length > 6).length;
    const sentences = text.split(/[.!?]+/).length;

    // Score based on length and vocabulary (simplified)
    const lengthScore = Math.min(100, (words / 50) * 100);
    const vocabScore = Math.min(100, (longWords / words) * 300);

    const complexityScore = Math.round(lengthScore * 0.6 + vocabScore * 0.4);

    return {
      complexityScore,
      wordCount: words,
      sentenceCount: sentences,
    };
  }

  calculateMarketTrends(industry) {
    // Simulated trend data based on industry
    const trends = {
      technology: {
        trend: "growing rapidly",
        factors: ["AI adoption", "Cloud computing"],
      },
      healthcare: {
        trend: "stable growth",
        factors: ["Aging population", "Telehealth"],
      },
      finance: {
        trend: "evolving",
        factors: ["Crypto", "DeFi", "Digital banking"],
      },
      education: {
        trend: "transforming",
        factors: ["Remote learning", "Personalization"],
      },
      ecommerce: {
        trend: "growing",
        factors: ["Mobile shopping", "Social commerce"],
      },
      saas: { trend: "highly competitive", factors: ["Vertical SaaS", "PLG"] },
      default: { trend: "stable", factors: ["Digital transformation"] },
    };

    return trends[industry?.toLowerCase()] || trends.default;
  }
  performCompetitiveAnalysis(competitors, industry) {
    if (!competitors || competitors.trim().length === 0) {
      return {
        competitionLevel: "unknown",
        marketSaturation: 50,
        recommendation:
          "Conduct thorough competitor research. Identifying valid competitors is a key signal of market demand.",
      };
    }

    const competitorList = competitors
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    const competitorCount = competitorList.length;

    let competitionLevel;
    let marketSaturation;

    if (competitorCount === 0) {
      competitionLevel = "low";
      marketSaturation = 20;
    } else if (competitorCount <= 2) {
      competitionLevel = "moderate";
      marketSaturation = 45;
    } else if (competitorCount <= 5) {
      competitionLevel = "high";
      marketSaturation = 70;
    } else {
      competitionLevel = "very high";
      marketSaturation = 85;
    }

    return {
      competitionLevel,
      marketSaturation,
      competitorCount,
      recommendation: this.getCompetitiveRecommendation(
        competitionLevel,
        industry,
        competitorList,
      ),
    };
  }

  getCompetitiveRecommendation(level, industry, competitors) {
    const recommendations = {
      low: "First-mover advantage is possible, but verify market demand exists.",
      moderate: `With ${competitors ? competitors.length : "some"} competitors, focus on your unique value proposition to stand out.`,
      high: "Market is proving valid but crowded. Execute faster and better than incumbents.",
      "very high":
        "Highly saturated. Niche down specifically or find a 10x improvement over existing solutions.",
    };

    return (
      recommendations[level] || "Analyze competitive positioning carefully"
    );
  }

  generateMLInsights(ideaData, metrics) {
    const insights = [];

    // Trained Model Insight
    if (this.isTrained) {
      const ideaSignature = `${ideaData.ideaDescription} ${ideaData.industry}`;
      const prediction = this.classifier.classify(ideaSignature);
      const classifications = this.classifier.getClassifications(ideaSignature);
      const confidence =
        classifications.find((c) => c.label === prediction)?.value || 0;

      // Convert confidence to percentage (approximate)
      const confidencePct = Math.round(confidence * 10000) / 100;

      if (prediction === "success") {
        insights.push(
          `Match with successful startups: Our model detects patterns similar to successful companies in your description.`,
        );
      } else if (prediction === "failure") {
        insights.push(
          `Risk Alert: Your idea shares characteristics with startups that faced significant challenges. Focus on differentiation.`,
        );
      }
    }

    // Sentiment analysis insight
    const sentiment = this.analyzeSentiment(ideaData.ideaDescription);
    if (sentiment.sentiment === "positive" && sentiment.score > 60) {
      insights.push(
        `Strong positive sentiment detected in idea articulation (${Math.round(
          sentiment.score,
        )}% confidence)`,
      );
    }

    // Text complexity insight
    const complexity = this.analyzeTextComplexity(ideaData.ideaDescription);
    if (complexity.complexityScore > 70) {
      insights.push(
        `Well-articulated idea with strong clarity (complexity score: ${complexity.complexityScore})`,
      );
    }

    // Market trend insight
    const trend = this.calculateMarketTrends(ideaData.industry);
    insights.push(
      `${ideaData.industry} industry is ${
        trend.trend
      } with key drivers: ${trend.factors.join(", ")}`,
    );

    // Competitive analysis insight
    const competitive = this.performCompetitiveAnalysis(
      ideaData.competitors,
      ideaData.industry,
    );
    insights.push(
      `Competition level: ${competitive.competitionLevel} (market saturation: ${competitive.marketSaturation}%)`,
    );

    return insights;
  }

  // Placeholder for external data fetching
  async fetchExternalMarketData(query) {
    // In a real production environment, this would call Google Custom Search API or Crunchbase API
    // containing: this.http.get('https://api.crunchbase.com/...')

    console.log(`Fetching external data for: ${query}`);
    // Simulating network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      source: "Simulated External Data",
      trend: "Stable",
      newsSentiment: "Neutral",
    };
  }
}

module.exports = new MLPredictionService();
