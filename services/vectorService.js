const axios = require("axios");

class VectorEmbeddingService {
  constructor() {
    this.embeddings = new Map();
    this.dimensionality = 384; // Standard embedding dimension
  }

  // Simple embedding using character-based features (fallback when no external API)
  generateSimpleEmbedding(text) {
    const normalized = text.toLowerCase().trim();
    const words = normalized.split(/\s+/);

    // Create feature vector
    const features = {
      length: Math.min(words.length / 100, 1),
      avgWordLength:
        words.reduce((sum, w) => sum + w.length, 0) / words.length / 15,
      uniqueWords: new Set(words).size / words.length,
      hasNumbers: /\d/.test(text) ? 1 : 0,
      hasUpperCase: /[A-Z]/.test(text) ? 1 : 0,
      questionMarks: ((text.match(/\?/g) || []).length / text.length) * 100,
      exclamationMarks: ((text.match(/!/g) || []).length / text.length) * 100,
    };

    // Generate embedding vector
    const embedding = new Array(this.dimensionality).fill(0);

    // Populate with features
    Object.values(features).forEach((value, index) => {
      if (index < this.dimensionality) {
        embedding[index] = value;
      }
    });

    // Add word-based features
    words.forEach((word, idx) => {
      const charCode = word.charCodeAt(0) || 0;
      const position = (idx % (this.dimensionality - 10)) + 10;
      embedding[position] = (embedding[position] + charCode / 255) / 2;
    });

    return embedding;
  }

  async generateEmbedding(text) {
    // Check if already cached
    if (this.embeddings.has(text)) {
      return this.embeddings.get(text);
    }

    // For now, use simple embedding
    // In production, you could integrate with OpenAI embeddings API
    const embedding = this.generateSimpleEmbedding(text);

    this.embeddings.set(text, embedding);
    return embedding;
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error("Vectors must have same dimensionality");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }

  async findSimilarIdeas(queryText, ideaDatabase, topK = 5) {
    const queryEmbedding = await this.generateEmbedding(queryText);

    const similarities = [];

    for (const idea of ideaDatabase) {
      const ideaEmbedding = await this.generateEmbedding(idea.description);
      const similarity = this.cosineSimilarity(queryEmbedding, ideaEmbedding);

      similarities.push({
        idea,
        similarity,
      });
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  async analyzeSemanticSimilarity(text1, text2) {
    const embedding1 = await this.generateEmbedding(text1);
    const embedding2 = await this.generateEmbedding(text2);

    const similarity = this.cosineSimilarity(embedding1, embedding2);

    return {
      similarity: Math.round(similarity * 100) / 100,
      interpretation:
        similarity > 0.8
          ? "very similar"
          : similarity > 0.6
          ? "similar"
          : similarity > 0.4
          ? "somewhat related"
          : "different",
    };
  }

  clearCache() {
    this.embeddings.clear();
  }
}

module.exports = new VectorEmbeddingService();
