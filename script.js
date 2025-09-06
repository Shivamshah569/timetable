
let sections = [];
let subjects = {};
let teachers = [];
let teacherWorkload = {};
let timetable = {};
let firebaseInitialized = false;


const checkFirebase = setInterval(() => {
    if (window.firebase) {
        clearInterval(checkFirebase);
        firebaseInitialized = true;
        document.getElementById('firebaseStatus').innerHTML = '<i class="fas fa-check-circle"></i> Connected to Firebase';
        console.log("Firebase is ready to use");
        setTimeout(loadFromFirebase, 1000);
    }
}, 100);

document.addEventListener('DOMContentLoaded', function() {
    
    const animatedElements = document.querySelectorAll('.animated');
    animatedElements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('visible');
        }, 100 * index);
    });

    
    document.getElementById('setupSectionsBtn').addEventListener('click', function() {
        const sectionCount = parseInt(document.getElementById('sectionCount').value);
        setupSections(sectionCount);
    });

    
    document.getElementById('saveBtn').addEventListener('click', saveToFirebase);
    document.getElementById('loadBtn').addEventListener('click', loadFromFirebase);
    

    document.getElementById('generateBtn').addEventListener('click', generateTimetable);
    document.getElementById('teacherCount').addEventListener('change', function() {
        initTeacherSpecialization(parseInt(this.value));
    });
});



function collectAllConfigurationData() {
    const sectionCount = parseInt(document.getElementById('sectionCount').value);
    const teacherCount = parseInt(document.getElementById('teacherCount').value);

    sections = [];
    for (let i = 1; i <= sectionCount; i++) {
        sections.push({
            id: `section-${i}`,
            name: document.getElementById(`section-${i}-name`).value || `Section ${i}`,
            year: parseInt(document.getElementById(`section-${i}-year`).value)
        });
    }
    
    subjects = {};
    for (let i = 1; i <= sectionCount; i++) {
        const sectionId = `section-${i}`;
        subjects[sectionId] = { major: [], minor: [], labs: [] };
        const getSubjectData = (type, count) => {
            const subjectArray = [];
            for (let j = 1; j <= count; j++) {
                const input = document.getElementById(`section-${i}-${type}-${j}`);
                if (input && input.value) {
                    const preference = input.parentElement.querySelector('.preference-btn.active').dataset.pref;
                    subjectArray.push({ name: input.value, preference: preference });
                }
            }
            return subjectArray;
        };
        subjects[sectionId].major = getSubjectData('major', parseInt(document.getElementById(`section-${i}-major-count`).value));
        subjects[sectionId].minor = getSubjectData('minor', parseInt(document.getElementById(`section-${i}-minor-count`).value));
        subjects[sectionId].labs = getSubjectData('lab', parseInt(document.getElementById(`section-${i}-lab-count`).value));
    }

    teachers = [];
    for (let i = 1; i <= teacherCount; i++) {
        const name = document.getElementById(`teacher${i}_name`)?.value;
        if (name) {
            teachers.push({
                id: i,
                name: name,
                subjects: [
                    document.getElementById(`teacher${i}_subject1`).value,
                    document.getElementById(`teacher${i}_subject2`).value,
                    document.getElementById(`teacher${i}_subject3`).value
                ].filter(Boolean),
                maxPeriodsPerDay: 3,
                maxPeriodsPerWeek: 14,
                assignedPeriods: 0,
                dailyLoad: [0, 0, 0, 0, 0]
            });
        }
    }
}

function setupSections(count) {
    const sectionsContainer = document.getElementById('sectionsContainer');
    sectionsContainer.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'input-group';
        sectionDiv.innerHTML = `
            <label>Section ${i} Name</label>
            <input type="text" id="section-${i}-name" placeholder="Enter section name" value="Section ${i}">
            <label>Year</label>
            <select id="section-${i}-year">
                <option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option>
            </select>`;
        sectionsContainer.appendChild(sectionDiv);
    }
    document.getElementById('subjectConfiguration').style.display = 'block';
    document.getElementById('teacherConfiguration').style.display = 'block';
    setupSubjectTabs(count);
    initTeacherSpecialization(parseInt(document.getElementById('teacherCount').value));
}

