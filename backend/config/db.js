// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI);
//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`Error: ${error.message}`);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const rawUri = process.env.MONGO_URI || "";
    const cleanUri = rawUri.trim().replace(/^["']|["']$/g, '');

    if (!cleanUri) {
      throw new Error("MONGO_URI is missing or empty");
    }

    const conn = await mongoose.connect(cleanUri, {
      maxPoolSize: 100,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(
      `MongoDB Connected: ${conn.connection.host}`
    );

  } catch (error) {
    console.error(
      `Database Error: ${error.message}`
    );
    process.exit(1);
  }
};

module.exports = connectDB;

