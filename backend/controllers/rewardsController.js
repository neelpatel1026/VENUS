const User = require("../models/User");

// @desc    Get user rewards summary and balance details
// @route   GET /api/rewards/wallet
// @access  Private
const getUserWalletDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      walletBalance: user.walletBalance || 0,
      totalEarned: user.totalEarned || 0,
      totalRedeemed: user.totalRedeemed || 0,
      isWalletFrozen: user.isWalletFrozen || false,
      transactions: user.rewardTransactions || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Adjust user coin balance (Admin)
// @route   POST /api/rewards/admin/adjust
// @access  Private/Admin
const adjustUserCoins = async (req, res) => {
  try {
    const { userId, transactionType, coins, description } = req.body;
    
    if (!userId || !transactionType || typeof coins !== "number" || coins <= 0) {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Safety checks
    if (transactionType === "Used" && user.walletBalance < coins) {
      return res.status(400).json({ success: false, message: "Insufficient coins balance" });
    }

    let netChange = 0;
    if (transactionType === "Earned" || transactionType === "Refund Reversal") {
      netChange = coins;
      user.totalEarned += coins;
    } else if (transactionType === "Used" || transactionType === "Expired") {
      netChange = -coins;
      user.totalRedeemed += coins;
    } else if (transactionType === "Adjusted") {
      // Net change handled inside body
      netChange = req.body.netChange || 0;
      if (netChange > 0) user.totalEarned += netChange;
      else user.totalRedeemed += Math.abs(netChange);
    }

    user.walletBalance = Math.max(0, user.walletBalance + netChange);
    user.rewardTransactions.push({
      transactionType,
      coins,
      description: description || "Admin adjustments",
      adminName: req.user ? req.user.name : "Admin",
      createdAt: new Date()
    });

    await user.save();
    res.json({ success: true, message: "Coins adjusted successfully", walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Freeze User Wallet
// @route   POST /api/rewards/admin/freeze
// @access  Private/Admin
const freezeUserWallet = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(userId, { isWalletFrozen: true }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "Wallet frozen successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unfreeze User Wallet
// @route   POST /api/rewards/admin/unfreeze
// @access  Private/Admin
const unfreezeUserWallet = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(userId, { isWalletFrozen: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "Wallet unfrozen successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin rewards general dashboard summary statistics
// @route   GET /api/rewards/admin/dashboard
// @access  Private/Admin
const getAdminRewardsDashboard = async (req, res) => {
  try {
    const allUsers = await User.find({ role: "user" });
    
    let totalCoinsIssued = 0;
    let totalCoinsRedeemed = 0;
    let totalCoinsExpired = 0;
    let totalLiability = 0;

    allUsers.forEach(u => {
      totalLiability += (u.walletBalance || 0);
      totalCoinsIssued += (u.totalEarned || 0);
      totalCoinsRedeemed += (u.totalRedeemed || 0);

      // Sum expired items
      if (u.rewardTransactions) {
        u.rewardTransactions.forEach(t => {
          if (t.transactionType === "Expired") totalCoinsExpired += t.coins;
        });
      }
    });

    const topCustomers = [...allUsers]
      .sort((a, b) => (b.walletBalance || 0) - (a.walletBalance || 0))
      .slice(0, 5)
      .map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        walletBalance: u.walletBalance || 0,
        totalEarned: u.totalEarned || 0
      }));

    res.json({
      success: true,
      totalCoinsIssued,
      totalCoinsRedeemed,
      totalCoinsExpired,
      totalLiability,
      topCustomers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserWalletDetails,
  adjustUserCoins,
  freezeUserWallet,
  unfreezeUserWallet,
  getAdminRewardsDashboard
};
