import mongoose from "mongoose";
import AcademicClass from "../models/AcademicClass.js";
import AcademicSection from "../models/AcademicSection.js";

import { generateAcademicClassCode } from "../utils/generateAcademicClassCode.js";
import { formatTitle } from "../utils/formatTitle.js";

export const createAcademicClassService = async (classData) => {
  // Validate section ObjectId
  if (!mongoose.Types.ObjectId.isValid(classData.section)) {
    throw new Error("Invalid academic section ID.");
  }

  // Check section exists
  const section = await AcademicSection.findById(classData.section);

  if (!section) {
    throw new Error("Academic section not found.");
  }

  // Format class name
  const formattedName = formatTitle(classData.name);

  // Check duplicate class name in same section
  const existingName = await AcademicClass.findOne({
    section: classData.section,
    name: formattedName,
  });

  if (existingName) {
    throw new Error("Academic class already exists in this section.");
  }

  // Check duplicate level
  const existingLevel = await AcademicClass.findOne({
    section: classData.section,
    level: classData.level,
  });

  if (existingLevel) {
    throw new Error("Level already exists in this academic section.");
  }

  // Capacity validation
  if (classData.capacity <= 0) {
    throw new Error("Capacity must be greater than zero.");
  }

  // Display Order
  const displayOrder =
    classData.displayOrder ?? classData.level;

  const existingDisplayOrder = await AcademicClass.findOne({
    section: classData.section,
    displayOrder,
  });

  if (existingDisplayOrder) {
    throw new Error("Display order already exists in this academic section.");
  }

  // Generate or use custom code
  let classCode;

  if (classData.code) {
    classCode = classData.code.trim().toUpperCase();
  } else {
    classCode = await generateAcademicClassCode(
      section.code,
      classData.level,
      classData.section
    );
  }

  // Check code uniqueness
  const existingCode = await AcademicClass.findOne({
    code: classCode,
  });

  if (existingCode) {
    throw new Error("Academic class code already exists.");
  }

  // Create class
  return await AcademicClass.create({
    section: classData.section,
    name: formattedName,
    code: classCode,
    level: classData.level,
    capacity: classData.capacity,
    description: classData.description || "",
    displayOrder,
    isActive: true,
  });
};


export const getAcademicClassesService = async () => {
    return await AcademicClass.find()
        .populate("section", "name code")
        .sort({ displayOrder: 1 });
};