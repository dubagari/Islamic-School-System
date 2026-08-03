import AdmissionApplication from "../models/AdmissionApplication.js";
import Student from "../models/Student.js";
import { generateStudentRegistrationNumber } from "../utils/generateStudentRegistrationNumber.js";
import { createStudentAccount } from "./userService.js";

export const confirmStudentPaymentService = async (admissionId) => {
    const application = await AdmissionApplication.findById(admissionId);

    if (!application) {
        throw new Error("Admission application not found");
    }

    if (application.status !== "Approved") {
        throw new Error("Admission application must be approved before payment");
    }

    //check if student has already been registered
    const existingStudent = await Student.findOne({
    admissionNumber: application.admissionNumber,
    });

    if (existingStudent) {
            throw new Error("Student has already been registered.");
    }
    

    
    // Generate registration number
    const registrationNumber = await generateStudentRegistrationNumber();

    // Create student record
   const student = await Student.create({
    registrationNumber,

    admissionNumber: application.admissionNumber,

    firstName: application.firstName,
    middleName: application.middleName,
    lastName: application.lastName,

    gender: application.gender,
    dateOfBirth: application.dateOfBirth,

    email: application.email,
    phone: application.phone,
    address: application.address,

    parentName: application.parentName,
    parentPhone: application.parentPhone,
    relationship: application.relationship,

    currentLevel: application.currentLevel,

    paymentStatus: "Paid",
    status: "Active",
    });


const account = await createStudentAccount(student);

    // Update application status to Registered
    application.paymentStatus = "Paid";
    application.status = "Registered";
    await application.save();

   return {
  student,
  login: account.login,
}

};  