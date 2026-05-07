const fs = require('fs').promises;
const path = require('path');

// Simulate the session report generation with CSV fallback
async function testSessionReport() {
  try {
    console.log('🧪 Testing session report generation...');
    
    // Create a mock lab session object (simulating what would come from database)
    const mockLabSession = {
      _id: 'test-session-123',
      labId: 'CC1',
      subject: 'ds',
      faculty: 'ww',
      year: 1,
      department: 'Computer Science',
      section: 'A',
      periods: 2,
      expectedDuration: 100,
      startTime: new Date('2025-12-04T09:00:00'), // Use existing CSV date
      endTime: new Date('2025-12-04T10:30:00'),
      status: 'completed',
      studentRecords: [] // Empty to test CSV fallback
    };
    
    console.log('📊 Mock Lab Session:');
    console.log('   Subject:', mockLabSession.subject);
    console.log('   Faculty:', mockLabSession.faculty);
    console.log('   Date:', mockLabSession.startTime.toISOString().split('T')[0]);
    
    // Test CSV fallback function
    const sessions = await getSessionsFromCSV(mockLabSession);
    console.log(`📊 CSV fallback returned ${sessions.length} sessions`);
    
    if (sessions.length > 0) {
      console.log('✅ Sample sessions from CSV:');
      sessions.slice(0, 3).forEach((s, i) => {
        console.log(`   ${i+1}. ${s.studentName} (${s.studentId}) - ${s.systemNumber}`);
      });
    } else {
      console.log('⚠️ No sessions found in CSV files');
      
      // Check what CSV files are available
      const csvDir = path.join(__dirname, 'central-admin/central-admin/server/session-csvs');
      if (fs.existsSync(csvDir)) {
        const files = await fs.readdir(csvDir);
        const csvFiles = files.filter(f => f.endsWith('.csv'));
        console.log('📂 Available CSV files:');
        csvFiles.slice(0, 5).forEach(f => {
          console.log('   -', f);
        });
        
        // Try to read the first CSV file to see its format
        if (csvFiles.length > 0) {
          const firstCsv = path.join(csvDir, csvFiles[0]);
          const content = await fs.readFile(firstCsv, 'utf8');
          const lines = content.split('\n').filter(l => l.trim());
          console.log(`📄 ${csvFiles[0]} has ${lines.length} lines`);
          if (lines.length > 1) {
            console.log('📄 Sample data:', lines[1].substring(0, 100));
          }
        }
      }
    }
    
    console.log('✅ Session report test completed');
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Copy of CSV fallback function from app.js
async function getSessionsFromCSV(labSession) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Build CSV filename based on lab session date and lab ID
    const sessionDate = new Date(labSession.startTime);
    const dateStr = sessionDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const csvFileName = `${labSession.labId}_${dateStr}.csv`;
    const csvPath = path.join(__dirname, 'central-admin/central-admin/server/session-csvs', csvFileName);
    
    console.log(`📂 Looking for CSV file: ${csvFileName}`);
    
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️ CSV file not found: ${csvFileName}`);
      console.log('📂 Available CSV files:');
      
      // List available CSV files for debugging
      const csvDir = path.join(__dirname, 'central-admin/central-admin/server/session-csvs');
      if (fs.existsSync(csvDir)) {
        const files = fs.readdirSync(csvDir);
        const csvFiles = files.filter(f => f.endsWith('.csv'));
        console.log('📂 Available:', csvFiles.slice(0, 10)); // Show first 10 files
      }
      
      return [];
    }
    
    // Read and parse CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      console.log('⚠️ CSV file is empty or has only headers');
      return [];
    }
    
    // Parse CSV headers and data
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    console.log('📊 CSV Headers:', headers);
    
    const studentMap = new Map(); // For consolidating duplicate entries
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      
      if (values.length < headers.length) continue;
      
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      
      // Skip empty records
      if (!record.studentName && !record.studentId) continue;
      
      // Use studentId as key for consolidation
      const key = record.studentId || `GUEST-${record.systemNumber}`;
      
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          studentName: record.studentName || 'Unknown',
          studentId: record.studentId || '',
          email: record.email || '',
          systemNumber: record.systemNumber || '',
          loginTime: record.loginTime || new Date(),
          logoutTime: record.logoutTime || labSession.endTime || new Date(),
          duration: record.duration || 0
        });
      } else {
        // Consolidate - keep earliest login, latest logout
        const existing = studentMap.get(key);
        const currentLogin = new Date(record.loginTime || labSession.startTime);
        const existingLogin = new Date(existing.loginTime);
        
        if (currentLogin < existingLogin) {
          existing.loginTime = record.loginTime;
        }
        
        const currentLogout = new Date(record.logoutTime || labSession.endTime || new Date());
        const existingLogout = new Date(existing.logoutTime);
        
        if (currentLogout > existingLogout) {
          existing.logoutTime = record.logoutTime || labSession.endTime;
        }
      }
    }
    
    const finalRecords = Array.from(studentMap.values());
    console.log(`📊 Parsed ${finalRecords.length} student records from CSV`);
    
    return finalRecords;
    
  } catch (error) {
    console.error('❌ Error reading CSV file:', error.message);
    return [];
  }
}

testSessionReport();
