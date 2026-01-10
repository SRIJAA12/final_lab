// Test forgot password functionality
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://srijaaanandhan12_db_user:122007@cluster0.2kzkkpe.mongodb.net/college-lab-registration?retryWrites=true&w=majority';

// Student Schema
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String },
  isPasswordSet: { type: Boolean, default: false },
  dateOfBirth: { type: Date, required: true },
  registerNumber: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  section: { type: String, required: true },
  labId: { type: String, required: true },
  systemNumber: { type: Number, required: true }
});

const Student = mongoose.model('Student', studentSchema);

// OTP Schema
const otpSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }
});

const OTP = mongoose.model('OTP', otpSchema);

async function testForgotPasswordFeature() {
  try {
    console.log('🔍 Testing Forgot Password Feature...\n');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Check email configuration
    console.log('📧 CHECKING EMAIL CONFIGURATION...');
    console.log('----------------------------------');
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;

    if (!emailUser || !emailPass) {
      console.log('❌ EMAIL NOT CONFIGURED!');
      console.log('   Missing: EMAIL_USER and/or EMAIL_PASS in .env file');
      console.log('\n   This means:');
      console.log('   ✓ OTPs will be logged to console instead of emailed');
      console.log('   ✓ You need to copy OTP from server logs');
      console.log('   ✓ This is OK for testing, but not for production');
      console.log('\n   To fix: Add to .env file:');
      console.log('   EMAIL_HOST=smtp.gmail.com');
      console.log('   EMAIL_PORT=587');
      console.log('   EMAIL_USER=your-email@gmail.com');
      console.log('   EMAIL_PASS=your-app-password');
    } else {
      console.log('✅ Email is configured');
      console.log(`   Host: ${emailHost || 'Not set (default smtp.gmail.com)'}`);
      console.log(`   Port: ${emailPort || 'Not set (default 587)'}`);
      console.log(`   User: ${emailUser}`);
      console.log(`   Pass: ${emailPass ? '***configured***' : 'Not set'}`);
    }
    console.log('');

    // Check students with password set
    console.log('👥 CHECKING STUDENTS WITH PASSWORDS...');
    console.log('--------------------------------------');
    const studentsWithPassword = await Student.find({ 
      passwordHash: { $exists: true, $ne: null } 
    }).select('studentId name email isPasswordSet');

    console.log(`Total students with password: ${studentsWithPassword.length}\n`);
    
    studentsWithPassword.forEach(student => {
      console.log(`  ${student.studentId} - ${student.name}`);
      console.log(`    Email: ${student.email}`);
      console.log(`    Password Set Flag: ${student.isPasswordSet}`);
      console.log('');
    });

    // Check TSI student specifically
    console.log('🔍 CHECKING TSI STUDENT (subhahrini)...');
    console.log('---------------------------------------');
    const tsiStudent = await Student.findOne({
      $or: [
        { studentId: /^TSI/i },
        { name: /subhahrini/i }
      ]
    });

    if (!tsiStudent) {
      console.log('❌ TSI STUDENT NOT FOUND!');
      console.log('\n   REASONS FOR LOGIN FAILURE:');
      console.log('   1. Student was not successfully saved to database');
      console.log('   2. There was an error during student creation');
      console.log('   3. Student ID format might be wrong');
      console.log('\n   SOLUTION:');
      console.log('   1. Open student-management-system.html');
      console.log('   2. Re-add the student with ALL required fields');
      console.log('   3. Make sure Student ID starts with TSI (e.g., TSI001)');
      console.log('   4. Enter a valid email address');
      console.log('   5. Set a password');
    } else {
      console.log('✅ TSI STUDENT FOUND:');
      console.log(`   Name: ${tsiStudent.name}`);
      console.log(`   Student ID: ${tsiStudent.studentId}`);
      console.log(`   Email: ${tsiStudent.email}`);
      console.log(`   Password Set: ${tsiStudent.passwordHash ? 'YES ✅' : 'NO ❌'}`);
      console.log(`   Password Set Flag: ${tsiStudent.isPasswordSet}`);
      console.log(`   Department: ${tsiStudent.department}`);
      console.log(`   Year: ${tsiStudent.year}`);
      console.log(`   System: ${tsiStudent.systemNumber}`);
      
      if (!tsiStudent.passwordHash) {
        console.log('\n❌ LOGIN FAILURE REASON: No password set!');
        console.log('   This is why the account is not working!');
      }

      if (!tsiStudent.isPasswordSet) {
        console.log('\n⚠️ Password flag is false - student needs first-time sign-in');
      }

      if (!tsiStudent.email || !tsiStudent.email.includes('@')) {
        console.log('\n❌ FORGOT PASSWORD FAILURE REASON: Invalid email!');
        console.log('   Email must be in valid format for OTP delivery');
      }
    }
    console.log('');

    // Check recent OTP records
    console.log('📨 CHECKING RECENT OTP RECORDS...');
    console.log('---------------------------------');
    const recentOTPs = await OTP.find({}).sort({ createdAt: -1 }).limit(10);
    
    if (recentOTPs.length === 0) {
      console.log('No OTP records found (may have expired)');
    } else {
      console.log(`Found ${recentOTPs.length} recent OTP(s):\n`);
      recentOTPs.forEach((otp, i) => {
        const ageMinutes = Math.floor((Date.now() - otp.createdAt) / 60000);
        console.log(`  ${i+1}. Student ID: ${otp.studentId}`);
        console.log(`     Email: ${otp.email}`);
        console.log(`     OTP: ${otp.otp}`);
        console.log(`     Created: ${ageMinutes} minutes ago`);
        console.log('');
      });
    }

    // Summary of issues
    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSTIC SUMMARY');
    console.log('='.repeat(60));
    
    if (!tsiStudent) {
      console.log('❌ CRITICAL: TSI student not in database');
      console.log('   → Re-add student through student-management-system.html');
    } else if (!tsiStudent.passwordHash) {
      console.log('❌ CRITICAL: TSI student has no password');
      console.log('   → Use first-time sign-in OR set password manually');
    } else {
      console.log('✅ TSI student exists with password');
    }

    if (!emailUser || !emailPass) {
      console.log('⚠️  WARNING: Email not configured');
      console.log('   → OTPs will appear in server console logs');
      console.log('   → For production, configure email in .env');
    } else {
      console.log('✅ Email configured');
    }

    console.log('\n' + '='.repeat(60));
    console.log('NEXT STEPS:');
    console.log('='.repeat(60));
    console.log('1. If TSI student not found: Re-add in student-management-system.html');
    console.log('2. If no password: Use first-time sign-in to set password');
    console.log('3. For forgot password: Check server console logs for OTP');
    console.log('4. To configure email: Add SMTP settings to .env file');
    console.log('5. Test login with correct credentials');

    await mongoose.disconnect();
    console.log('\n✅ Diagnostic complete');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testForgotPasswordFeature();
