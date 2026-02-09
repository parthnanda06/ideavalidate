const mlService = require('../services/mlService');

// Test Data
const testIdeas = [
    {
        description: "A platform for renting out air mattresses in living rooms.",
        industry: "hospitality",
        market_fit: "high"
    },
    {
        description: "A machine that squeezes juice out of plastic packets.",
        industry: "food_beverage",
        market_fit: "low"
    }
];

console.log("Checking if model is trained...");
if (mlService.isTrained) {
    console.log("✅ Model is trained.");
} else {
    console.log("❌ Model is NOT trained.");
}

console.log("\nTesting Predictions:");

testIdeas.forEach(idea => {
    const signature = `${idea.description} ${idea.industry} ${idea.market_fit}`;
    const prediction = mlService.classifier.classify(signature);
    console.log(`\nIdea: ${idea.description}`);
    console.log(`Prediction: ${prediction}`);
    
    // Test full insights generation
    const mockMetrics = { marketPotential: { score: 80 }, uniqueness: { score: 70 }, feasibility: { score: 90 }, revenuePotential: { score: 80 } };
    const insights = mlService.generateMLInsights({ ideaDescription: idea.description, industry: idea.industry }, mockMetrics);
    
    console.log("Insights generated:", insights);
});
