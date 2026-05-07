const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://srijaaanandhan12_db_user:122007@cluster0.2kzkkpe.mongodb.net/college-lab-registration';

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String },
  dateOfBirth: { type: Date, required: true },
  department: { type: String, required: true },
  section: { type: String, default: 'A' },
  year: { type: Number, required: true },
  labId: { type: String, default: 'CC1' },
  isPasswordSet: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

const students = [
  {
    studentId: 'CS2025001',
    name: 'John Doe',
    email: 'john.doe@college.edu',
    dateOfBirth: new Date('2000-01-15'),
    department: 'Computer Science and Engineering',
    section: 'A',
    year: 3,
    labId: 'CC1',
    isPasswordSet: false
  },
  {
    studentId: 'CS2025002',
    name: 'Jane Smith',
    email: 'jane.smith@college.edu',
    dateOfBirth: new Date('2000-05-20'),
    department: 'Computer Science and Engineering',
    section: 'B',
    year: 3,
    labId: 'CC1',
    isPasswordSet: false
  },
  {
    studentId: 'ECE2025001',
    name: 'Bob Johnson',
    email: 'bob.johnson@college.edu',
    dateOfBirth: new Date('1999-12-10'),
    department: 'Electronics and Communication Engineering',
    section: 'A',
    year: 3,
    labId: 'CC1',
    isPasswordSet: false
  },
  {
    studentId: 'ME2025001',
    name: 'Alice Williams',
    email: 'alice.williams@college.edu',
    dateOfBirth: new Date('2000-03-25'),
    department: 'Mechanical Engineering',
    section: 'A',
    year: 2,
    labId: 'CC1',
    isPasswordSet: false
  }
];

async function addStudents() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    for (const studentData of students) {
      try {
        // Check if student exists
        const existing = await Student.findOne({ 
          $or: [
            { studentId: studentData.studentId },
            { email: studentData.email }
          ]
        });
        
        if (existing) {
          console.log(`⚠️ Skipping ${studentData.studentId} - already exists`);
          continue;
        }
        
        const student = new Student(studentData);
        await student.save();
        console.log(`✅ Added: ${studentData.studentId} - ${studentData.name}`);
      } catch (error) {
        console.error(`❌ Failed to add ${studentData.studentId}:`, error.message);
      }
    }
    
    // Show final count
    const count = await Student.countDocuments();
    console.log(`\n📊 Total students in database: ${count}`);
    
    const all = await Student.find().sort({ createdAt: -1 });
    console.log('\n📋 All students:');
    all.forEach((s, i) => {
      console.log(`  ${i+1}. ${s.studentId} - ${s.name} - ${s.email}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

addStudents();
