const mongoose = require('mongoose');

// Session Schema
const sessionSchema = new mongoose.Schema({
  studentName: String,
  studentId: String,
  computerName: String,
  labId: String,
  systemNumber: String,
  ipAddress: String,
  loginTime: { type: Date, default: Date.now },
  logoutTime: Date,
  duration: Number,
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  screenshot: String
});

const Session = mongoose.model('Session', sessionSchema);

// Lab Session Schema
const labSessionSchema = new mongoose.Schema({
  labId: { type: String, required: true, default: 'CC1' },
  subject: { type: String, required: true },
  faculty: { type: String, required: true },
  year: { type: Number, required: false, default: 1 },
  department: { type: String, required: false, default: 'Computer Science' },
  section: { type: String, required: false, default: 'None' },
  periods: { type: Number, required: true },
  expectedDuration: { type: Number, required: true },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  createdBy: { type: String, default: 'admin' },
  studentRecords: [{
    studentName: String,
    studentId: String,
    email: String,
    systemNumber: String,
    loginTime: Date,
    logoutTime: Date,
    duration: Number,
    status: { type: String, enum: ['active', 'completed'], default: 'active' }
  }]
});

const LabSession = mongoose.model('LabSession', labSessionSchema);

async function debugSessions() {
  try {
    await mongoose.connect('mongodb+srv://srijaaanandhan12_db_user:122007@cluster0.2kzkkpe.mongodb.net/college-lab-registration?retryWrites=true&w=majority');
    console.log('Connected to DB');
    
    // Check if there are any sessions at all
    const totalSessions = await Session.countDocuments();
    console.log('Total sessions in DB:', totalSessions);
    
    // Check for sessions on the date from CSV
    const sessionDate = new Date('2026-04-27');
    const nextDay = new Date('2026-04-28');
    
    const sessionsOnDate = await Session.find({
      loginTime: { $gte: sessionDate, $lt: nextDay }
    }).limit(5);
    
    console.log('Sessions on 2026-04-27:', sessionsOnDate.length);
    sessionsOnDate.forEach(s => {
      console.log('  -', s.studentName, s.studentId, s.labId, s.loginTime);
    });
    
    // Check lab sessions
    const labSessions = await LabSession.find({
      startTime: { $gte: sessionDate, $lt: nextDay }
    });
    
    console.log('Lab sessions on 2026-04-27:', labSessions.length);
    labSessions.forEach(ls => {
      console.log('  -', ls.subject, ls.labId, ls.startTime, ls.studentRecords.length);
    });
    
    // Check all lab sessions
    const allLabSessions = await LabSession.find().limit(3);
    console.log('All lab sessions (limit 3):');
    allLabSessions.forEach(ls => {
      console.log('  -', ls.subject, ls.labId, ls.startTime, ls.status);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('DB error:', err);
    process.exit(1);
  }
}

debugSessions();
