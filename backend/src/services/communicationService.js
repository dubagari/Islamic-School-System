import AcademicClass from "../models/AcademicClass.js";
import Announcement from "../models/Announcement.js";
import AnnouncementRead from "../models/AnnouncementRead.js";
import ClassSubject from "../models/ClassSubject.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Parent from "../models/Parent.js";
import Student from "../models/Student.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import User from "../models/User.js";
import {
    getPagination,
    paginatedResult,
} from "../utils/pagination.js";
import { escapeRegex } from "../utils/search.js";
import {
    badRequest,
    forbidden,
    notFound,
} from "../utils/AppError.js";

// ======================================================
// Shared Notification Helper
// ======================================================

export const createNotificationsForUsers = async ({
    userIds,
    title,
    message,
    type = "system",
    referenceId = null,
    createdBy = null,
}) => {
    const uniqueUserIds = [
        ...new Set(
            (userIds || [])
                .filter(Boolean)
                .map((userId) => userId.toString())
        ),
    ];

    if (uniqueUserIds.length === 0) {
        return 0;
    }

    const documents = uniqueUserIds.map((userId) => ({
        recipient: userId,
        title,
        message,
        type,
        referenceId,
        createdBy,
        isRead: false,
    }));

    await Notification.insertMany(documents, {
        ordered: false,
    });

    return documents.length;
};

// ======================================================
// Student / Parent Audience Notifications
// Used by results, fees and attendance hooks.
// ======================================================

export const createStudentAudienceNotifications = async ({
    studentIds,
    title,
    message,
    type = "system",
    referenceId = null,
    createdBy = null,
}) => {
    const uniqueStudentIds = [
        ...new Set(
            (studentIds || [])
                .filter(Boolean)
                .map((studentId) => studentId.toString())
        ),
    ];

    if (uniqueStudentIds.length === 0) {
        return 0;
    }

    const [students, parentUserIds] = await Promise.all([
        Student.find({
            _id: { $in: uniqueStudentIds },
            isActive: true,
        }).select("user"),
        Parent.find({
            students: { $in: uniqueStudentIds },
            isActive: true,
        }).distinct("user"),
    ]);

    const studentUserIds = students
        .map((student) => student.user)
        .filter(Boolean);

    return await createNotificationsForUsers({
        userIds: [...studentUserIds, ...parentUserIds],
        title,
        message,
        type,
        referenceId,
        createdBy,
    });
};

// ======================================================
// Announcement Helpers
// ======================================================

const populateAnnouncement = (query) =>
    query
        .populate(
            "academicClass",
            "name academicLevel"
        )
        .populate(
            "createdBy",
            "fullName username role"
        );

const getClassAudienceUserIds = async (
    academicClassId
) => {
    const classRecord = await AcademicClass.findById(
        academicClassId
    );

    if (!classRecord) {
        throw notFound("Academic class not found.");
    }

    const students = await Student.find({
        academicClass: academicClassId,
        isActive: true,
    }).select("_id user");

    const studentIds = students.map(
        (student) => student._id
    );

    const studentUserIds = students
        .map((student) => student.user)
        .filter(Boolean);

    const parentUserIds = await Parent.find({
        students: { $in: studentIds },
        isActive: true,
    }).distinct("user");

    const classSubjectIds = await ClassSubject.find({
        academicClass: academicClassId,
        isActive: true,
    }).distinct("_id");

    const teacherUserIds =
        await TeacherAssignment.find({
            classSubject: { $in: classSubjectIds },
            isActive: true,
        }).distinct("teacher");

    return [
        ...studentUserIds,
        ...parentUserIds,
        ...teacherUserIds,
        ...(classRecord.classTeacher
            ? [classRecord.classTeacher]
            : []),
    ];
};

const resolveAnnouncementRecipients = async (
    announcement
) => {
    let userIds = [];

    if (announcement.audience === "all") {
        userIds = await User.find({
            isActive: true,
        }).distinct("_id");
    } else if (announcement.audience === "students") {
        userIds = await User.find({
            role: "student",
            isActive: true,
        }).distinct("_id");
    } else if (announcement.audience === "teachers") {
        userIds = await User.find({
            role: "teacher",
            isActive: true,
        }).distinct("_id");
    } else if (announcement.audience === "parents") {
        userIds = await User.find({
            role: "parent",
            isActive: true,
        }).distinct("_id");
    } else if (announcement.audience === "class") {
        userIds = await getClassAudienceUserIds(
            announcement.academicClass
        );
    }

    return userIds.filter(
        (userId) =>
            userId &&
            userId.toString() !==
                announcement.createdBy.toString()
    );
};

