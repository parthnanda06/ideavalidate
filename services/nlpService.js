const compromise = require("compromise");

class NLPAnalyzer {
  constructor() {
    this.industries = [
      "technology",
      "healthcare",
      "finance",
      "education",
      "ecommerce",
      "saas",
    ];
  }

  extractEntities(text) {
    const doc = compromise(text);

    return {
      people: doc.people().out("array"),
      places: doc.places().out("array"),
      organizations: doc.organizations().out("array"),
      topics: doc.topics().out("array"),
      verbs: doc.verbs().out("array").slice(0, 10),
      nouns: doc.nouns().out("array").slice(0, 15),
    };
  }

  analyzeIntent(text) {
    const doc = compromise(text);

    const hasQuestions = doc.questions().length > 0;
    const hasCommands = doc.imperative().length > 0;
    const hasStatements = doc.statements().length > 0;

    let intent = "informative";
    if (hasQuestions) intent = "exploratory";
    if (hasCommands) intent = "directive";

    return {
      intent,
      hasQuestions,
      hasCommands,
      hasStatements,
      confidence: 0.85,
    };
  }

  extractProblemSolution(problemText, solutionText) {
    const problemDoc = compromise(problemText);
    const solutionDoc = compromise(solutionText);

    // Extract pain points from problem description
    const painPoints = problemDoc.match("#Adjective+ #Noun+").out("array");

    // Extract solution approaches
    const solutions = solutionDoc.match("#Verb+ #Noun+").out("array");

    return {
      painPoints: painPoints.slice(0, 5),
      solutionApproaches: solutions.slice(0, 5),
      problemClarity: this.assessClarity(problemText),
      solutionClarity: this.assessClarity(solutionText),
    };
  }

  assessClarity(text) {
    const doc = compromise(text);
    const sentenceCount = doc.sentences().length;
    const wordCount = doc.wordCount();

    // Clear descriptions have moderate length and multiple sentences
    let clarityScore = 50;

    if (sentenceCount >= 2 && sentenceCount <= 6) clarityScore += 25;
    if (wordCount >= 50 && wordCount <= 200) clarityScore += 25;

    return Math.min(100, clarityScore);
  }

  detectIndustryKeywords(text, industry) {
    const industryKeywords = {
      technology: [
        "software",
        "app",
        "platform",
        "AI",
        "ML",
        "algorithm",
        "data",
        "cloud",
        "API",
      ],
      healthcare: [
        "health",
        "medical",
        "patient",
        "doctor",
        "treatment",
        "diagnosis",
        "wellness",
        "care",
      ],
      finance: [
        "payment",
        "banking",
        "investment",
        "trading",
        "financial",
        "money",
        "transaction",
        "credit",
      ],
      education: [
        "learning",
        "student",
        "teacher",
        "course",
        "training",
        "education",
        "skill",
        "knowledge",
      ],
      ecommerce: [
        "shop",
        "buy",
        "sell",
        "product",
        "marketplace",
        "retail",
        "commerce",
        "store",
      ],
      saas: [
        "subscription",
        "software",
        "service",
        "cloud",
        "automation",
        "workflow",
        "integration",
        "API",
      ],
    };

    const keywords = industryKeywords[industry.toLowerCase()] || [];
    const lowerText = text.toLowerCase();

    const foundKeywords = keywords.filter((keyword) =>
      lowerText.includes(keyword.toLowerCase())
    );

    return {
      foundKeywords,
      relevanceScore: (foundKeywords.length / keywords.length) * 100,
      industryAlignment:
        foundKeywords.length > 2
          ? "strong"
          : foundKeywords.length > 0
          ? "moderate"
          : "weak",
    };
  }

  analyzeBusinessModel(description, targetMarket) {
    const doc = compromise(description);
    const lowerDesc = description.toLowerCase();

    // Detect business model patterns
    const patterns = {
      subscription: [
        "subscription",
        "recurring",
        "monthly",
        "annual",
        "membership",
      ],
      marketplace: ["marketplace", "platform", "connect", "buyers", "sellers"],
      saas: ["software", "service", "cloud", "saas"],
      ecommerce: ["sell", "products", "online store", "ecommerce"],
      freemium: ["free", "premium", "upgrade", "freemium"],
      advertising: ["ads", "advertising", "sponsored", "monetize"],
    };

    const detectedModels = [];
    for (const [model, keywords] of Object.entries(patterns)) {
      const matches = keywords.filter((kw) => lowerDesc.includes(kw));
      if (matches.length > 0) {
        detectedModels.push({
          model,
          confidence: matches.length / keywords.length,
          matchedKeywords: matches,
        });
      }
    }

    return {
      detectedModels: detectedModels.sort(
        (a, b) => b.confidence - a.confidence
      ),
      primaryModel:
        detectedModels.length > 0 ? detectedModels[0].model : "unclear",
      modelClarity: detectedModels.length > 0 ? "clear" : "needs clarification",
    };
  }
}

module.exports = new NLPAnalyzer();
