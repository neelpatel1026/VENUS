const User = require("../models/User");

/**
 * Add New Address
 * POST /api/address/add
 */
const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      placeId,
      lat,
      lng,
      formattedAddress,
      deliveryZone,
      isDefault,
    } = req.body;

    // Validation checks
    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode || !country) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Phone format validation (simple check)
    if (!/^\d{10,15}$/.test(phone.replace(/[\s-+()]/g, ""))) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number",
      });
    }

    // Indian Pincode format checking if country is India
    if (country.toLowerCase() === "india" && !/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit Indian pincode",
      });
    }

    // Coordinate validation
    let validLat = undefined;
    let validLng = undefined;
    if (lat !== undefined && lng !== undefined) {
      validLat = parseFloat(lat);
      validLng = parseFloat(lng);
      if (isNaN(validLat) || isNaN(validLng) || validLat < -90 || validLat > 90 || validLng < -180 || validLng > 180) {
        return res.status(400).json({
          success: false,
          message: "Invalid geographical coordinates provided",
        });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check duplicates: prevent duplicate address entries (same house, street, pincode)
    const isDuplicate = user.addresses.some(
      (addr) =>
        addr.addressLine1.toLowerCase().trim() === addressLine1.toLowerCase().trim() &&
        addr.pincode.trim() === pincode.trim() &&
        addr.fullName.toLowerCase().trim() === fullName.toLowerCase().trim()
    );

    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: "This address has already been saved to your profile",
      });
    }

    // Set Default Address Logic: First address is always default
    const isFirstAddress = user.addresses.length === 0;
    const finalIsDefault = isFirstAddress ? true : !!isDefault;

    if (finalIsDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddressObj = {
      label: label || "Home",
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || "",
      city,
      state,
      pincode: pincode.trim(),
      country: country || "India",
      placeId: placeId || "",
      lat: validLat,
      lng: validLng,
      formattedAddress: formattedAddress || "",
      deliveryZone: deliveryZone || "Zone A",
      isDefault: finalIsDefault,
      isVerified: !!placeId,
    };

    user.addresses.push(newAddressObj);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Add Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * Get All Addresses
 * GET /api/address
 */
const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("addresses");

    res.status(200).json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (error) {
    console.error("Get Addresses Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * Update Address
 * PUT /api/address/:id
 */
const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country,
      placeId,
      lat,
      lng,
      formattedAddress,
      deliveryZone,
      isDefault,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Validation checks
    if (phone) {
      if (!/^\d{10,15}$/.test(phone.replace(/[\s-+()]/g, ""))) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid phone number",
        });
      }
    }

    if (pincode && country) {
      if (country.toLowerCase() === "india" && !/^\d{6}$/.test(pincode.trim())) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 6-digit Indian pincode",
        });
      }
    }

    if (lat !== undefined && lng !== undefined) {
      const validLat = parseFloat(lat);
      const validLng = parseFloat(lng);
      if (isNaN(validLat) || isNaN(validLng) || validLat < -90 || validLat > 90 || validLng < -180 || validLng > 180) {
        return res.status(400).json({
          success: false,
          message: "Invalid geographical coordinates",
        });
      }
    }

    // Default address update logic
    if (isDefault) {
      user.addresses.forEach((addr) => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    // Update keys
    if (label) address.label = label;
    if (fullName) address.fullName = fullName;
    if (phone) address.phone = phone;
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode.trim();
    if (country) address.country = country;
    if (placeId !== undefined) address.placeId = placeId;
    if (lat !== undefined) address.lat = parseFloat(lat);
    if (lng !== undefined) address.lng = parseFloat(lng);
    if (formattedAddress !== undefined) address.formattedAddress = formattedAddress;
    if (deliveryZone !== undefined) address.deliveryZone = deliveryZone;
    if (isDefault !== undefined) address.isDefault = !!isDefault;
    if (placeId) address.isVerified = true;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Update Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * Delete Address
 * DELETE /api/address/:id
 */
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = address.isDefault;
    address.deleteOne();
    await user.save();

    // If we deleted the default address, and we still have other addresses, make the first one default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Delete Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
};