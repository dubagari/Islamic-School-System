import { confirmStudentPaymentService } from "../services/studentService.js";

export const confirmStudentPayment = async (req, res) => {
    try {
        const { admissionId } = req.params;

        const student = await confirmStudentPaymentService(admissionId);

        res.status(200).json({
            success: true,
            message: "Student registered successfully.",
            data: student,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};