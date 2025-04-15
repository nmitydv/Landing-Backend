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
  const { date, year, classStandard } = req.query;

  const filter = {};

  // Filter by exact date (yyyy-mm-dd)
  if (date) {
    const parsedDate = new Date(date);
    const nextDay = new Date(parsedDate);
    nextDay.setDate(parsedDate.getDate() + 1);
  
    filter.date = {
      $gte: parsedDate,
      $lt: nextDay,
    };
  }

  // Filter by year only (yyyy)
  if (year && !date) {
    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${parseInt(year) + 1}-01-01`);

    filter.date = {
      $gte: startOfYear,
      $lt: endOfYear,
    };
  }

  // Filter by classStandard
  if (classStandard) filter.classStandard = classStandard;

  try {
    const requests = await Request.find(filter);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching filtered requests', error: err.message });
  }
};
