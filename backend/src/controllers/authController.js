import { loginService } from "../services/authService.js";

export const login = async (req, res) => {
    try {

        const { identifier, password } = req.body;

        const result = await loginService(
            identifier,
            password
        );

        res.status(200).json({
            success: true,
            message: "Login successful.",
            data: result,
        });

    } catch (error) {

        res.status(401).json({
            success: false,
            message: error.message,
        });

    }
};