function setupSubjectTabs(sectionCount) {
    const subjectTabs = document.getElementById('subjectTabs');
    const subjectTabContent = document.getElementById('subjectTabContent');
    subjectTabs.innerHTML = '';
    subjectTabContent.innerHTML = '';
    for (let i = 1; i <= sectionCount; i++) {
        const tabButton = document.createElement('button');
        tabButton.className = 'section-btn' + (i === 1 ? ' active' : '');
        tabButton.textContent = `Section ${i}`;
        tabButton.addEventListener('click', function() {
            document.querySelectorAll('#subjectTabs .section-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.subject-tab-content').forEach(tab => tab.style.display = 'none');
            document.getElementById(`subject-content-${i}`).style.display = 'block';
        });
        subjectTabs.appendChild(tabButton);
        const tabContent = document.createElement('div');
        tabContent.className = 'subject-tab-content';
        tabContent.id = `subject-content-${i}`;
        tabContent.style.display = i === 1 ? 'block' : 'none';
        tabContent.innerHTML = `
            <h4 style="margin-bottom: 1rem;">Subjects for Section ${i}</h4>
            <div class="config-controls">
                <div class="input-group"><label>Major Subjects</label><input type="number" id="section-${i}-major-count" min="1" value="5" max="10"></div>
                <div class="input-group"><label>Minor Subjects (Aptitude, etc.)</label><input type="number" id="section-${i}-minor-count" min="1" value="3" max="10"></div>
                <div class="input-group"><label>Labs</label><input type="number" id="section-${i}-lab-count" min="1" value="2" max="5"></div>
                <button class="config-btn" id="section-${i}-setup-btn"><i class="fas fa-plus"></i> Setup Subjects</button>
            </div>
            <div id="section-${i}-subject-inputs" class="subject-inputs"></div>`;
        subjectTabContent.appendChild(tabContent);
        document.getElementById(`section-${i}-setup-btn`).addEventListener('click', () => setupSectionSubjects(i));
    }
    setupSectionSubjects(1);
}

