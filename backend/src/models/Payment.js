import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        receiptNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
            index: true,
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            index: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01,
        },

        method: {
            type: String,
            enum: [
                "Cash",
                "Bank Transfer",
                "Card",
                "Paystack",
                "Cheque",
                "Other",
            ],
            required: true,
        },

        reference: {
            type: String,
            trim: true,
            default: "",
        },

        paidAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        status: {
            type: String,
            enum: ["Completed", "Reversed"],
            default: "Completed",
            index: true,
        },

        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        reversedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        reversedAt: {
            type: Date,
            default: null,
        },

        reversalReason: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({
    invoice: 1,
    status: 1,
});

paymentSchema.index({
    paidAt: -1,
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
