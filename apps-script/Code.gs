/**
 * =========================================================================
 * TikaTrack — Google Apps Script Backend API Server
 * Consolidated API Router & Spreadsheet Manager
 * Compatible with TikaTrack-Database.xlsx (13 Tables)
 * =========================================================================
 */

var SPREADSHEET_ID = '1oJ-ZhFwXfm6koJLjYapUWk5mUHr0tA__DScJAgfQ2uA';
var SECRET_SALT = 'TikiTakaHubSecretSaltKey2026';

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var token = requestData.token;
    var data = requestData.data || {};
    var reqSpreadsheetId = requestData.spreadsheetId;

    var ss = getSpreadsheet(reqSpreadsheetId);

    // Unauthenticated Routes
    if (action === 'auth/login') {
      return createResponse({ success: true, data: handleLogin(ss, data) });
    }
    if (action === 'auth/forgot-password') {
      return createResponse({ success: true, data: handleForgotPassword(ss, data) });
    }
    if (action === 'auth/reset-password') {
      return createResponse({ success: true, data: handleResetPassword(ss, data) });
    }

    // Session Validation for Authenticated Routes
    var userSession = validateSession(ss, token);
    if (!userSession) {
      return createResponse({ success: false, error: 'Sesi telah berakhir atau tidak valid. Silakan login kembali.' });
    }

    var resultData;

    switch (action) {
      case 'auth/check-session':
        resultData = userSession;
        break;
      case 'auth/logout':
        resultData = handleLogout(ss, token);
        break;

      // STUDENTS
      case 'students/list':
        resultData = listStudents(ss, userSession, data);
        break;
      case 'students/get':
        resultData = getStudentDetails(ss, data.studentId);
        break;
      case 'students/create':
        resultData = createStudent(ss, data);
        break;
      case 'students/update':
        resultData = updateStudent(ss, data.studentId, data);
        break;

      // GUARDIANS
      case 'guardians/create':
        resultData = createGuardian(ss, data);
        break;
      case 'guardians/update':
        resultData = updateGuardian(ss, data.guardianId, data);
        break;
      case 'guardians/delete':
        resultData = deleteGuardian(ss, data.guardianId);
        break;

      // TEACHERS / USERS
      case 'teachers/list':
        resultData = listTeachers(ss);
        break;
      case 'teachers/create':
        resultData = createTeacher(ss, data);
        break;
      case 'teachers/update':
        resultData = updateTeacher(ss, data.userId, data);
        break;

      // SUBJECTS & LEARNING PATH
      case 'subjects/list':
        resultData = listSubjects(ss);
        break;
      case 'subjects/create':
        resultData = createSubject(ss, data);
        break;
      case 'subjects/update':
        resultData = updateSubject(ss, data.subjectId, data);
        break;
      case 'subjects/assign-student':
        resultData = assignSubjectToStudent(ss, data);
        break;
      case 'subjects/update-assign':
        resultData = updateStudentSubject(ss, data.studentSubjectId, data);
        break;
      case 'learning-path/list':
        resultData = listLearningPathLogs(ss, data.studentSubjectId);
        break;
      case 'learning-path/create':
        resultData = createLearningPathLog(ss, userSession.user_id, data);
        break;

      // SCHEDULES
      case 'schedules/list':
        resultData = listSchedules(ss, data);
        break;
      case 'schedules/create':
        resultData = createSchedule(ss, data);
        break;
      case 'schedules/update':
        resultData = updateSchedule(ss, data.scheduleId, data);
        break;
      case 'schedules/delete':
        resultData = deleteSchedule(ss, data.scheduleId);
        break;

      // ATTENDANCE
      case 'attendance/today':
        resultData = listTodayAttendance(ss, data.date);
        break;
      case 'attendance/record':
        resultData = recordAttendance(ss, userSession.user_id, data);
        break;
      case 'attendance/history':
        resultData = getAttendanceHistory(ss, data.studentSubjectId);
        break;

      // MAKEUP CLASSES
      case 'makeup/list':
        resultData = listMakeupClasses(ss, data);
        break;
      case 'makeup/schedule':
        resultData = scheduleMakeupClass(ss, userSession.user_id, data);
        break;
      case 'makeup/update-status':
        resultData = updateMakeupStatus(ss, data.makeupId, data.status);
        break;

      // REPORTS
      case 'reports/list':
        resultData = listReports(ss, data.studentId);
        break;
      case 'reports/create':
        resultData = createReport(ss, userSession.user_id, data);
        break;
      case 'reports/mark-sent':
        resultData = markReportAsSent(ss, data.reportId, data.messageSent);
        break;

      // DASHBOARD
      case 'dashboard/stats':
        resultData = getDashboardStats(ss, userSession);
        break;

      default:
        throw new Error('Aksi [' + action + '] tidak valid.');
    }

    return createResponse({ success: true, data: resultData });

  } catch (error) {
    var errorMsg = error ? (error.message || error.toString()) : 'Kesalahan sistem tidak dikenal';
    return createResponse({ success: false, error: errorMsg });
  }
}

