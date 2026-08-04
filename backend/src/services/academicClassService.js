import AcademicClass from "../models/AcademicClass.js";
import AcademicSection from "../models/AcademicSection.js";

export const createAcademicClassService = async (classData) => {

  // Check if the academic section exists
  const section = await AcademicSection.findById(classData.section);

  if (!section) {
    throw new Error("Academic section not found.");
  }

  // Check if class code already exists
  const existingCode = await AcademicClass.findOne({
    code: classData.code.toUpperCase(),
  });

  if (existingCode) {
    throw new Error("Academic class code already exists.");
  }

  // Check if class name already exists in this section
  const existingName = await AcademicClass.findOne({
    section: classData.section,
    name: classData.name,
  });

  if (existingName) {
    throw new Error("Academic class already exists in this section.");
  }

  // Check if level already exists in this section
  const existingLevel = await AcademicClass.findOne({
    section: classData.section,
    level: classData.level,
  });

  if (existingLevel) {
    throw new Error("Level already exists in this academic section.");
  }

  // Check display order
  const existingDisplayOrder = await AcademicClass.findOne({
    section: classData.section,
    displayOrder: classData.displayOrder,
  });

  if (existingDisplayOrder) {
    throw new Error("Display order already exists in this academic section.");
  }

  // Validate capacity
  if (classData.capacity <= 0) {
    throw new Error("Capacity must be greater than zero.");
  }

  return await AcademicClass.create({
    ...classData,
    code: classData.code.toUpperCase(),
  });
};