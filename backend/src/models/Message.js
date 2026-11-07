import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        subject: {
            type: String,
            trim: true,
            default: "",
        },

        body: {
            type: String,
            required: true,
            trim: true,
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        readAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

messageSchema.index({
    sender: 1,
    recipient: 1,
    createdAt: -1,
});

messageSchema.index({
    recipient: 1,
    isRead: 1,
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
