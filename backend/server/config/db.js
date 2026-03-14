/* ============================================================
   DATABASE CONNECTION (server/config/db.js)
   Uses MongoMemoryServer when local MongoDB is unavailable
   ============================================================ */
const mongoose = require('mongoose');

let mongoServer = null;

const connectDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edunex_academy';

    // First try the configured URI
    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 3000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (err) {
        console.log(`⚠️  Could not connect to MongoDB at ${uri}`);
        console.log('   Falling back to in-memory MongoDB (MongoMemoryServer)...\n');
    }

    // Fallback: use MongoMemoryServer (no install needed)
    try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        const memUri = mongoServer.getUri();

        const conn = await mongoose.connect(memUri, {
            serverSelectionTimeoutMS: 5000,
        });

        console.log(`✅ MongoDB In-Memory Server running at: ${memUri}`);
        console.log('   ⚠️  Data is temporary and will be lost on restart.\n');
        return conn;
    } catch (memErr) {
        console.error(`❌ Failed to start in-memory MongoDB: ${memErr.message}`);
        console.error('   Install MongoDB locally or provide a valid MONGODB_URI in .env');
        process.exit(1);
    }
};

// Graceful shutdown helper
const closeDB = async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
};

module.exports = connectDB;
module.exports.closeDB = closeDB;
module.exports.isMemoryServer = () => mongoServer !== null;
