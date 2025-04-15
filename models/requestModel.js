import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    schoolName: { type: String, required: true },
    message: { type: String },
    classStandard: { type: String, enum: ["10th", "12th"], required: true },
    date: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

const Request = mongoose.model("Request", requestSchema);
export default Request;
