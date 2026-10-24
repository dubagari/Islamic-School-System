import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
    {
        feeStructure: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FeeStructure",
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        _id: false,
    }
);

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
            index: true,
        },

        academicSession: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSession",
            required: true,
            index: true,
        },

        academicSemester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicSemester",
            required: true,
            index: true,
        },

        academicClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicClass",
            required: true,
            index: true,
        },

        items: {
            type: [invoiceItemSchema],
            validate: {
                validator: (items) =>
                    Array.isArray(items) && items.length > 0,
                message:
                    "An invoice must contain at least one item.",
            },
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        amountPaid: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        balance: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        status: {
            type: String,
            enum: [
                "Unpaid",
                "Partially Paid",
                "Paid",
                "Overdue",
                "Cancelled",
            ],
            default: "Unpaid",
            index: true,
        },

        dueDate: {
            type: Date,
            default: null,
            index: true,
        },

        notes: {
            type: String,
            trim: true,
            default: "",
        },

        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

invoiceSchema.index({
    student: 1,
    academicSession: 1,
    academicSemester: 1,
});

invoiceSchema.index({
    status: 1,
    dueDate: 1,
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
