const Wallet =
require("../models/Wallet");

const WalletTransaction =
require("../models/WalletTransaction");



const getWallet = async (
  req,
  res
) => {
  try {

    let wallet =
      await Wallet.findOne({
        userId: req.user._id,
      });

    if (!wallet) {

      wallet =
        await Wallet.create({
          userId: req.user._id,
        });

    }

    res.json({
      success: true,
      wallet,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


const getTransactions =
async (req, res) => {

  try {

    const transactions =
      await WalletTransaction
        .find({
          userId:
            req.user._id,
        })
        .sort({
          createdAt: -1,
        });

    res.json({
      success: true,
      transactions,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message:
        error.message,
    });

  }
};

module.exports = {
  getWallet,
  getTransactions,
};