function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  return ContentService.createTextOutput("TikaTrack API Server (Updated) Running.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Spreadsheet Helper
function getSpreadsheet(reqSpreadsheetId) {
  if (reqSpreadsheetId && reqSpreadsheetId !== 'YOUR_SPREADSHEET_ID_HERE') {
    try {
      return SpreadsheetApp.openById(reqSpreadsheetId);
    } catch (e) {}
  }
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  throw new Error('Spreadsheet ID tidak ditemukan.');
}

// Password Hashing
function hashPassword(password) {
  var signature = Utilities.computeHmacSha256Signature(password, SECRET_SALT);
  return signature.reduce(function(str, chr) {
    chr = (chr < 0 ? chr + 256 : chr).toString(16);
    return str + (chr.length === 1 ? '0' : '') + chr;
  }, '');
}

// Session Validation
function validateSession(ss, token) {
  if (!token) return null;
  var parts = token.split('|');
  if (parts.length !== 3) return null;

  var userId = parts[0];
  var expires = parseInt(parts[1], 10);

  if (Date.now() > expires) return null;

  var user = getRowById(ss, 'Users', 'user_id', userId);
  if (!user || user.status !== 'aktif') return null;

  delete user.password_hash;
  return user;
}

// ID Generator
function generateId(ss, sheetName, prefix) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return prefix + '-001';
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return prefix + '-001';

  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var maxNum = 0;
  for (var i = 0; i < ids.length; i++) {
    var idStr = ids[i][0];
    if (idStr && idStr.toString().indexOf(prefix + '-') === 0) {
      var num = parseInt(idStr.toString().substring(prefix.length + 1), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  var nextNum = maxNum + 1;
  var paddedNum = ("000" + nextNum).slice(-3);
  return prefix + '-' + paddedNum;
}

// JSON Reader
function getSheetAsJson(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  var list = [];
  for (var r = 0; r < values.length; r++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var header = headers[c];
      var cellVal = values[r][c];
      if (cellVal instanceof Date) {
        obj[header] = cellVal.toISOString().split('T')[0];
      } else {
        obj[header] = cellVal;
      }
    }
    list.push(obj);
  }
  return list;
}

function getRowById(ss, sheetName, idColName, idValue) {
  var list = getSheetAsJson(ss, sheetName);
  for (var i = 0; i < list.length; i++) {
    if (list[i][idColName] === idValue) {
      return list[i];
    }
  }
  return null;
}

function writeAuditLog(ss, userId, action, targetId, detail) {
  try {
    var sheet = ss.getSheetByName('AuditLog');
    if (!sheet) return;
    var logId = generateId(ss, 'AuditLog', 'AL');
    sheet.appendRow([
      logId,
      userId || 'SYSTEM',
      action,
      targetId || '',
      detail || '',
      new Date().toISOString()
    ]);
  } catch (e) {}
}

// AUTH HANDLERS
function handleLogin(ss, data) {
  var email = data.email;
  var password = data.password;

  if (!email || !password) throw new Error('Email dan kata sandi harus diisi.');

  var users = getSheetAsJson(ss, 'Users');
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].email && users[i].email.toString().toLowerCase() === email.toString().toLowerCase()) {
      user = users[i];
      break;
    }
  }

  if (!user || user.status !== 'aktif') {
    throw new Error('Akun tidak ditemukan atau berstatus nonaktif.');
  }

  var inputHash = hashPassword(password);
  // Flexible password check (plain fallback or hash match)
  if (user.password_hash !== inputHash && user.password_hash !== password) {
    throw new Error('Kata sandi tidak sesuai.');
  }

  var expires = Date.now() + 86400000; // 24 hours
  var token = user.user_id + '|' + expires + '|' + Math.random().toString(36).substring(2);

  delete user.password_hash;
  writeAuditLog(ss, user.user_id, 'login', user.user_id, 'Login sukses');

  return { user: user, token: token };
}