function setupSectionSubjects(sectionNum) {
    const majorCount = parseInt(document.getElementById(`section-${sectionNum}-major-count`).value);
    const minorCount = parseInt(document.getElementById(`section-${sectionNum}-minor-count`).value);
    const labCount = parseInt(document.getElementById(`section-${sectionNum}-lab-count`).value);
    const container = document.getElementById(`section-${sectionNum}-subject-inputs`);
    container.innerHTML = '';

    const createSubjectInput = (type, index, defaultValue) => {
        const div = document.createElement('div');
        div.className = 'input-group';
        div.innerHTML = `
            <label>${defaultValue} ${index}</label>
            <input type="text" id="section-${sectionNum}-${type}-${index}" placeholder="Enter name" value="${defaultValue} ${index}">
            <label>Period Preference</label>
            <div class="half-preference">
                <button type="button" class="preference-btn first-half" data-pref="first">First Half</button>
                <button type="button" class="preference-btn second-half" data-pref="second">Second Half</button>
                <button type="button" class="preference-btn no-preference active" data-pref="any">No Preference</button>
            </div>`;
        container.appendChild(div);
        div.querySelectorAll('.preference-btn').forEach(btn => btn.addEventListener('click', function() {
            div.querySelectorAll('.preference-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        }));
    };
    for (let i = 1; i <= majorCount; i++) createSubjectInput('major', i, 'Major Subject');
    for (let i = 1; i <= minorCount; i++) createSubjectInput('minor', i, 'Minor Subject');
    for (let i = 1; i <= labCount; i++) createSubjectInput('lab', i, 'Lab');
}

function initTeacherSpecialization(count) {
    const teacherList = document.getElementById('teacherList');
    teacherList.innerHTML = '';
    const allSubjects = getAllSubjects();
    const subjectOptions = `<option value="">None</option>` + allSubjects.map(subj => `<option value="${subj}">${subj}</option>`).join('');
    for (let i = 1; i <= count; i++) {
        const teacherDiv = document.createElement('div');
        teacherDiv.className = 'input-group';
        teacherDiv.innerHTML = `
            <label>Teacher ${i} Name</label>
            <input type="text" id="teacher${i}_name" placeholder="Enter teacher name" value="Teacher ${i}">
            <label style="margin-top: 1rem;">Specialization Subjects</label>
            <div class="teacher-specialization">
                <div class="teacher-option"><strong>Primary</strong><select id="teacher${i}_subject1">${subjectOptions}</select></div>
                <div class="teacher-option"><strong>Secondary</strong><select id="teacher${i}_subject2">${subjectOptions}</select></div>
                <div class="teacher-option"><strong>Tertiary</strong><select id="teacher${i}_subject3">${subjectOptions}</select></div>
            </div>`;
        teacherList.appendChild(teacherDiv);
    }
}

function getAllSubjects() {
    const allSubjects = new Set();
    document.querySelectorAll('.subject-inputs input[type="text"]').forEach(input => {
        if (input.value) allSubjects.add(input.value);
    });
    return Array.from(allSubjects);
}


function generateTimetable() {
    collectAllConfigurationData();
    
    teachers.forEach(t => { t.assignedPeriods = 0; t.dailyLoad = [0, 0, 0, 0, 0]; });
    timetable = {};

    const generateBtn = document.getElementById('generateBtn');
    generateBtn.innerHTML = '<div class="spinner"></div> Generating...';

    setTimeout(() => { 
        sections.forEach(section => {
            generateSectionTimetable(section.id);
        });
        
        
        document.getElementById('timetableCard').style.display = 'block';
        document.getElementById('teachersCard').style.display = 'block';
        if (sections.length > 0) {
            displayTimetable(sections[0].id); 
        }
        displayTeachers();
        updateStats();
        generateBtn.innerHTML = '<i class="fas fa-cogs"></i> Generate Perfect Timetable';
        saveToFirebase();
    }, 100);
}


function isSubjectOnDay(subjectName, day, grid) {
    for (let period = 0; period < 8; period++) {
        if (grid[day][period] && grid[day][period].subject === subjectName) {
            return true;
        }
    }
    return false;
}

function generateSectionTimetable(sectionId) {
    const grid = Array(5).fill(null).map(() => Array(8).fill(null)); 
    let availableSlots = [];
    for (let day = 0; day < 5; day++) for (let period = 0; period < 8; period++) availableSlots.push({ day, period });

    const sectionSubjects = subjects[sectionId];
    
    
    sectionSubjects.labs.forEach(lab => {
        placeSubject(lab.name, 1, grid, availableSlots, true);
    });
    
    
    const mentorSubject = sectionSubjects.minor.find(s => s.name.toLowerCase().includes('mentor'));
    if (mentorSubject) {
        placeSubject(mentorSubject.name, 1, grid, availableSlots, false);
    }
    
   
    const otherMinors = sectionSubjects.minor.filter(s => !s.name.toLowerCase().includes('mentor'));
    otherMinors.forEach(minor => {
        placeSubject(minor.name, 2, grid, availableSlots, false);
    });
    
    
    const majorSubjectNames = sectionSubjects.major.map(m => m.name);
    const majorSubjectCounts = {};
    majorSubjectNames.forEach(name => majorSubjectCounts[name] = 0);

    availableSlots.sort(() => Math.random() - 0.5); 
    
    availableSlots.forEach(({ day, period }) => {
        if (!grid[day][period]) {
            
            const sortedMajors = majorSubjectNames.sort((a, b) => majorSubjectCounts[a] - majorSubjectCounts[b]);
            
            for (const subjectName of sortedMajors) {
                
                if (!isSubjectOnDay(subjectName, day, grid)) {
                    
                    if (placeSubject(subjectName, 1, grid, [{ day, period }], false)) {
                        majorSubjectCounts[subjectName]++;
                        break; 
                    }
                }
            }
        }
    });

    
    availableSlots = availableSlots.filter(({day, period}) => !grid[day][period]);

    
    timetable[sectionId] = grid.map(day => [...day.slice(0, 4), { subject: "LUNCH", isBreak: true }, ...day.slice(4, 8)]);
}

function placeSubject(subjectName, count, grid, availableSlots, isLab) {
    let placedCount = 0;
    for (let i = 0; i < count; i++) {
        let placedThisIteration = false;
        availableSlots.sort(() => Math.random() - 0.5); 

        for (let j = 0; j < availableSlots.length; j++) {
            const { day, period } = availableSlots[j];
            if (grid[day][period]) continue;

            const teacher = findAvailableTeacher(subjectName, day, period, isLab);
            if (teacher) {
                if (isLab) {
                    if (period < 7 && (period !== 3) && !grid[day][period + 1]) {
                        grid[day][period] = { subject: subjectName, teacher: teacher.name, teacherId: teacher.id, isLab: true };
                        grid[day][period + 1] = { subject: subjectName, teacher: teacher.name, teacherId: teacher.id, isLab: true };
                        teacher.assignedPeriods += 2; teacher.dailyLoad[day] += 2;
                        
                        const nextSlotIndex = availableSlots.findIndex(s => s.day === day && s.period === period + 1);
                        if (nextSlotIndex > -1) availableSlots.splice(nextSlotIndex, 1);
                        availableSlots.splice(j, 1);
                        placedThisIteration = true; break;
                    }
                } else {
                    grid[day][period] = { subject: subjectName, teacher: teacher.name, teacherId: teacher.id };
                    teacher.assignedPeriods++; teacher.dailyLoad[day]++;
                    availableSlots.splice(j, 1);
                    placedThisIteration = true; break;
                }
            }
        }
        if (placedThisIteration) placedCount++;
    }
    return placedCount > 0; 
}

function findAvailableTeacher(subjectName, day, period, isLab) {
    const eligibleTeachers = teachers.filter(t => {
        const hasSubject = t.subjects.includes(subjectName);
        const workloadOk = t.assignedPeriods < t.maxPeriodsPerWeek && t.dailyLoad[day] < t.maxPeriodsPerDay;
        const labWorkloadOk = isLab ? t.assignedPeriods < (t.maxPeriodsPerWeek - 1) && t.dailyLoad[day] < (t.maxPeriodsPerDay - 1) : true;
        const isFree = !isTeacherBusy(t.id, day, period) && (!isLab || !isTeacherBusy(t.id, day, period + 1));
        return hasSubject && workloadOk && labWorkloadOk && isFree;
    });

    if (eligibleTeachers.length === 0) return null;

    const primaryTeachers = eligibleTeachers.filter(t => t.subjects[0] === subjectName);
    const otherTeachers = eligibleTeachers.filter(t => t.subjects[0] !== subjectName);
    
    primaryTeachers.sort((a,b) => a.assignedPeriods - b.assignedPeriods);
    otherTeachers.sort((a,b) => a.assignedPeriods - b.assignedPeriods);

    if (primaryTeachers.length > 0 && (Math.random() < 0.80 || otherTeachers.length === 0)) {
        return primaryTeachers[0];
    } 
    return otherTeachers.length > 0 ? otherTeachers[0] : (primaryTeachers[0] || null);
}

function isTeacherBusy(teacherId, day, period) {
    const actualPeriod = period >= 4 ? period + 1 : period;
    for (const secId in timetable) {
        if (timetable[secId] && timetable[secId][day][actualPeriod] && timetable[secId][day][actualPeriod].teacherId === teacherId) {
            return true;
        }
    }
    return false;
}



function displayTimetable(sectionId) {
    const timetableBody = document.querySelector('#timetableCard tbody');
    timetableBody.innerHTML = '';
    const section = sections.find(s => s.id === sectionId);
    document.getElementById('currentSection').textContent = section ? section.name : sectionId;
    
    const sectionButtons = document.getElementById('sectionButtons');
    if(sectionButtons.innerHTML === "" || sectionButtons.children.length !== sections.length) { // Rebuild buttons if needed
        sectionButtons.innerHTML = "";
        sections.forEach((sec, index) => {
            const button = document.createElement('button');
            button.className = 'section-btn';
            if (sec.id === sectionId) button.classList.add('active');
            button.textContent = sec.name;
            button.addEventListener('click', function() {
                document.querySelectorAll('#sectionButtons .section-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                displayTimetable(sec.id);
            });
            sectionButtons.appendChild(button);
        });
    }

    const currentTimetable = timetable[sectionId] || Array(5).fill(null).map(() => Array(9).fill(null));
    for (let period = 0; period < 9; period++) {
        const row = document.createElement('tr');
        let timeLabel = ['9:15-10:05', '10:05-10:55', '10:55-11:45', '11:45-12:35', '12:35-1:35', '1:35-2:25', '2:25-3:15', '3:15-4:05', '4:05-4:55'][period];
        if (period === 4) timeLabel = 'LUNCH';
        row.innerHTML = `<td>${timeLabel}</td>`;
        for (let day = 0; day < 5; day++) {
            const cell = currentTimetable[day]?.[period];
            let cellHtml = '<td></td>';
            if (cell) {
                let classList = cell.isBreak ? 'lunch-break' : (cell.isLab ? 'lab-period' : '');
                cellHtml = `<td class="${classList}">${cell.subject}<br><small>${cell.teacher || ''}</small></td>`;
            }
            row.innerHTML += cellHtml;
        }
        timetableBody.appendChild(row);
    }
}

function displayTeachers() {
    const teachersList = document.getElementById('teachersList');
    teachersList.innerHTML = '';
    teachers.forEach(teacher => {
        const teacherCard = document.createElement('div');
        teacherCard.className = 'teacher-card';
        teacherCard.innerHTML = `
            <div class="teacher-avatar">${teacher.name.charAt(0)}</div>
            <div class="teacher-info">
                <h3>${teacher.name} (${teacher.assignedPeriods}/${teacher.maxPeriodsPerWeek})</h3>
                <div>${teacher.subjects.map((s, i) => `<span class="subject-badge">P${i+1}: ${s}</span>`).join('')}</div>
            </div>`;
        teachersList.appendChild(teacherCard);
    });
}

function updateStats() {
    let assignedClasses = 0;
    let totalTeacherLoad = 0;
    const sectionCount = sections.length;
    const totalClasses = sectionCount * 5 * 8;
    
    for (const sectionKey in timetable) {
        if (timetable[sectionKey]) {
            for (let day = 0; day < 5; day++) {
                for (let period = 0; period < 9; period++) {
                    if (timetable[sectionKey][day]?.[period] && !timetable[sectionKey][day][period].isBreak) {
                        assignedClasses++;
                    }
                }
            }
        }
    }
    teachers.forEach(teacher => totalTeacherLoad += teacher.assignedPeriods);
    const avgTeacherLoad = teachers.length > 0 ? (totalTeacherLoad / teachers.length).toFixed(1) : 0;
    
    document.getElementById('totalClasses').textContent = totalClasses;
    document.getElementById('assignedClasses').textContent = assignedClasses;
    document.getElementById('teacherLoad').textContent = avgTeacherLoad;
    document.getElementById('freePeriods').textContent = totalClasses - assignedClasses;
}



async function saveToFirebase() {
    if (!firebaseInitialized) {
        alert("Firebase is not initialized. Please wait.");
        return;
    }
    collectAllConfigurationData();
    try {
        const saveData = { sections, subjects, teachers, timetable, lastUpdated: new Date().toISOString() };
        await window.firebase.setDoc(window.firebase.doc(window.firebase.db, "timetable", "current"), saveData);
    } catch (error) {
        console.error("Error saving to Firebase:", error);
        alert("Error saving data to cloud.");
    }
}

async function loadFromFirebase() {
    if (!firebaseInitialized) return;
    try {
        const docSnap = await window.firebase.getDoc(window.firebase.doc(window.firebase.db, "timetable", "current"));
        if (docSnap.exists()) {
            const data = docSnap.data();
            sections = data.sections || [];
            subjects = data.subjects || {};
            teachers = data.teachers || [];
            timetable = data.timetable || {};
            updateUIWithLoadedData();
            if (Object.keys(timetable).length > 0 && sections.length > 0) {
                document.getElementById('timetableCard').style.display = 'block';
                document.getElementById('teachersCard').style.display = 'block';
                displayTimetable(sections[0].id);
                displayTeachers();
                updateStats();
            }
        } else {
            setupSections(parseInt(document.getElementById('sectionCount').value));
        }
    } catch (error) {
        console.error("Error loading from Firebase:", error);
    }
}

function updateUIWithLoadedData() {
    if (!sections || sections.length === 0) return;
    document.getElementById('sectionCount').value = sections.length;
    document.getElementById('teacherCount').value = teachers.length;
    setupSections(sections.length);
    sections.forEach((section, index) => {
        const i = index + 1;
        document.getElementById(`section-${i}-name`).value = section.name;
        document.getElementById(`section-${i}-year`).value = section.year;
    });
    setupSubjectTabs(sections.length);
    sections.forEach((section, index) => {
        const i = index + 1;
        const sectionSubjects = subjects[section.id];
        if (sectionSubjects) {
            document.getElementById(`section-${i}-major-count`).value = sectionSubjects.major.length;
            document.getElementById(`section-${i}-minor-count`).value = sectionSubjects.minor.length;
            document.getElementById(`section-${i}-lab-count`).value = sectionSubjects.labs.length;
            setupSectionSubjects(i);
            const populateInputs = (type, subjectArray) => {
                subjectArray.forEach((subject, j) => {
                    const input = document.getElementById(`section-${i}-${type}-${j + 1}`);
                    if (input) {
                        input.value = subject.name;
                        const prefContainer = input.parentElement;
                        prefContainer.querySelectorAll('.preference-btn').forEach(btn => {
                            btn.classList.remove('active');
                            if (btn.dataset.pref === subject.preference) btn.classList.add('active');
                        });
                    }
                });
            };
            populateInputs('major', sectionSubjects.major);
            populateInputs('minor', sectionSubjects.minor);
            populateInputs('lab', sectionSubjects.labs);
        }
    });
    initTeacherSpecialization(teachers.length);
    teachers.forEach((teacher, index) => {
        const i = index + 1;
        document.getElementById(`teacher${i}_name`).value = teacher.name;
        document.getElementById(`teacher${i}_subject1`).value = teacher.subjects[0] || '';
        document.getElementById(`teacher${i}_subject2`).value = teacher.subjects[1] || '';
        document.getElementById(`teacher${i}_subject3`).value = teacher.subjects[2] || '';
    });
}