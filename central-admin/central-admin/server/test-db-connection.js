// 🧪 Database Connection Test
// Run this to verify your MongoDB connection is working

const mongoose = require('mongoose');

// MongoDB Atlas connection string (same as in app.js)
const MONGODB_URI = 'mongodb+srv://srijaaanandhan12_db_user:122007@cluster0.2kzkkpe.mongodb.net/college-lab-registration?retryWrites=true&w=majority';

console.log('🔄 Testing MongoDB Atlas connection...\n');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
  .then(async () => {
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Database Name:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('');

    // Define a simple student schema to query
    const Student = mongoose.model('Student', new mongoose.Schema({
      name: String,
      admissionNumber: String,
      email: String
    }), 'students');

    // Count students
    const studentCount = await Student.countDocuments();
    console.log(`👥 Total Students: ${studentCount}`);

    if (studentCount > 0) {
      // Show first 3 students as examples
      const sampleStudents = await Student.find().limit(3).select('name admissionNumber email');
      console.log('\n📋 Sample Students:');
      sampleStudents.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (${student.admissionNumber})`);
      });
    }

    // Check other collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Available Collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    console.log('\n✅ Database is working correctly!');
    console.log('✅ You are connected to the SHARED database');
    console.log('✅ Any changes you make will be visible to all team members\n');

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection Failed!');
    console.error('Error:', err.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify MongoDB Atlas cluster is running');
    console.error('   3. Check if your IP is whitelisted in MongoDB Atlas');
    console.error('   4. Verify the connection string is correct\n');
    process.exit(1);
  });