function handleLogout(ss, token) {
  var parts = token.split('|');
  writeAuditLog(ss, parts[0], 'logout', parts[0], 'Logout');
  return true;
}

function handleForgotPassword(ss, data) {
  var email = data.email;
  var users = getSheetAsJson(ss, 'Users');
  var user = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].email && users[i].email.toString().toLowerCase() === email.toString().toLowerCase()) {
      user = users[i];
      break;
    }
  }
  if (!user) throw new Error('Email tidak terdaftar.');

  var token = Math.random().toString(36).substring(2, 15);
  var expiresAt = new Date(Date.now() + 3600000).toISOString();

  var sheet = ss.getSheetByName('PasswordResets');
  if (sheet) {
    sheet.appendRow([token, user.user_id, expiresAt, false, new Date().toISOString()]);
  }

  // Build reset link — uses the frontend app URL with token as query param
  var appUrl = data.appUrl || 'http://localhost:5000';
  var resetLink = appUrl + '/reset-password?token=' + token;

  // Send actual email via Gmail
  try {
    var subject = 'TikaTrack — Reset Kata Sandi Anda';
    var htmlBody = '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #f1f5f9;border-radius:12px">'
      + '<div style="text-align:center;margin-bottom:20px">'
      + '<div style="display:inline-block;width:48px;height:48px;background:#ec4899;color:#fff;border-radius:12px;line-height:48px;font-size:24px;font-weight:800">T</div>'
      + '</div>'
      + '<h2 style="text-align:center;color:#0f172a;margin-bottom:8px">Reset Kata Sandi</h2>'
      + '<p style="text-align:center;color:#64748b;font-size:14px">Halo <strong>' + (user.name || 'Pengguna') + '</strong>, Anda meminta reset kata sandi untuk akun TikaTrack Anda.</p>'
      + '<div style="text-align:center;margin:24px 0">'
      + '<a href="' + resetLink + '" style="display:inline-block;background:#ec4899;color:#fff;padding:12px 32px;border-radius:9999px;text-decoration:none;font-weight:700;font-size:14px">Reset Kata Sandi Sekarang</a>'
      + '</div>'
      + '<p style="color:#94a3b8;font-size:12px;text-align:center">Link ini berlaku selama 1 jam. Jika Anda tidak meminta reset ini, abaikan email ini.</p>'
      + '<hr style="border:none;border-top:1px solid #f1f5f9;margin:20px 0">'
      + '<p style="color:#cbd5e1;font-size:11px;text-align:center">TikaTrack &copy; 2026 — Sistem Manajemen Bimbingan Belajar</p>'
      + '</div>';

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (mailErr) {
    // If email sending fails, still return success with the token info 
    // so user can manually reset, but log the error
    writeAuditLog(ss, user.user_id, 'forgot-password-email-fail', user.user_id, mailErr.message || 'Email gagal dikirim');
  }

  writeAuditLog(ss, user.user_id, 'forgot-password', user.user_id, 'Reset token created');
  return { message: 'Link reset kata sandi telah dikirim ke email ' + email };
}

function handleResetPassword(ss, data) {
  var token = data.token;
  var newPassword = data.password;
  var resets = getSheetAsJson(ss, 'PasswordResets');
  var resetObj = null;
  var resetRowIdx = -1;

  for (var i = 0; i < resets.length; i++) {
    if (resets[i].token === token) {
      resetObj = resets[i];
      resetRowIdx = i + 2;
      break;
    }
  }

  if (!resetObj || resetObj.used === true || resetObj.used === 'TRUE') {
    throw new Error('Token reset tidak valid.');
  }

  var usersSheet = ss.getSheetByName('Users');
  var userList = getSheetAsJson(ss, 'Users');
  var userRowIdx = -1;
  for (var u = 0; u < userList.length; u++) {
    if (userList[u].user_id === resetObj.user_id) {
      userRowIdx = u + 2;
      break;
    }
  }
  if (userRowIdx === -1) throw new Error('User tidak ditemukan.');

  usersSheet.getRange(userRowIdx, 4).setValue(hashPassword(newPassword));
  var resetsSheet = ss.getSheetByName('PasswordResets');
  resetsSheet.getRange(resetRowIdx, 4).setValue(true);

  return { message: 'Kata sandi berhasil diperbarui.' };
}

// STUDENTS & GUARDIANS HANDLERS
function listStudents(ss, userSession, filters) {
  var list = getSheetAsJson(ss, 'Students');
  list.forEach(function(s) {
    s.class = s.class || s.class_name || s.photo_url || '';
  });
  return list;
}

