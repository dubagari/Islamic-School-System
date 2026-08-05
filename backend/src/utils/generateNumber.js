import Counter from "../models/Counter.js";

export const generateNumber = async (counterName, prefix) => {
  const counter = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { value: 1 } },
    {
      new: true,
      upsert: true,
    }
  );

const year = String(new Date().getFullYear()).slice(-2);

  const sequence = String(counter.value).padStart(5, "0");

  return `DU/${prefix}/${year}/${sequence}`;
};