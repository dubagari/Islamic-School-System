import { createSessionService } from "../services/sessionService.js";

export const createSession = async (req, res) => {
  try {
    const session = await createSessionService(req.body);

    res.status(201).json({
      success: true,
      message: "Academic session created successfully.",
      data: session,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};