function getStudentDetails(ss, studentId) {
  var student = getRowById(ss, 'Students', 'student_id', studentId);
  if (!student) throw new Error('Siswa tidak ditemukan');
  student.class = student.class || student.class_name || student.photo_url || '';

  var guardians = getSheetAsJson(ss, 'Guardians').filter(function(g) {
    return g.student_id === studentId;
  });
  var subjects = getSheetAsJson(ss, 'StudentSubjects').filter(function(s) {
    return s.student_id === studentId;
  });

  var masterSubs = getSheetAsJson(ss, 'Subjects');
  var teachers = getSheetAsJson(ss, 'Users');

  subjects.forEach(function(s) {
    var ms = masterSubs.find(function(m) { return m.subject_id === s.subject_id; });
    var tc = teachers.find(function(t) { return t.user_id === s.teacher_id; });
    s.subject_name = ms ? ms.subject_name : '';
    s.teacher_name = tc ? tc.name : '';
  });

  student.guardians = guardians;
  student.subjects = subjects;
  return student;
}

function createStudent(ss, data) {
  var sheet = ss.getSheetByName('Students');
  var newId = generateId(ss, 'Students', 'S');
  sheet.appendRow([
    newId,
    data.name,
    data.nickname || '',
    data.birthdate || '',
    data.join_date || new Date().toISOString().split('T')[0],
    'aktif',
    data.class || data.class_name || data.photo_url || 'Reguler',
    data.notes || ''
  ]);

  // Sync to Guardians table if guardian details provided
  if (data.guardian_name || data.guardian_phone) {
    createGuardian(ss, {
      student_id: newId,
      name: data.guardian_name || 'Orang Tua / Wali',
      relation: 'Orang Tua',
      wa_number: data.guardian_phone || '-',
      is_primary: true
    });
  }

  return getRowById(ss, 'Students', 'student_id', newId);
}

function updateStudent(ss, studentId, data) {
  var sheet = ss.getSheetByName('Students');
  var list = getSheetAsJson(ss, 'Students');
  var rowIdx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].student_id === studentId) {
      rowIdx = i + 2;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('Siswa tidak ditemukan');

  if (data.name) sheet.getRange(rowIdx, 2).setValue(data.name);
  if (data.nickname !== undefined) sheet.getRange(rowIdx, 3).setValue(data.nickname);
  if (data.birthdate !== undefined) sheet.getRange(rowIdx, 4).setValue(data.birthdate);
  if (data.join_date) sheet.getRange(rowIdx, 5).setValue(data.join_date);
  if (data.status) sheet.getRange(rowIdx, 6).setValue(data.status);
  if (data.class !== undefined || data.class_name !== undefined || data.photo_url !== undefined) {
    var val = data.class || data.class_name || data.photo_url || '';
    sheet.getRange(rowIdx, 7).setValue(val);
  }
  if (data.notes !== undefined) sheet.getRange(rowIdx, 8).setValue(data.notes);

  // Sync / Upsert Guardians table
  var gName = data.guardian_name !== undefined ? data.guardian_name : (data.guardianName !== undefined ? data.guardianName : null);
  var gPhone = data.guardian_phone !== undefined ? data.guardian_phone : (data.guardianPhone !== undefined ? data.guardianPhone : null);

  if (gName !== null || gPhone !== null) {
    var guardians = getSheetAsJson(ss, 'Guardians').filter(function(g) {
      return g.student_id === studentId;
    });
    if (guardians.length > 0) {
      updateGuardian(ss, guardians[0].guardian_id, {
        name: gName !== null && gName !== '' ? gName : guardians[0].name,
        wa_number: gPhone !== null && gPhone !== '' ? gPhone : guardians[0].wa_number,
      });
    } else if ((gName && gName !== '') || (gPhone && gPhone !== '')) {
      createGuardian(ss, {
        student_id: studentId,
        name: gName || 'Orang Tua / Wali',
        relation: 'Orang Tua',
        wa_number: gPhone || '-',
        is_primary: true
      });
    }
  }

  return getRowById(ss, 'Students', 'student_id', studentId);
}

function createGuardian(ss, data) {
  var sheet = ss.getSheetByName('Guardians');
  var newId = generateId(ss, 'Guardians', 'G');
  sheet.appendRow([
    newId,
    data.student_id,
    data.name,
    data.relation || 'Orang Tua',
    data.wa_number,
    data.email || '',
    data.is_primary || false
  ]);
  return getRowById(ss, 'Guardians', 'guardian_id', newId);
}

