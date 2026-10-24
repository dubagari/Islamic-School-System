import {
    createAnnouncementService,
    getAnnouncementsService,
    getAnnouncementByIdService,
    markAnnouncementReadService,
    updateAnnouncementService,
    deleteAnnouncementService,
    getPublicAnnouncementsService,
    sendMessageService,
    getMessagesService,
    getConversationService,
    markMessageReadService,
    markAllMessagesReadService,
    getUnreadMessageCountService,
    getNotificationsService,
    markNotificationReadService,
    markAllNotificationsReadService,
    getUnreadNotificationCountService,
    deleteNotificationService,
    broadcastNotificationService,
} from "../services/communicationService.js";

// ======================================================
// Announcements
// ======================================================

export const createAnnouncementController = async (
    req,
    res,
    next
) => {
    try {
        const announcement =
            await createAnnouncementService(
                req.body,
                req.user
            );

        res.status(201).json({
            success: true,
            message: "Announcement created successfully.",
            data: announcement,
        });
    } catch (error) {
        next(error);
    }
};

export const getAnnouncementsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getAnnouncementsService(
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Announcements retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
            unreadCount: result.unreadCount,
        });
    } catch (error) {
        next(error);
    }
};

export const getAnnouncementByIdController = async (
    req,
    res,
    next
) => {
    try {
        const announcement =
            await getAnnouncementByIdService(
                req.params.id,
                req.user
            );

        res.status(200).json({
            success: true,
            message: "Announcement retrieved successfully.",
            data: announcement,
        });
    } catch (error) {
        next(error);
    }
};

export const markAnnouncementReadController = async (
    req,
    res,
    next
) => {
    try {
        const read = await markAnnouncementReadService(
            req.params.id,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Announcement marked as read.",
            data: read,
        });
    } catch (error) {
        next(error);
    }
};

export const updateAnnouncementController = async (
    req,
    res,
    next
) => {
    try {
        const announcement =
            await updateAnnouncementService(
                req.params.id,
                req.body
            );

        res.status(200).json({
            success: true,
            message: "Announcement updated successfully.",
            data: announcement,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAnnouncementController = async (
    req,
    res,
    next
) => {
    try {
        const announcement =
            await deleteAnnouncementService(req.params.id);

        res.status(200).json({
            success: true,
            message: "Announcement deleted successfully.",
            data: announcement,
        });
    } catch (error) {
        next(error);
    }
};

export const getAnnouncementUnreadCountController =
    async (req, res, next) => {
        try {
            const result =
                await getAnnouncementsService(
                    {
                        page: 1,
                        limit: 1,
                    },
                    req.user
                );

            res.status(200).json({
                success: true,
                message:
                    "Announcement unread count retrieved successfully.",
                unreadCount: result.unreadCount,
            });
        } catch (error) {
            next(error);
        }
    };

export const getPublicAnnouncementsController = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await getPublicAnnouncementsService(
                req.query
            );

        res.status(200).json({
            success: true,
            message:
                "Public announcements retrieved successfully.",
            data: result.announcements,
            total: result.total,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Messages
// ======================================================

export const sendMessageController = async (
    req,
    res,
    next
) => {
    try {
        const message = await sendMessageService(
            req.body,
            req.user
        );

        res.status(201).json({
            success: true,
            message: "Message sent successfully.",
            data: message,
        });
    } catch (error) {
        next(error);
    }
};

export const getMessagesController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getMessagesService(
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Messages retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
            unreadCount: result.unreadCount,
        });
    } catch (error) {
        next(error);
    }
};

export const getConversationController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getConversationService(
            req.user,
            req.params.userId,
            req.validatedQuery || req.query
        );

        res.status(200).json({
            success: true,
            message: "Conversation retrieved successfully.",
            otherUser: result.otherUser,
            data: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

export const markMessageReadController = async (
    req,
    res,
    next
) => {
    try {
        const message = await markMessageReadService(
            req.params.id,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Message marked as read.",
            data: message,
        });
    } catch (error) {
        next(error);
    }
};

export const markAllMessagesReadController = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await markAllMessagesReadService(req.user);

        res.status(200).json({
            success: true,
            message: "All messages marked as read.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getUnreadMessageCountController = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await getUnreadMessageCountService(req.user);

        res.status(200).json({
            success: true,
            message:
                "Unread message count retrieved successfully.",
            unreadCount: result.unreadCount,
        });
    } catch (error) {
        next(error);
    }
};

// ======================================================
// Notifications
// ======================================================

export const getNotificationsController = async (
    req,
    res,
    next
) => {
    try {
        const result = await getNotificationsService(
            req.validatedQuery || req.query,
            req.user
        );

        res.status(200).json({
            success: true,
            message: "Notifications retrieved successfully.",
            data: result.data,
            pagination: result.pagination,
            unreadCount: result.unreadCount,
        });
    } catch (error) {
        next(error);
    }
};

export const markNotificationReadController = async (
    req,
    res,
    next
) => {
    try {
        const notification =
            await markNotificationReadService(
                req.params.id,
                req.user
            );

        res.status(200).json({
            success: true,
            message: "Notification marked as read.",
            data: notification,
        });
    } catch (error) {
        next(error);
    }
};

export const markAllNotificationsReadController = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await markAllNotificationsReadService(
                req.user
            );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getUnreadNotificationCountController =
    async (req, res, next) => {
        try {
            const result =
                await getUnreadNotificationCountService(
                    req.user
                );

            res.status(200).json({
                success: true,
                message:
                    "Unread notification count retrieved successfully.",
                unreadCount: result.unreadCount,
            });
        } catch (error) {
            next(error);
        }
    };

export const deleteNotificationController = async (
    req,
    res,
    next
) => {
    try {
        const notification =
            await deleteNotificationService(
                req.params.id,
                req.user
            );

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully.",
            data: notification,
        });
    } catch (error) {
        next(error);
    }
};

export const broadcastNotificationController = async (
    req,
    res,
    next
) => {
    try {
        const result =
            await broadcastNotificationService(
                req.body,
                req.user
            );

        res.status(201).json({
            success: true,
            message: "Notification broadcast successfully.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
