import express from "express";

const router = express.Router();

// 🧪 MOCK DATA
let prescriptions = [
  {
    id: "RX001",
    patient: "John Doe",
    medicine: "Paracetamol",
    isValid: true,
    isDispensed: false,
    dispensedAt: null,
  },
];

// 🔍 GET prescription by ID
router.get("/prescription/:id", (req, res) => {
  const { id } = req.params;

  const prescription = prescriptions.find((p) => p.id === id);

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: "Prescription not found",
    });
  }

  res.json({
    success: true,
    data: prescription,
  });
});

// 💊 DISPENSE prescription
router.post("/dispense/:id", (req, res) => {
  const { id } = req.params;

  const prescription = prescriptions.find((p) => p.id === id);

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: "Prescription not found",
    });
  }

  if (prescription.isDispensed) {
    return res.status(400).json({
      success: false,
      message: "Already dispensed",
    });
  }

  prescription.isDispensed = true;
  prescription.dispensedAt = new Date();

  res.json({
    success: true,
    message: "Prescription dispensed successfully",
    data: prescription,
  });
});

// 📜 HISTORY
router.get("/history", (req, res) => {
  const history = prescriptions.filter((p) => p.isDispensed);

  res.json({
    success: true,
    data: history,
  });
});

export default router;