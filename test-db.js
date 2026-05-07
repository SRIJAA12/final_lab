require('dotenv').config();
const mongoose = require('mongoose');

async function testDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if database has any collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📊 Collections in database:', collections.map(c => c.name));
    
    // Check Session collection
    const sessionCount = await db.collection('sessions').countDocuments();
    console.log('📊 Total sessions:', sessionCount);
    
    // Check LabSession collection  
    const labSessionCount = await db.collection('labsessions').countDocuments();
    console.log('📊 Total lab sessions:', labSessionCount);
    
    // Get some recent sessions
    const recentSessions = await db.collection('sessions').find({}).limit(3).toArray();
    console.log('📊 Recent sessions:');
    recentSessions.forEach(s => {
      console.log('  -', s.studentName, s.studentId, s.loginTime);
    });
    
    // Get lab sessions on April 27, 2026
    const sessionDate = new Date('2026-04-27');
    const nextDay = new Date('2026-04-28');
    
    const labSessionsOnDate = await db.collection('labsessions').find({
      startTime: { $gte: sessionDate, $lt: nextDay }
    }).toArray();
    
    console.log('📊 Lab sessions on April 27, 2026:', labSessionsOnDate.length);
    labSessionsOnDate.forEach(ls => {
      console.log('  -', ls.subject, ls.labId, ls.startTime, ls.studentRecords?.length || 0);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

testDB();
