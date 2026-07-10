const Complaint = require("../models/Complaint");

// @desc    Create new customer complaint / ticket
// @route   POST /api/complaints
// @access  Public (Optional Auth)
const createComplaint = async (req, res) => {
  try {
    const { name, email, phone, subject, category, orderNumber, message } = req.body;

    if (!name || !email || !phone || !subject || !category || !message) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Message must be at least 10 characters long",
      });
    }

    // Link user if authenticated
    const userId = req.user ? req.user._id : null;

    const complaint = await Complaint.create({
      userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      category,
      orderNumber: orderNumber ? orderNumber.trim() : "",
      message: message.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get logged in user's complaints
// @route   GET /api/complaints/my
// @access  Private
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      complaints,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get complaint details by ID
// @route   GET /api/complaints/:id
// @access  Private (Owner or Admin)
const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint ticket not found",
      });
    }

    // Auth check: Admin can view all. User can only view their own.
    const isAdmin = req.user && req.user.role === "admin";
    const isOwner = req.user && complaint.userId && complaint.userId.toString() === req.user._id.toString();

    // Also support checking guest ticket by email match if user is logged in
    const isEmailMatch = req.user && complaint.email.toLowerCase() === req.user.email.toLowerCase();

    if (!isAdmin && !isOwner && !isEmailMatch) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this ticket",
      });
    }

    res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all complaints (Admin search, filter, pagination)
// @route   GET /api/complaints
// @access  Private/Admin
const getAdminComplaints = async (req, res) => {
  try {
    const { search, status, priority, category, sort } = req.query;

    const query = {};

    // Filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    // Search
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { subject: searchRegex },
        { orderNumber: searchRegex },
      ];

      // Handle query matching MongoDB ObjectId string directly for ID search
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: search });
      }
    }

    // Sort
    let sortOptions = { createdAt: -1 }; // default newest
    if (sort === "oldest") {
      sortOptions = { createdAt: 1 };
    }

    const complaints = await Complaint.find(query).sort(sortOptions);

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update complaint details (Status, Priority, Internal Notes, Reply)
// @route   PUT /api/complaints/:id
// @access  Private/Admin
const updateComplaintAdmin = async (req, res) => {
  try {
    const { status, priority, adminReply, internalNotes } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;
    if (adminReply !== undefined) complaint.adminReply = adminReply;
    if (internalNotes !== undefined) complaint.internalNotes = internalNotes;

    const updatedComplaint = await complaint.save();

    res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      complaint: updatedComplaint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAdminComplaints,
  updateComplaintAdmin,
};