const notifyAnnouncement = async (announcement) => {
    if (!announcement.isPublished) {
        return;
    }

    if (
        announcement.publishAt &&
        new Date(announcement.publishAt).getTime() >
            Date.now()
    ) {
        return;
    }

    const userIds = await resolveAnnouncementRecipients(
        announcement
    );

    const count = await createNotificationsForUsers({
        userIds,
        title: announcement.title,
        message: announcement.content.slice(0, 500),
        type: "announcement",
        referenceId: announcement._id,
        createdBy: announcement.createdBy,
    });

    announcement.notifiedAt = new Date();
    announcement.recipientCount = count;

    await announcement.save();
};

const sendAnnouncementNotifications = async (
    announcement
) => {
    try {
        await notifyAnnouncement(announcement);
    } catch (error) {
        // Notification delivery must not block the announcement itself.
    }
};

const buildAnnouncementVisibility = async (user) => {
    if (user.role === "admin") {
        return null;
    }

    if (user.role === "teacher") {
        return {
            $or: [
                { audience: "all" },
                { audience: "teachers" },
            ],
        };
    }

    if (user.role === "student") {
        const student = await Student.findOne({
            user: user._id,
        });

        const or = [
            { audience: "all" },
            { audience: "students" },
        ];

        if (student?.academicClass) {
            or.push({
                audience: "class",
                academicClass: student.academicClass,
            });
        }

        return { $or: or };
    }

    if (user.role === "parent") {
        const parent = await Parent.findOne({
            user: user._id,
        });

        const studentIds = parent?.students || [];

        const classIds = await Student.find({
            _id: { $in: studentIds },
        }).distinct("academicClass");

        const or = [
            { audience: "all" },
            { audience: "parents" },
        ];

        if (classIds.length > 0) {
            or.push({
                audience: "class",
                academicClass: { $in: classIds },
            });
        }

        return { $or: or };
    }

    return { audience: "all" };
};

const canTeacherViewClassAnnouncement = async (
    user,
    academicClassId
) => {
    const classRecord = await AcademicClass.findById(
        academicClassId
    );

    if (!classRecord) {
        return false;
    }

    if (
        classRecord.classTeacher?.toString() ===
        user._id.toString()
    ) {
        return true;
    }

    const classSubjectIds = await ClassSubject.find({
        academicClass: academicClassId,
        isActive: true,
    }).distinct("_id");

    const assignment = await TeacherAssignment.exists({
        teacher: user._id,
        classSubject: { $in: classSubjectIds },
        isActive: true,
    });

    return Boolean(assignment);
};

const canViewAnnouncement = async (
    announcement,
    user
) => {
    if (user.role === "admin") {
        return true;
    }

    if (!announcement.isPublished) {
        return false;
    }

    if (
        new Date(announcement.publishAt).getTime() >
        Date.now()
    ) {
        return false;
    }

    if (
        announcement.expiresAt &&
        new Date(announcement.expiresAt).getTime() <=
            Date.now()
    ) {
        return false;
    }

    if (announcement.audience === "all") {
        return true;
    }

    if (announcement.audience === "teachers") {
        return user.role === "teacher";
    }

    if (announcement.audience === "students") {
        return user.role === "student";
    }

    if (announcement.audience === "parents") {
        return user.role === "parent";
    }

    if (announcement.audience === "class") {
        if (!announcement.academicClass) {
            return false;
        }

        if (user.role === "student") {
            const student = await Student.findOne({
                user: user._id,
            });

            return (
                student?.academicClass?.toString() ===
                announcement.academicClass.toString()
            );
        }

        if (user.role === "parent") {
            const parent = await Parent.findOne({
                user: user._id,
            });

            if (!parent || parent.students.length === 0) {
                return false;
            }

            const classIds = await Student.find({
                _id: { $in: parent.students },
            }).distinct("academicClass");

            return classIds.some(
                (classId) =>
                    classId.toString() ===
                    announcement.academicClass.toString()
            );
        }

        if (user.role === "teacher") {
            return await canTeacherViewClassAnnouncement(
                user,
                announcement.academicClass
            );
        }
    }

    return false;
};

// ======================================================
// Announcements
// ======================================================

