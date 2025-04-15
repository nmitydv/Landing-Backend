import Request from "../models/requestModel.js";

// Get All Requests
export const getAllRequests = async (req, res) => {
  const requests = await Request.find({});
  res.json(requests);
};

// Add New Request
export const addRequest = async (req, res) => {
  const {
    fullName,
    email,
    mobileNumber,
    schoolName,
    message,
    classStandard,
    date,
  } = req.body;

  const request = new Request({
    fullName,
    email,
    mobileNumber,
    schoolName,
    message,
    classStandard,
    date,
    createdBy: req.user?._id, // optional if not using auth
  });

  const savedRequest = await request.save();
  res.status(201).json(savedRequest);
};

// Delete Request
export const deleteRequest = async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) return res.status(404).json({ message: "Request not found" });

  await request.deleteOne();
  res.json({ message: "Request deleted" });
};

// Filter Requests by date and class
export const filterRequests = async (req, res) => {
  const { date, classStandard } = req.query;

  const filter = {};
  if (date) filter.date = date;
  if (classStandard) filter.classStandard = classStandard;

  const requests = await Request.find(filter);
  res.json(requests);
};