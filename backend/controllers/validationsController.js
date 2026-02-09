const { db } = require("../config/firebase");

async function saveValidation(req, res) {
  try {
    const { userId } = req.user;
    
    // Safety check for DB
    if (!db || !db.collection) {
       throw new Error("Database not initialized");
    }

    const validationData = {
      ...req.body,
      userId,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection("validations").add(validationData);

    res.status(201).json({
      message: "Validation saved successfully",
      validation: { id: docRef.id, ...validationData },
    });
  } catch (error) {
    console.error("Save validation error:", error);
    res.status(500).json({
      error: "Failed to save validation",
      message: error.message,
    });
  }
}

async function getUserValidations(req, res) {
  try {
    const { userId } = req.user;
    
    if (!db || !db.collection) {
        throw new Error("Database not initialized");
    }

    const snapshot = await db.collection("validations")
        .where("userId", "==", userId)
        // .orderBy("createdAt", "desc") // Requires index in Firestore, skipping for now
        .get();

    const userValidations = [];
    snapshot.forEach(doc => {
        userValidations.push({ _id: doc.id, ...doc.data() });
    });
    
    // Manual sort since we can't guarantee composite index exists yet
    userValidations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      validations: userValidations,
      count: userValidations.length,
    });
  } catch (error) {
    console.error("Get validations error:", error);
    res.status(500).json({
      error: "Failed to retrieve validations",
      message: error.message,
    });
  }
}

async function deleteValidation(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const docRef = db.collection("validations").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
        return res.status(404).json({ error: "Validation not found" });
    }

    // Verify ownership
    if (doc.data().userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    await docRef.delete();

    res.json({ message: "Validation deleted successfully" });
  } catch (error) {
    console.error("Delete validation error:", error);
    res.status(500).json({
      error: "Failed to delete validation",
      message: error.message,
    });
  }
}

module.exports = {
  saveValidation,
  getUserValidations,
  deleteValidation,
};