export const createAnnouncementService = async (
    data,
    user
) => {
    const audience = data.audience || "all";

    if (audience === "class") {
        const classRecord = await AcademicClass.findById(
            data.academicClass
        );

        if (!classRecord) {
            throw notFound("Academic class not found.");
        }
    }

    const announcement = await Announcement.create({
        title: data.title,
        content: data.content,
        audience,
        academicClass:
            audience === "class"
                ? data.academicClass
                : null,
        priority: data.priority || "Normal",
        publishAt: data.publishAt
            ? new Date(data.publishAt)
            : new Date(),
        expiresAt: data.expiresAt
            ? new Date(data.expiresAt)
            : null,
        isPublished: data.isPublished !== false,
        createdBy: user._id,
    });

    await sendAnnouncementNotifications(announcement);

    return await populateAnnouncement(
        Announcement.findById(announcement._id)
    );
};

export const getAnnouncementsService = async (
    query,
    user
) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {};
    const and = [];

    if (query.audience) {
        filter.audience = query.audience;
    }

    if (query.priority) {
        filter.priority = query.priority;
    }

    if (query.academicClass) {
        filter.academicClass = query.academicClass;
    }

    if (query.isPublished !== undefined) {
        filter.isPublished =
            query.isPublished === "true";
    }

    if (query.search) {
        const regex = new RegExp(
            escapeRegex(query.search),
            "i"
        );

        filter.$or = [
            { title: regex },
            { content: regex },
        ];
    }

    if (user.role !== "admin") {
        and.push({ isPublished: true });
        and.push({
            publishAt: { $lte: new Date() },
        });
        and.push({
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } },
            ],
        });
    }

    const visibility =
        await buildAnnouncementVisibility(user);

    if (visibility) {
        and.push(visibility);
    }

    if (and.length > 0) {
        filter.$and = and;
    }

    const [announcements, total] = await Promise.all([
        populateAnnouncement(
            Announcement.find(filter)
        )
            .sort({ priority: -1, publishAt: -1 })
            .skip(skip)
            .limit(limit),
        Announcement.countDocuments(filter),
    ]);

    const reads = await AnnouncementRead.find({
        user: user._id,
        announcement: {
            $in: announcements.map(
                (announcement) => announcement._id
            ),
        },
    }).distinct("announcement");

    const readSet = new Set(
        reads.map((id) => id.toString())
    );

    const data = announcements.map((announcement) => ({
        ...announcement.toObject(),
        isRead: readSet.has(
            announcement._id.toString()
        ),
    }));

    const readAnnouncementIds =
        await AnnouncementRead.find({
            user: user._id,
        }).distinct("announcement");

    const unreadCount =
        await Announcement.countDocuments({
            ...filter,
            _id: {
                $nin: readAnnouncementIds,
            },
        });

    return {
        ...paginatedResult(data, total, {
            page,
            limit,
        }),
        unreadCount,
    };
};

export const getAnnouncementByIdService = async (
    announcementId,
    user
) => {
    const announcement = await populateAnnouncement(
        Announcement.findById(announcementId)
    );

    if (!announcement) {
        throw notFound("Announcement not found.");
    }

    const canView = await canViewAnnouncement(
        announcement,
        user
    );

    if (!canView) {
        throw notFound("Announcement not found.");
    }

    const read = await AnnouncementRead.exists({
        announcement: announcement._id,
        user: user._id,
    });

    return {
        ...announcement.toObject(),
        isRead: Boolean(read),
    };
};

export const markAnnouncementReadService = async (
    announcementId,
    user
) => {
    const announcement = await Announcement.findById(
        announcementId
    );

    if (!announcement) {
        throw notFound("Announcement not found.");
    }

    const canView = await canViewAnnouncement(
        announcement,
        user
    );

    if (!canView) {
        throw notFound("Announcement not found.");
    }

    const read = await AnnouncementRead.findOneAndUpdate(
        {
            announcement: announcement._id,
            user: user._id,
        },
        {
            $set: {
                readAt: new Date(),
            },
        },
        {
            returnDocument: "after",
            upsert: true,
            setDefaultsOnInsert: true,
        }
    );

    return read;
};