function updateGuardian(ss, guardianId, data) {
  var sheet = ss.getSheetByName('Guardians');
  var list = getSheetAsJson(ss, 'Guardians');
  var rowIdx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].guardian_id === guardianId) {
      rowIdx = i + 2;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('Wali tidak ditemukan');

  if (data.name) sheet.getRange(rowIdx, 3).setValue(data.name);
  if (data.relation) sheet.getRange(rowIdx, 4).setValue(data.relation);
  if (data.wa_number) sheet.getRange(rowIdx, 5).setValue(data.wa_number);
  if (data.email !== undefined) sheet.getRange(rowIdx, 6).setValue(data.email);
  if (data.is_primary !== undefined) sheet.getRange(rowIdx, 7).setValue(data.is_primary);

  return getRowById(ss, 'Guardians', 'guardian_id', guardianId);
}

function deleteGuardian(ss, guardianId) {
  var sheet = ss.getSheetByName('Guardians');
  var list = getSheetAsJson(ss, 'Guardians');
  var rowIdx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].guardian_id === guardianId) {
      rowIdx = i + 2;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('Wali tidak ditemukan');
  sheet.deleteRow(rowIdx);
  return true;
}

// TEACHER HANDLERS
function listTeachers(ss) {
  var list = getSheetAsJson(ss, 'Users');
  list.forEach(function(u) { delete u.password_hash; });
  return list;
}

function createTeacher(ss, data) {
  var sheet = ss.getSheetByName('Users');
  var newId = generateId(ss, 'Users', 'U');
  sheet.appendRow([
    newId,
    data.name,
    data.email,
    hashPassword(data.password || '123456'),
    data.role || 'guru',
    data.phone || '',
    'aktif',
    new Date().toISOString()
  ]);
  var t = getRowById(ss, 'Users', 'user_id', newId);
  delete t.password_hash;
  return t;
}

function updateTeacher(ss, userId, data) {
  var sheet = ss.getSheetByName('Users');
  var list = getSheetAsJson(ss, 'Users');
  var rowIdx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].user_id === userId) {
      rowIdx = i + 2;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('User tidak ditemukan');

  if (data.name) sheet.getRange(rowIdx, 2).setValue(data.name);
  if (data.email) sheet.getRange(rowIdx, 3).setValue(data.email);
  if (data.password) sheet.getRange(rowIdx, 4).setValue(hashPassword(data.password));
  if (data.role) sheet.getRange(rowIdx, 5).setValue(data.role);
  if (data.phone !== undefined) sheet.getRange(rowIdx, 6).setValue(data.phone);
  if (data.status) sheet.getRange(rowIdx, 7).setValue(data.status);

  var t = getRowById(ss, 'Users', 'user_id', userId);
  delete t.password_hash;
  return t;
}

// SUBJECTS & LEARNING PATH HANDLERS
function listSubjects(ss) {
  return getSheetAsJson(ss, 'Subjects');
}

function createSubject(ss, data) {
  var sheet = ss.getSheetByName('Subjects');
  var newId = generateId(ss, 'Subjects', 'MP');
  sheet.appendRow([newId, data.subject_name, data.category || '']);
  return getRowById(ss, 'Subjects', 'subject_id', newId);
}

function updateSubject(ss, subjectId, data) {
  var sheet = ss.getSheetByName('Subjects');
  var list = getSheetAsJson(ss, 'Subjects');
  var rowIdx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].subject_id === subjectId) {
      rowIdx = i + 2;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('Mapel tidak ditemukan');
  if (data.subject_name) sheet.getRange(rowIdx, 2).setValue(data.subject_name);
  if (data.category !== undefined) sheet.getRange(rowIdx, 3).setValue(data.category);

  return getRowById(ss, 'Subjects', 'subject_id', subjectId);
}

function assignSubjectToStudent(ss, data) {
  var sheet = ss.getSheetByName('StudentSubjects');
  var newId = generateId(ss, 'StudentSubjects', 'SS');
  sheet.appendRow([
    newId,
    data.student_id,
    data.subject_id,
    data.teacher_id,
    data.start_date || new Date().toISOString().split('T')[0],
    'aktif',
    '-',
    data.next_topic || '-',
    new Date().toISOString()
  ]);
  return getRowById(ss, 'StudentSubjects', 'student_subject_id', newId);
}

