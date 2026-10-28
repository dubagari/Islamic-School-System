import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import PDFDocument from "pdfkit";

import { UPLOADS_ROOT } from "../utils/uploads.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");

const PAGE_WIDTH = 595.28;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
    forest: "#0f3d2e",
    gold: "#b8860b",
    ink: "#1f2937",
    muted: "#6b7280",
    line: "#d1d5db",
    soft: "#f3f4f6",
};

const display = (value) => {
    if (value === null || value === undefined) {
        return "\u2014";
    }

    const text = String(value).trim();

    return text || "\u2014";
};

const formatDate = (value) => {
    if (!value) {
        return "\u2014";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "\u2014";
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (value) => {
    const date = value ? new Date(value) : new Date();

    if (Number.isNaN(date.getTime())) {
        return "\u2014";
    }

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const loadPhoto = async (photoUrl) => {
    if (!photoUrl) {
        return null;
    }

    try {
        if (photoUrl.startsWith("/uploads/")) {
            const relative = photoUrl.replace(/^\/uploads\/?/, "");
            const filePath = path.join(UPLOADS_ROOT, relative);

            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath);
            }

            return null;
        }

        if (!/^https?:\/\//i.test(photoUrl)) {
            return null;
        }

        const response = await fetch(photoUrl, {
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            return null;
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.startsWith("image/")) {
            return null;
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        if (buffer.length > 5 * 1024 * 1024) {
            return null;
        }

        return buffer;
    } catch {
        return null;
    }
};

const sectionTitle = (doc, title, y) => {
    doc.font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(COLORS.forest)
        .text(title.toUpperCase(), MARGIN, y, {
            width: CONTENT_WIDTH,
            characterSpacing: 0.6,
        });

    doc.moveTo(MARGIN, y + 13)
        .lineTo(PAGE_WIDTH - MARGIN, y + 13)
        .lineWidth(0.8)
        .strokeColor(COLORS.line)
        .stroke();

    return y + 21;
};

const field = (doc, label, value, x, y, width, height = 26) => {
    doc.font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLORS.muted)
        .text(label.toUpperCase(), x, y, { width });

    doc.font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLORS.ink)
        .text(display(value), x, y + 10, {
            width,
            height,
            ellipsis: true,
        });

    return y + Math.max(32, height + 12);
};

const fieldPair = (doc, left, right, y) => {
    field(doc, left.label, left.value, MARGIN, y, 225);
    field(doc, right.label, right.value, MARGIN + 240, y, CONTENT_WIDTH - 240);

    return y + 32;
};

const fullName = (application) =>
    [application.firstName, application.middleName, application.lastName]
        .filter(Boolean)
        .join(" ");

export const buildAdmissionApplicationPdf = async (application) => {
    const photo = await loadPhoto(application.photoUrl);

    const doc = new PDFDocument({
        size: "A4",
        margin: MARGIN,
        info: {
            Title: `Admission Application ${display(application.applicationNumber)}`,
            Author: "Darul Ulum Islamic School",
            Subject: "Admission application form",
        },
    });

    const chunks = [];
    const finished = new Promise((resolve, reject) => {
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
    });

    if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, MARGIN, 44, { width: 42, height: 42 });
    }

    doc.font("Helvetica-Bold")
        .fontSize(16)
        .fillColor(COLORS.ink)
        .text("Darul Ulum Islamic School", MARGIN + 54, 47);

    doc.font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.muted)
        .text("Admission Application Form", MARGIN + 54, 68);

    doc.font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLORS.muted)
        .text(`Generated ${formatDateTime()}`, MARGIN, 48, {
            width: CONTENT_WIDTH,
            align: "right",
        });

    doc.moveTo(MARGIN, 96)
        .lineTo(PAGE_WIDTH - MARGIN, 96)
        .lineWidth(1.5)
        .strokeColor(COLORS.forest)
        .stroke();

    doc.font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLORS.muted)
        .text("APPLICATION NUMBER", MARGIN, 110);

    doc.font("Helvetica-Bold")
        .fontSize(18)
        .fillColor(COLORS.forest)
        .text(display(application.applicationNumber), MARGIN, 121);

    doc.font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLORS.muted)
        .text("STATUS", MARGIN, 154);

    doc.font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(
            application.status === "Approved"
                ? COLORS.forest
                : application.status === "Rejected"
                  ? "#b91c1c"
                  : COLORS.gold
        )
        .text(display(application.status), MARGIN, 165);

    doc.font("Helvetica")
        .fontSize(7.5)
        .fillColor(COLORS.muted)
        .text("SUBMITTED", MARGIN, 191);

    doc.font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(COLORS.ink)
        .text(formatDate(application.createdAt), MARGIN, 202);

    const photoX = PAGE_WIDTH - MARGIN - 90;
    const photoY = 110;

    if (photo) {
        doc.save();
        doc.roundedRect(photoX, photoY, 90, 110, 4).clip();
        doc.image(photo, photoX, photoY, {
            width: 90,
            height: 110,
            cover: [90, 110],
            align: "center",
            valign: "center",
        });
        doc.restore();
        doc.roundedRect(photoX, photoY, 90, 110, 4)
            .lineWidth(0.8)
            .strokeColor(COLORS.line)
            .stroke();
    } else {
        doc.roundedRect(photoX, photoY, 90, 110, 4)
            .lineWidth(0.8)
            .strokeColor(COLORS.line)
            .stroke();
        doc.font("Helvetica")
            .fontSize(8)
            .fillColor(COLORS.muted)
            .text("PASSPORT PHOTO", photoX, photoY + 48, {
                width: 90,
                align: "center",
            });
    }

    let y = 236;

    y = sectionTitle(doc, "Applicant details", y);
    y = field(doc, "Full name", fullName(application), MARGIN, y, CONTENT_WIDTH);
    y = fieldPair(
        doc,
        { label: "Gender", value: application.gender },
        { label: "Date of birth", value: formatDate(application.dateOfBirth) },
        y
    );
    y = fieldPair(
        doc,
        { label: "Phone", value: application.phone },
        { label: "Email", value: application.email },
        y
    );
    y = field(
        doc,
        "Home address",
        application.address,
        MARGIN,
        y,
        CONTENT_WIDTH,
        34
    );

    y = sectionTitle(doc, "Academic details", y);
    y = fieldPair(
        doc,
        { label: "Current level / class", value: application.currentLevel },
        { label: "Previous madrasa", value: application.previousMadrasa },
        y
    );

    y = sectionTitle(doc, "Parent / guardian", y);
    y = fieldPair(
        doc,
        { label: "Full name", value: application.parentName },
        { label: "Relationship", value: application.relationship },
        y
    );
    y = fieldPair(
        doc,
        { label: "Phone", value: application.parentPhone },
        { label: "Email", value: application.parentEmail },
        y
    );

    y = sectionTitle(doc, "Application & payment", y);
    y = fieldPair(
        doc,
        { label: "Payment status", value: application.paymentStatus },
        {
            label: "Payment method",
            value: application.paymentMethod || "Not recorded",
        },
        y
    );
    y = fieldPair(
        doc,
        { label: "Payment reference", value: application.paymentReference },
        {
            label: "Registration number",
            value: application.registrationNumber,
        },
        y
    );

    if (application.statusReason) {
        y = field(
            doc,
            "Office note",
            application.statusReason,
            MARGIN,
            y,
            CONTENT_WIDTH,
            34
        );
    }

    const footerY = 748;

    doc.moveTo(MARGIN, footerY)
        .lineTo(PAGE_WIDTH - MARGIN, footerY)
        .lineWidth(0.8)
        .strokeColor(COLORS.line)
        .stroke();

    doc.font("Helvetica")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
            "Present this form to the admissions office. Keep a copy for your records.",
            MARGIN,
            footerY + 10,
            { width: CONTENT_WIDTH - 140 }
        );

    doc.font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(COLORS.forest)
        .text(
            display(application.applicationNumber),
            MARGIN,
            footerY + 10,
            { width: CONTENT_WIDTH, align: "right" }
        );

    doc.end();

    return finished;
};