export const updateAnnouncementService = async (
    announcementId,
    data
) => {
    const announcement = await Announcement.findById(
        announcementId
    );

    if (!announcement) {
        throw notFound("Announcement not found.");
    }

    if (data.audience !== undefined) {
        if (data.audience === "class") {
            const classId =
                data.academicClass ??
                announcement.academicClass;

            if (!classId) {
                throw badRequest(
                    "An academic class is required for class announcements."
                );
            }

            const classRecord = await AcademicClass.findById(
                classId
            );

            if (!classRecord) {
                throw notFound("Academic class not found.");
            }

            announcement.academicClass = classId;
        } else {
            announcement.academicClass = null;
        }

        announcement.audience = data.audience;
    }

    if (
        data.academicClass !== undefined &&
        announcement.audience === "class"
    ) {
        if (!data.academicClass) {
            throw badRequest(
                "An academic class is required for class announcements."
            );
        }

        const classRecord = await AcademicClass.findById(
            data.academicClass
        );

        if (!classRecord) {
            throw notFound("Academic class not found.");
        }

        announcement.academicClass = data.academicClass;
    }

    if (data.title !== undefined) {
        announcement.title = data.title;
    }

    if (data.content !== undefined) {
        announcement.content = data.content;
    }

    if (data.priority !== undefined) {
        announcement.priority = data.priority;
    }

    if (data.publishAt !== undefined) {
        announcement.publishAt = new Date(
            data.publishAt
        );
    }

    if (data.expiresAt !== undefined) {
        announcement.expiresAt = data.expiresAt
            ? new Date(data.expiresAt)
            : null;
    }

    if (data.isPublished !== undefined) {
        announcement.isPublished = data.isPublished;
    }

    await announcement.save();

    if (
        announcement.isPublished &&
        !announcement.notifiedAt &&
        new Date(announcement.publishAt).getTime() <=
            Date.now()
    ) {
        await sendAnnouncementNotifications(
            announcement
        );
    }

    return await populateAnnouncement(
        Announcement.findById(announcement._id)
    );
};

export const deleteAnnouncementService = async (
    announcementId
) => {
    const announcement = await Announcement.findById(
        announcementId
    );

    if (!announcement) {
        throw notFound("Announcement not found.");
    }

    await Promise.all([
        AnnouncementRead.deleteMany({
            announcement: announcement._id,
        }),
        Notification.deleteMany({
            type: "announcement",
            referenceId: announcement._id,
        }),
    ]);

    await announcement.deleteOne();

    return announcement;
};

// ======================================================
// Messages
// ======================================================

const populateMessage = (query) =>
    query
        .populate(
            "sender",
            "fullName username email role"
        )
        .populate(
            "recipient",
            "fullName username email role"
        );

export const sendMessageService = async (
    data,
    user
) => {
    if (
        data.recipient.toString() ===
        user._id.toString()
    ) {
        throw badRequest(
            "You cannot send a message to yourself."
        );
    }

    const recipient = await User.findById(
        data.recipient
    );

    if (!recipient) {
        throw notFound("Recipient not found.");
    }

    if (!recipient.isActive) {
        throw badRequest(
            "The recipient account is inactive."
        );
    }

    const message = await Message.create({
        sender: user._id,
        recipient: recipient._id,
        subject: data.subject || "",
        body: data.body,
    });

    try {
        await createNotificationsForUsers({
            userIds: [recipient._id],
            title: `New message from ${
                user.fullName || user.username
            }`,
            message:
                data.subject || data.body.slice(0, 200),
            type: "message",
            referenceId: message._id,
            createdBy: user._id,
        });
    } catch (error) {
        // The message was saved; notification failure is non-fatal.
    }

    return await populateMessage(
        Message.findById(message._id)
    );
};

export const getMessagesService = async (
    query,
    user
) => {
    const { page, limit, skip } = getPagination(query);

    const box = query.box || "inbox";

    let filter;

    if (box === "sent") {
        filter = { sender: user._id };
    } else if (box === "all") {
        filter = {
            $or: [
                { sender: user._id },
                { recipient: user._id },
            ],
        };
    } else {
        filter = { recipient: user._id };
    }

    if (query.isRead !== undefined) {
        filter.isRead = query.isRead === "true";
    }

    if (query.search) {
        const regex = new RegExp(
            escapeRegex(query.search),
            "i"
        );

        filter.$and = [
            {
                $or: [
                    { subject: regex },
                    { body: regex },
                ],
            },
        ];
    }

    const [messages, total, unreadCount] =
        await Promise.all([
            populateMessage(Message.find(filter))
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Message.countDocuments(filter),
            Message.countDocuments({
                recipient: user._id,
                isRead: false,
            }),
        ]);

    return {
        ...paginatedResult(messages, total, {
            page,
            limit,
        }),
        unreadCount,
    };
};