function updateStudentSubject(ss, studentSubjectId, data) {
  var sheet = ss.getSheetByName('StudentSubjects');
  var list = getSheetAsJson(ss, 'StudentSubjects');
  var rowIdx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].student_subject_id === studentSubjectId) {
      rowIdx = i + 2;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('Mapel siswa tidak ditemukan');

  if (data.teacher_id) sheet.getRange(rowIdx, 4).setValue(data.teacher_id);
  if (data.status) sheet.getRange(rowIdx, 6).setValue(data.status);
  if (data.current_topic) sheet.getRange(rowIdx, 7).setValue(data.current_topic);
  if (data.next_topic) sheet.getRange(rowIdx, 8).setValue(data.next_topic);
  sheet.getRange(rowIdx, 9).setValue(new Date().toISOString());

  return getRowById(ss, 'StudentSubjects', 'student_subject_id', studentSubjectId);
}

function listLearningPathLogs(ss, studentSubjectId) {
  return getSheetAsJson(ss, 'LearningPathLog').filter(function(l) {
    return l.student_subject_id === studentSubjectId;
  });
}

function createLearningPathLog(ss, userId, data) {
  var sheet = ss.getSheetByName('LearningPathLog');
  var newId = generateId(ss, 'LearningPathLog', 'LOG');
  sheet.appendRow([
    newId,
    data.student_subject_id,
    data.date || new Date().toISOString().split('T')[0],
    data.topic,
    data.topic_status || 'selesai',
    data.notes || '',
    userId
  ]);

  if (data.topic_status === 'selesai' && data.next_topic) {
    updateStudentSubject(ss, data.student_subject_id, {
      current_topic: data.topic,
      next_topic: data.next_topic
    });
  }

  return getRowById(ss, 'LearningPathLog', 'log_id', newId);
}

// SCHEDULE HANDLERS
function listSchedules(ss, filters) {
  var list = getSheetAsJson(ss, 'Schedule');
  var ssList = getSheetAsJson(ss, 'StudentSubjects');
  var students = getSheetAsJson(ss, 'Students');
  var teachers = getSheetAsJson(ss, 'Users');
  var subjects = getSheetAsJson(ss, 'Subjects');

  list.forEach(function(sch) {
    var ssObj = ssList.find(function(s) { return s.student_subject_id === sch.student_subject_id; });
    if (ssObj) {
      var st = students.find(function(std) { return std.student_id === ssObj.student_id; });
      var tc = teachers.find(function(t) { return t.user_id === ssObj.teacher_id; });
      var sb = subjects.find(function(sub) { return sub.subject_id === ssObj.subject_id; });
      sch.student_name = st ? st.name : '';
      sch.teacher_name = tc ? tc.name : '';
      sch.subject_name = sb ? sb.subject_name : '';
      sch.teacher_id = ssObj.teacher_id;
    }
  });

  if (filters && filters.day_of_week) {
    list = list.filter(function(s) { return s.day_of_week === filters.day_of_week; });
  }
  return list;
}

function createSchedule(ss, data) {
  var sheet = ss.getSheetByName('Schedule');
  var newId = generateId(ss, 'Schedule', 'SCH');
  sheet.appendRow([
    newId,
    data.student_subject_id,
    data.day_of_week,
    data.start_time,
    data.end_time,
    'aktif'
  ]);
  return getRowById(ss, 'Schedule', 'schedule_id', newId);
}

function updateSchedule(ss, scheduleId, data) {
  var sheet = ss.getSheetByName('Schedule');
  var list = getSheetAsJson(ss, 'Schedule');
  var rowIdx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].schedule_id === scheduleId) {
      rowIdx = i + 2;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('Jadwal tidak ditemukan');

  if (data.day_of_week) sheet.getRange(rowIdx, 3).setValue(data.day_of_week);
  if (data.start_time) sheet.getRange(rowIdx, 4).setValue(data.start_time);
  if (data.end_time) sheet.getRange(rowIdx, 5).setValue(data.end_time);
  if (data.status) sheet.getRange(rowIdx, 6).setValue(data.status);

  return getRowById(ss, 'Schedule', 'schedule_id', scheduleId);
}

function deleteSchedule(ss, scheduleId) {
  var sheet = ss.getSheetByName('Schedule');
  var list = getSheetAsJson(ss, 'Schedule');
  var rowIdx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].schedule_id === scheduleId) {
      rowIdx = i + 2;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('Jadwal tidak ditemukan');
  sheet.deleteRow(rowIdx);
  return true;
}

