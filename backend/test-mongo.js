// test-mongo.js
const mongoose = require('mongoose');

const uri = "mongodb://edunexlearn_db_user:z5xwgvDqALzRACoy@ac-wj6sy3m-shard-00-00.f3xhp2a.mongodb.net:27017,ac-wj6sy3m-shard-00-01.f3xhp2a.mongodb.net:27017,ac-wj6sy3m-shard-00-02.f3xhp2a.mongodb.net:27017/edunex_academy?ssl=true&replicaSet=atlas-hkdmbm-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

console.log("Connecting to standard MongoDB URI...");

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("✅ Connection Successful!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Connection Failed!");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    process.exit(1);
  });
