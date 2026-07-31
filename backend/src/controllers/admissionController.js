import AdmissionApplication from "../models/AdmissionApplication.js";

export const createAdmissionApplication = async (req, res) => {
  try {
    const application = await AdmissionApplication.create(req.body);

    res.status(201).json({
      success: true,
      message: "Admission application submitted successfully.",
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};