// ATTENDANCE HANDLERS
function listTodayAttendance(ss, targetDate) {
  var dateStr = targetDate || new Date().toISOString().split('T')[0];
  var list = getSheetAsJson(ss, 'Attendance').filter(function(a) {
    return a.date === dateStr;
  });
  return list;
}

function recordAttendance(ss, userId, data) {
  var sheet = ss.getSheetByName('Attendance');
  var newId = generateId(ss, 'Attendance', 'ATT');
  var dateStr = data.date || new Date().toISOString().split('T')[0];

  sheet.appendRow([
    newId,
    data.schedule_id || '-',
    data.student_subject_id,
    dateStr,
    data.status,
    data.is_makeup_session || false,
    data.makeup_id || '-',
    data.topic_covered || '-',
    data.notes || '',
    userId,
    new Date().toISOString()
  ]);

  if (data.status === 'selesai' && data.topic_covered && data.topic_covered !== '-') {
    createLearningPathLog(ss, userId, {
      student_subject_id: data.student_subject_id,
      date: dateStr,
      topic: data.topic_covered,
      topic_status: 'selesai',
      notes: data.notes || 'Dicatat via Presensi'
    });
  }

  return getRowById(ss, 'Attendance', 'attendance_id', newId);
}

function getAttendanceHistory(ss, studentSubjectId) {
  return getSheetAsJson(ss, 'Attendance').filter(function(a) {
    return a.student_subject_id === studentSubjectId;
  });
}

// MAKEUP CLASSES HANDLERS
function listMakeupClasses(ss, filters) {
  var list = getSheetAsJson(ss, 'MakeupClasses');
  var ssList = getSheetAsJson(ss, 'StudentSubjects');
  var students = getSheetAsJson(ss, 'Students');
  var subjects = getSheetAsJson(ss, 'Subjects');

  list.forEach(function(m) {
    var ssObj = ssList.find(function(s) { return s.student_subject_id === m.student_subject_id; });
    if (ssObj) {
      var st = students.find(function(std) { return std.student_id === ssObj.student_id; });
      var sb = subjects.find(function(sub) { return sub.subject_id === ssObj.subject_id; });
      m.student_name = st ? st.name : '';
      m.subject_name = sb ? sb.subject_name : '';
    }
  });

  return list;
}

function scheduleMakeupClass(ss, userId, data) {
  var sheet = ss.getSheetByName('MakeupClasses');
  var newId = generateId(ss, 'MakeupClasses', 'MC');

  sheet.appendRow([
    newId,
    data.original_attendance_id || '-',
    data.student_subject_id,
    data.original_date || new Date().toISOString().split('T')[0],
    data.makeup_date,
    data.makeup_start_time,
    data.duration_hours || 1.5,
    'terjadwal',
    data.notes || '',
    userId
  ]);

  return getRowById(ss, 'MakeupClasses', 'makeup_id', newId);
}

function updateMakeupStatus(ss, makeupId, status) {
  var sheet = ss.getSheetByName('MakeupClasses');
  var list = getSheetAsJson(ss, 'MakeupClasses');
  var rowIdx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].makeup_id === makeupId) {
      rowIdx = i + 2;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('Kelas pengganti tidak ditemukan');
  sheet.getRange(rowIdx, 8).setValue(status);
  return getRowById(ss, 'MakeupClasses', 'makeup_id', makeupId);
}

// REPORTS HANDLERS
function listReports(ss, studentId) {
  var list = getSheetAsJson(ss, 'Reports');
  if (studentId) {
    list = list.filter(function(r) { return r.student_id === studentId; });
  }
  return list;
}

function createReport(ss, userId, data) {
  var sheet = ss.getSheetByName('Reports');
  var newId = generateId(ss, 'Reports', 'REP');

  sheet.appendRow([
    newId,
    data.student_id,
    data.student_subject_id,
    data.period_type || 'mingguan',
    data.period_label || 'Pekan Ini',
    data.achievements || '',
    data.next_progress || '',
    data.notes || '',
    userId,
    data.guardian_id || '',
    'draft',
    '',
    '',
    new Date().toISOString()
  ]);

  return getRowById(ss, 'Reports', 'report_id', newId);
}

