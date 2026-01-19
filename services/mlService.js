const natural = require("natural");

class MLPredictionService {
  constructor() {
    // Lightweight neural network implementation
    this.weights = this.initializeWeights();
    this.sentimentAnalyzer = new natural.SentimentAnalyzer(
      "English",
      natural.PorterStemmer,
      "afinn"
    );
    this.tokenizer = new natural.WordTokenizer();
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
    const excellenceBonus = (score > 0.8) ? (score - 0.8) * 1.5 : 0;
    
    const finalScore = (baseScore + excellenceBonus) * 100;

    return Math.min(98, Math.round(finalScore));
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
// ... (skip unchanged methods until performCompetitiveAnalysis) ...
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
        competitorList
      ),
    };
  }

  getCompetitiveRecommendation(level, industry, competitors) {
    const recommendations = {
      low: "First-mover advantage is possible, but verify market demand exists.",
      moderate:
        `With ${competitors ? competitors.length : 'some'} competitors, focus on your unique value proposition to stand out.`,
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

    // Sentiment analysis insight
    const sentiment = this.analyzeSentiment(ideaData.ideaDescription);
    if (sentiment.sentiment === "positive" && sentiment.score > 60) {
      insights.push(
        `Strong positive sentiment detected in idea articulation (${Math.round(
          sentiment.score
        )}% confidence)`
      );
    }

    // Text complexity insight
    const complexity = this.analyzeTextComplexity(ideaData.ideaDescription);
    if (complexity.complexityScore > 70) {
      insights.push(
        `Well-articulated idea with strong clarity (complexity score: ${complexity.complexityScore})`
      );
    }

    // Market trend insight
    const trend = this.calculateMarketTrends(ideaData.industry);
    insights.push(
      `${ideaData.industry} industry is ${
        trend.trend
      } with key drivers: ${trend.factors.join(", ")}`
    );

    // Competitive analysis insight
    const competitive = this.performCompetitiveAnalysis(
      ideaData.competitors,
      ideaData.industry
    );
    insights.push(
      `Competition level: ${competitive.competitionLevel} (market saturation: ${competitive.marketSaturation}%)`
    );

    return insights;
  }
}

module.exports = new MLPredictionService();
