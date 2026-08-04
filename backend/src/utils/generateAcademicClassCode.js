
import AcademicClass from "../models/AcademicClass.js";

export const generateAcademicClassCode = async (
  sectionCode,
  level,
  sectionId
) => {
  // Count existing classes in the same section and level
  const count = await AcademicClass.countDocuments({
    section: sectionId,
    level,
  });

  // First class = 01, second = 02...
  const sequence = String(count + 1).padStart(2, "0");

  return `${sectionCode.toUpperCase()}${level}${sequence}`;
};