function markReportAsSent(ss, reportId, messageSent) {
  var sheet = ss.getSheetByName('Reports');
  var list = getSheetAsJson(ss, 'Reports');
  var rowIdx = -1;
  for (var i = 0; i < list.length; i++) {
    if (list[i].report_id === reportId) {
      rowIdx = i + 2;
      break;
    }
  }
  if (rowIdx === -1) throw new Error('Laporan tidak ditemukan');

  sheet.getRange(rowIdx, 11).setValue('terkirim');
  sheet.getRange(rowIdx, 12).setValue(new Date().toISOString());
  sheet.getRange(rowIdx, 13).setValue(messageSent || '');

  return getRowById(ss, 'Reports', 'report_id', reportId);
}

// DASHBOARD STATS HANDLER
function getDashboardStats(ss, userSession) {
  var students = getSheetAsJson(ss, 'Students');
  var activeStudents = students.filter(function(s) { return s.status === 'aktif'; }).length;

  var schedules = listSchedules(ss);
  var days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var todayDayName = days[new Date().getDay()];
  var todayScheduleCount = schedules.filter(function(s) { return s.day_of_week === todayDayName; }).length;

  var todayAttendance = listTodayAttendance(ss);
  var pendingAttendanceCount = Math.max(0, todayScheduleCount - todayAttendance.length);

  var makeupClasses = getSheetAsJson(ss, 'MakeupClasses');
  var pendingMakeupCount = makeupClasses.filter(function(m) { return m.status === 'terjadwal'; }).length;

  return {
    totalStudents: activeStudents,
    todaySchedules: todayScheduleCount,
    pendingAttendance: pendingAttendanceCount,
    pendingMakeup: pendingMakeupCount
  };
}

// SETUP DATABASE FUNCTION
function setupDatabase() {
  var ss = getSpreadsheet();
  var tables = {
    'Users': ['user_id', 'name', 'email', 'password_hash', 'role', 'phone', 'status', 'created_at'],
    'Students': ['student_id', 'name', 'nickname', 'birthdate', 'join_date', 'status', 'photo_url', 'notes'],
    'Guardians': ['guardian_id', 'student_id', 'name', 'relation', 'wa_number', 'email', 'is_primary'],
    'Subjects': ['subject_id', 'subject_name', 'category'],
    'StudentSubjects': ['student_subject_id', 'student_id', 'subject_id', 'teacher_id', 'start_date', 'status', 'current_topic', 'next_topic', 'last_updated'],
    'LearningPathLog': ['log_id', 'student_subject_id', 'date', 'topic', 'topic_status', 'notes', 'created_by'],
    'Schedule': ['schedule_id', 'student_subject_id', 'day_of_week', 'start_time', 'end_time', 'status'],
    'Attendance': ['attendance_id', 'schedule_id', 'student_subject_id', 'date', 'status', 'is_makeup_session', 'makeup_id', 'topic_covered', 'notes', 'recorded_by', 'created_at'],
    'MakeupClasses': ['makeup_id', 'original_attendance_id', 'student_subject_id', 'original_date', 'makeup_date', 'makeup_start_time', 'duration_hours', 'status', 'notes', 'created_by'],
    'Reports': ['report_id', 'student_id', 'student_subject_id', 'period_type', 'period_label', 'achievements', 'next_progress', 'notes', 'teacher_id', 'guardian_id', 'status', 'sent_at', 'message_sent', 'created_at'],
    'WeeklySummary': ['summary_id', 'student_id', 'period_type', 'period_label', 'total_sessions', 'attended', 'izin_sakit', 'alpa', 'makeup_scheduled', 'makeup_completed', 'reports_sent', 'generated_at'],
    'PasswordResets': ['token', 'user_id', 'expires_at', 'used', 'created_at'],
    'AuditLog': ['log_id', 'user_id', 'action', 'target_id', 'detail', 'timestamp']
  };

  for (var tableName in tables) {
    var sheet = ss.getSheetByName(tableName);
    if (!sheet) {
      sheet = ss.insertSheet(tableName);
    } else {
      sheet.clear();
    }
    sheet.appendRow(tables[tableName]);
    var headerRange = sheet.getRange(1, 1, 1, tables[tableName].length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#E0E7FF");
    headerRange.setFontColor("#312E81");
    sheet.setFrozenRows(1);
  }

  var usersSheet = ss.getSheetByName('Users');
  var passHash = hashPassword('admin.id01');
  usersSheet.appendRow([
    'U-001',
    'Owner Bimbel',
    'admin@tikitaka.com',
    passHash,
    'admin',
    '6281234567890',
    'aktif',
    new Date().toISOString()
  ]);

  Logger.log('Setup database TikaTrack 13 tab berhasil dibuat!');
}
