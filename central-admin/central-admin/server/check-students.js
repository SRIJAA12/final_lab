const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://srijaaanandhan12_db_user:122007@cluster0.2kzkkpe.mongodb.net/college-lab-registration';

const studentSchema = new mongoose.Schema({
  name: String,
  studentId: String,
  email: String,
  passwordHash: String,
  isPasswordSet: Boolean,
  registeredAt: Date
});

const Student = mongoose.model('Student', studentSchema);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB\n');
    
    // Check all students with these IDs
    const studentIds = ['715524104152', '715524104056', '715524104158'];
    
    console.log('=== CHECKING THESE STUDENT IDS ===');
    for (const id of studentIds) {
      const student = await Student.findOne({ studentId: id }).lean();
      if (student) {
        console.log(`✅ ${id} EXISTS`);
        console.log(`   Name: ${student.name}`);
        console.log(`   Email: ${student.email}`);
        console.log(`   isPasswordSet: ${student.isPasswordSet}`);
        console.log(`   Has passwordHash: ${student.passwordHash ? 'YES' : 'NO'}`);
        console.log(`   Registered: ${student.registeredAt}`);
      } else {
        console.log(`❌ ${id} DOES NOT EXIST`);
      }
      console.log('---');
    }
    
    // Also check recent students
    console.log('\n=== LAST 5 STUDENTS IN DATABASE ===');
    const recent = await Student.find().sort({ registeredAt: -1 }).limit(5).lean();
    recent.forEach(s => {
      console.log(`${s.studentId} - ${s.name} - isPasswordSet: ${s.isPasswordSet}`);
    });
    
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