export const getConversationService = async (
    user,
    otherUserId,
    query
) => {
    if (
        otherUserId.toString() ===
        user._id.toString()
    ) {
        throw badRequest(
            "A conversation requires another user."
        );
    }

    const otherUser = await User.findById(
        otherUserId
    ).select("fullName username email role");

    if (!otherUser) {
        throw notFound("User not found.");
    }

    await Message.updateMany(
        {
            sender: otherUser._id,
            recipient: user._id,
            isRead: false,
        },
        {
            $set: {
                isRead: true,
                readAt: new Date(),
            },
        }
    );

    const { page, limit, skip } = getPagination(query);

    const filter = {
        $or: [
            {
                sender: user._id,
                recipient: otherUser._id,
            },
            {
                sender: otherUser._id,
                recipient: user._id,
            },
        ],
    };

    const [messages, total] = await Promise.all([
        populateMessage(Message.find(filter))
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit),
        Message.countDocuments(filter),
    ]);

    return {
        otherUser,
        ...paginatedResult(messages, total, {
            page,
            limit,
        }),
    };
};

export const markMessageReadService = async (
    messageId,
    user
) => {
    const message = await Message.findById(messageId);

    if (!message) {
        throw notFound("Message not found.");
    }

    if (
        message.recipient.toString() !==
        user._id.toString()
    ) {
        throw forbidden(
            "Only the recipient can mark a message as read."
        );
    }

    message.isRead = true;
    message.readAt = new Date();

    await message.save();

    return await populateMessage(
        Message.findById(message._id)
    );
};

export const markAllMessagesReadService = async (
    user
) => {
    const result = await Message.updateMany(
        {
            recipient: user._id,
            isRead: false,
        },
        {
            $set: {
                isRead: true,
                readAt: new Date(),
            },
        }
    );

    return {
        modified: result.modifiedCount,
    };
};

export const getUnreadMessageCountService = async (
    user
) => {
    const count = await Message.countDocuments({
        recipient: user._id,
        isRead: false,
    });

    return { unreadCount: count };
};

// ======================================================
// Notifications
// ======================================================

export const getNotificationsService = async (
    query,
    user
) => {
    const { page, limit, skip } = getPagination(query);

    const filter = {
        recipient: user._id,
    };

    if (query.type) {
        filter.type = query.type;
    }

    if (query.isRead !== undefined) {
        filter.isRead = query.isRead === "true";
    }

    const [notifications, total, unreadCount] =
        await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments(filter),
            Notification.countDocuments({
                recipient: user._id,
                isRead: false,
            }),
        ]);

    return {
        ...paginatedResult(notifications, total, {
            page,
            limit,
        }),
        unreadCount,
    };
};

export const markNotificationReadService = async (
    notificationId,
    user
) => {
    const notification = await Notification.findOne({
        _id: notificationId,
        recipient: user._id,
    });

    if (!notification) {
        throw notFound("Notification not found.");
    }

    notification.isRead = true;
    notification.readAt = new Date();

    await notification.save();

    return notification;
};

export const markAllNotificationsReadService = async (
    user
) => {
    const result = await Notification.updateMany(
        {
            recipient: user._id,
            isRead: false,
        },
        {
            $set: {
                isRead: true,
                readAt: new Date(),
            },
        }
    );

    return {
        modified: result.modifiedCount,
    };
};

export const getUnreadNotificationCountService =
    async (user) => {
        const count = await Notification.countDocuments({
            recipient: user._id,
            isRead: false,
        });

        return { unreadCount: count };
    };

export const deleteNotificationService = async (
    notificationId,
    user
) => {
    const notification = await Notification.findOne({
        _id: notificationId,
        recipient: user._id,
    });

    if (!notification) {
        throw notFound("Notification not found.");
    }

    await notification.deleteOne();

    return notification;
};

export const broadcastNotificationService = async (
    data,
    user
) => {
    let userIds;

    if (
        Array.isArray(data.userIds) &&
        data.userIds.length > 0
    ) {
        userIds = await User.find({
            _id: { $in: data.userIds },
            isActive: true,
        }).distinct("_id");
    } else {
        const role = data.role || "all";
        const filter = {
            isActive: true,
            ...(role !== "all" ? { role } : {}),
        };

        userIds = await User.find(filter).distinct(
            "_id"
        );
    }

    if (userIds.length === 0) {
        throw badRequest(
            "No active users matched the notification audience."
        );
    }

    const count = await createNotificationsForUsers({
        userIds,
        title: data.title,
        message: data.message,
        type: data.type || "system",
        createdBy: user._id,
    });

    return {
        recipients: count,
    };
};
