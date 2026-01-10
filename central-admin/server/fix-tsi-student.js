// Script to check and fix TSI student account
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://srijaaanandhan12_db_user:122007@cluster0.2kzkkpe.mongodb.net/college-lab-registration?retryWrites=true&w=majority';

// Student Schema (must match app.js)
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String },
  dateOfBirth: { type: Date, required: true },
  registerNumber: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  section: { type: String, required: true },
  labId: { type: String, required: true },
  systemNumber: { type: Number, required: true },
  macAddress: { type: String },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

async function checkAndFixTSIStudent() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Search for student with TSI in studentId or name containing 'subhahrini'
    console.log('🔍 Searching for TSI student (subhahrini)...\n');
    
    const tsiStudents = await Student.find({
      $or: [
        { studentId: /^TSI/i },
        { name: /subhahrini/i }
      ]
    });

    if (tsiStudents.length === 0) {
      console.log('❌ NO TSI STUDENT FOUND!');
      console.log('\n📝 ISSUE: Student "subhahrini" was not properly saved to database');
      console.log('\n🔧 SOLUTION: Re-add the student using student-management-system.html');
      console.log('   Make sure to:');
      console.log('   1. Fill ALL required fields');
      console.log('   2. Use correct Student ID format (e.g., TSI001)');
      console.log('   3. Enter valid email address');
      console.log('   4. Set a password');
      console.log('   5. Click "Add Student" button');
      process.exit(1);
    }

    console.log(`✅ Found ${tsiStudents.length} TSI student(s):\n`);
    
    tsiStudents.forEach((student, index) => {
      console.log(`--- Student ${index + 1} ---`);
      console.log(`Name: ${student.name}`);
      console.log(`Student ID: ${student.studentId}`);
      console.log(`Email: ${student.email}`);
      console.log(`Password Hash Exists: ${student.passwordHash ? 'YES ✅' : 'NO ❌'}`);
      console.log(`Department: ${student.department}`);
      console.log(`Year: ${student.year}`);
      console.log(`Section: ${student.section}`);
      console.log(`Lab ID: ${student.labId}`);
      console.log(`System Number: ${student.systemNumber}`);
      console.log(`Register Number: ${student.registerNumber}`);
      console.log(`Date of Birth: ${student.dateOfBirth}`);
      console.log(`Created At: ${student.createdAt}`);
      console.log('');

      // Check for issues
      if (!student.passwordHash) {
        console.log('⚠️ WARNING: No password set! This is why login is failing!');
        console.log('   FIX: Reset password using forgot password feature OR re-add student\n');
      }

      if (!student.email || !student.email.includes('@')) {
        console.log('⚠️ WARNING: Invalid email! This will break forgot password!');
        console.log('   FIX: Update email to a valid format\n');
      }
    });

    // Check all students to see if there are login issues
    console.log('\n📊 CHECKING ALL STUDENTS FOR COMMON ISSUES...\n');
    const allStudents = await Student.find({});
    console.log(`Total students in database: ${allStudents.length}`);
    
    let studentsWithoutPassword = 0;
    let studentsWithInvalidEmail = 0;

    allStudents.forEach(student => {
      if (!student.passwordHash) studentsWithoutPassword++;
      if (!student.email || !student.email.includes('@')) studentsWithInvalidEmail++;
    });

    console.log(`Students without password: ${studentsWithoutPassword}`);
    console.log(`Students with invalid email: ${studentsWithInvalidEmail}`);

    // Offer to fix the TSI student
    const tsiStudent = tsiStudents[0];
    if (tsiStudent && !tsiStudent.passwordHash) {
      console.log('\n\n🔧 ATTEMPTING AUTO-FIX...');
      console.log('Setting default password "password123" for testing...');
      
      const defaultPassword = 'password123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      await Student.updateOne(
        { _id: tsiStudent._id },
        { $set: { passwordHash: hashedPassword } }
      );

      console.log('✅ Password has been set!');
      console.log(`\n🔐 TEST CREDENTIALS:`);
      console.log(`   Student ID: ${tsiStudent.studentId}`);
      console.log(`   Password: ${defaultPassword}`);
      console.log(`\n⚠️ IMPORTANT: Change this password after successful login!`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Database check complete');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

checkAndFixTSIStudent();
