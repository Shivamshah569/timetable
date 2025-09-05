// Global variables
let sections = [];
let subjects = {};
let teachers = [];
let teacherWorkload = {};
let timetable = {};
let firebaseInitialized = false;

// Wait for Firebase to initialize
const checkFirebase = setInterval(() => {
    if (window.firebase) {
        clearInterval(checkFirebase);
        firebaseInitialized = true;
        document.getElementById('firebaseStatus').innerHTML = '<i class="fas fa-check-circle"></i> Connected to Firebase';
        console.log("Firebase is ready to use");
        
        // Try to load saved data automatically on page load
        setTimeout(loadFromFirebase, 1000);
    }
}, 100);

document.addEventListener('DOMContentLoaded', function() {
    // Animate elements on page load
    const animatedElements = document.querySelectorAll('.animated');
    animatedElements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('visible');
        }, 100 * index);
    });

    // Setup sections
    document.getElementById('setupSectionsBtn').addEventListener('click', function() {
        const sectionCount = parseInt(document.getElementById('sectionCount').value);
        setupSections(sectionCount);
    });

    // Save and Load buttons
    document.getElementById('saveBtn').addEventListener('click', saveToFirebase);
    document.getElementById('loadBtn').addEventListener('click', loadFromFirebase);
    
    // Generate timetable button
    document.getElementById('generateBtn').addEventListener('click', generateTimetable);

    // --- NEW HELPER FUNCTION TO READ ALL UI DATA ---
    function collectAllConfigurationData() {
        const sectionCount = parseInt(document.getElementById('sectionCount').value);
        const teacherCount = parseInt(document.getElementById('teacherCount').value);

        // 1. Collect Sections
        sections = [];
        for (let i = 1; i <= sectionCount; i++) {
            sections.push({
                id: `section-${i}`,
                name: document.getElementById(`section-${i}-name`).value || `Section ${i}`,
                year: parseInt(document.getElementById(`section-${i}-year`).value)
            });
        }
        
        // 2. Collect Subjects
        subjects = {};
        for (let i = 1; i <= sectionCount; i++) {
            const sectionId = `section-${i}`;
            subjects[sectionId] = { major: [], minor: [], labs: [] };
            
            const majorCount = parseInt(document.getElementById(`section-${i}-major-count`).value);
            const minorCount = parseInt(document.getElementById(`section-${i}-minor-count`).value);
            const labCount = parseInt(document.getElementById(`section-${i}-lab-count`).value);
            
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

            subjects[sectionId].major = getSubjectData('major', majorCount);
            subjects[sectionId].minor = getSubjectData('minor', minorCount);
            subjects[sectionId].labs = getSubjectData('lab', labCount);
        }

        // 3. Collect Teachers
        teachers = [];
        for (let i = 1; i <= teacherCount; i++) {
            const name = document.getElementById(`teacher${i}_name`)?.value;
            if (name) {
                const subject1 = document.getElementById(`teacher${i}_subject1`).value;
                const subject2 = document.getElementById(`teacher${i}_subject2`).value;
                const subject3 = document.getElementById(`teacher${i}_subject3`).value;
                teachers.push({
                    id: i,
                    name: name,
                    subjects: [subject1, subject2, subject3].filter(Boolean),
                    maxPeriodsPerDay: 3,
                    maxPeriodsPerWeek: 13,
                    assignedPeriods: 0,
                    dailyLoad: [0, 0, 0, 0, 0]
                });
            }
        }
    }

    // Setup sections based on count
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
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>
            `;
            sectionsContainer.appendChild(sectionDiv);
        }
        
        document.getElementById('subjectConfiguration').style.display = 'block';
        document.getElementById('teacherConfiguration').style.display = 'block';
        setupSubjectTabs(count);
        initTeacherSpecialization(parseInt(document.getElementById('teacherCount').value));
    }

    // Setup subject tabs for each section
    function setupSubjectTabs(sectionCount) {
        const subjectTabs = document.getElementById('subjectTabs');
        const subjectTabContent = document.getElementById('subjectTabContent');
        subjectTabs.innerHTML = '';
        subjectTabContent.innerHTML = '';
        
        for (let i = 1; i <= sectionCount; i++) {
            const tabButton = document.createElement('button');
            tabButton.className = 'section-btn' + (i === 1 ? ' active' : '');
            tabButton.textContent = `Section ${i}`;
            tabButton.dataset.section = `section-${i}`;
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
                <h4 style="margin-bottom: 1rem; color: var(--secondary);">Subjects for Section ${i}</h4>
                <div class="config-controls">
                    <div class="input-group"><label>Major Subjects</label><input type="number" id="section-${i}-major-count" min="1" value="5" max="10"></div>
                    <div class="input-group"><label>Minor Subjects</label><input type="number" id="section-${i}-minor-count" min="1" value="3" max="10"></div>
                    <div class="input-group"><label>Labs</label><input type="number" id="section-${i}-lab-count" min="1" value="2" max="5"></div>
                    <button class="config-btn" id="section-${i}-setup-btn"><i class="fas fa-plus"></i> Setup Subjects</button>
                </div>
                <div id="section-${i}-subject-inputs" class="subject-inputs"></div>
            `;
            subjectTabContent.appendChild(tabContent);
            document.getElementById(`section-${i}-setup-btn`).addEventListener('click', () => setupSectionSubjects(i));
        }
        setupSectionSubjects(1);
    }

    // Setup subjects for a specific section
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
                </div>
            `;
            container.appendChild(div);
            const buttons = div.querySelectorAll('.preference-btn');
            buttons.forEach(btn => btn.addEventListener('click', function() {
                buttons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            }));
        };
        
        for (let i = 1; i <= majorCount; i++) createSubjectInput('major', i, 'Major Subject');
        for (let i = 1; i <= minorCount; i++) createSubjectInput('minor', i, 'Minor Subject');
        for (let i = 1; i <= labCount; i++) createSubjectInput('lab', i, 'Lab');
    }

    // Initialize teacher specialization UI
    function initTeacherSpecialization(count) {
        const teacherList = document.getElementById('teacherList');
        teacherList.innerHTML = '';
        const allSubjects = getAllSubjects();
        
        for (let i = 1; i <= count; i++) {
            const teacherDiv = document.createElement('div');
            teacherDiv.className = 'input-group';
            teacherDiv.innerHTML = `
                <label>Teacher ${i} Name</label>
                <input type="text" id="teacher${i}_name" placeholder="Enter teacher name" value="Teacher ${i}">
                <label style="margin-top: 1rem;">Specialization Subjects</label>
                <div class="teacher-specialization">
                    <div class="teacher-option"><strong>Primary</strong><select id="teacher${i}_subject1">${getSubjectOptions(allSubjects)}</select><div class="priority">Priority 1</div></div>
                    <div class="teacher-option"><strong>Secondary</strong><select id="teacher${i}_subject2">${getSubjectOptions(allSubjects)}</select><div class="priority">Priority 2</div></div>
                    <div class="teacher-option"><strong>Tertiary</strong><select id="teacher${i}_subject3">${getSubjectOptions(allSubjects)}</select><div class="priority">Priority 3</div></div>
                </div>
            `;
            teacherList.appendChild(teacherDiv);
        }
    }

    // Get all subjects from all sections
    function getAllSubjects() {
        const allSubjects = new Set();
        document.querySelectorAll('.subject-inputs input[type="text"]').forEach(input => {
            if (input.value) allSubjects.add(input.value);
        });
        return Array.from(allSubjects);
    }

    // Get subject options for dropdown
    function getSubjectOptions(allSubjects) {
        return `<option value="">None</option>` + allSubjects.map(subj => `<option value="${subj}">${subj}</option>`).join('');
    }

    // Generate timetable
    function generateTimetable() {
        collectAllConfigurationData(); // Read UI before generating
        
        // Initialize timetable for all sections
        sections.forEach(section => {
            timetable[section.id] = Array(5).fill().map(() => Array(9).fill(null));
        });

        const timetableCard = document.getElementById('timetableCard');
        const teachersCard = document.getElementById('teachersCard');
        timetableCard.style.display = 'block';
        teachersCard.style.display = 'block';
        
        const sectionButtons = document.getElementById('sectionButtons');
        sectionButtons.innerHTML = '';
        sections.forEach((section, index) => {
            const button = document.createElement('button');
            button.className = 'section-btn' + (index === 0 ? ' active' : '');
            button.textContent = section.name;
            button.dataset.section = section.id;
            button.addEventListener('click', function() {
                document.querySelectorAll('#sectionButtons .section-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                displayTimetable(section.id);
            });
            sectionButtons.appendChild(button);
        });
        
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.innerHTML = '<div class="spinner"></div> Generating...';
        
        setTimeout(() => {
            // Reset teacher loads before generating
            teachers.forEach(t => {
                t.assignedPeriods = 0;
                t.dailyLoad = [0, 0, 0, 0, 0];
            });

            sections.forEach(section => generateSectionTimetable(section.id));
            
            if (sections.length > 0) {
                displayTimetable(sections[0].id);
            }
            displayTeachers();
            updateStats();
            
            generateBtn.innerHTML = '<i class="fas fa-cogs"></i> Generate Perfect Timetable';
            
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Timetable generated successfully!';
            document.querySelector('main.container').prepend(successMsg);
            setTimeout(() => successMsg.remove(), 5000);
            
            saveToFirebase(); // Auto-save after generating
        }, 500);
    }

    function generateSectionTimetable(sectionId) {
        timetable[sectionId] = Array(5).fill().map(() => Array(9).fill(null));
        
        const sectionSubjects = subjects[sectionId];
        const allClassSlots = [];
        
        const addSubjectsToSlots = (subjectList, periodsPerSubject) => {
            subjectList.forEach(subject => {
                for (let i = 0; i < periodsPerSubject; i++) {
                    allClassSlots.push({ ...subject, isLab: false });
                }
            });
        };

        // Labs are 2 periods each
        sectionSubjects.labs.forEach(lab => {
            allClassSlots.push({ ...lab, isLab: true });
        });

        const remainingPeriods = 40 - (sectionSubjects.labs.length * 2);
        const theorySubjects = [...sectionSubjects.major, ...sectionSubjects.minor];
        if (theorySubjects.length > 0) {
            const periodsPerTheory = Math.floor(remainingPeriods / theorySubjects.length);
            addSubjectsToSlots(theorySubjects, periodsPerTheory);
        }

        // Distribute any leftover periods
        let leftover = 40 - allClassSlots.length;
        for(let i = 0; i < leftover; i++) {
            if (theorySubjects.length > 0) {
                 allClassSlots.push({ ...theorySubjects[i % theorySubjects.length], isLab: false });
            }
        }

        shuffleArray(allClassSlots);

        const availableSlots = [];
        for (let day = 0; day < 5; day++) {
            for (let period = 0; period < 9; period++) {
                if (period !== 4) availableSlots.push({ day, period });
            }
        }
        shuffleArray(availableSlots);
        
        allClassSlots.forEach(subjectToAssign => {
            for (let i = 0; i < availableSlots.length; i++) {
                const { day, period } = availableSlots[i];
                
                if (subjectToAssign.isLab) {
                    if (period < 8 && !timetable[sectionId][day][period] && !timetable[sectionId][day][period + 1] && period !== 3) {
                        const teacher = findAvailableTeacher(subjectToAssign.name, day, period, true);
                        if (teacher) {
                            timetable[sectionId][day][period] = { ...subjectToAssign, teacher: teacher.name, teacherId: teacher.id };
                            timetable[sectionId][day][period + 1] = { ...subjectToAssign, subject: subjectToAssign.name + " (Cont.)", teacher: teacher.name, teacherId: teacher.id };
                            teacher.assignedPeriods += 2;
                            teacher.dailyLoad[day] += 2;
                            availableSlots.splice(i, 1); // Remove used slot
                            const nextSlotIndex = availableSlots.findIndex(s => s.day === day && s.period === period + 1);
                            if (nextSlotIndex > -1) availableSlots.splice(nextSlotIndex, 1);
                            break; // Move to next subject
                        }
                    }
                } else {
                     if (!timetable[sectionId][day][period]) {
                        const teacher = findAvailableTeacher(subjectToAssign.name, day, period, false);
                        if (teacher) {
                            timetable[sectionId][day][period] = { ...subjectToAssign, teacher: teacher.name, teacherId: teacher.id };
                            teacher.assignedPeriods++;
                            teacher.dailyLoad[day]++;
                            availableSlots.splice(i, 1); // Remove used slot
                            break; // Move to next subject
                        }
                    }
                }
            }
        });

        // Fill lunch breaks
        for (let day = 0; day < 5; day++) {
            timetable[sectionId][day][4] = { subject: "LUNCH BREAK", teacher: "-", isBreak: true };
        }
    }


    function findAvailableTeacher(subjectName, day, period, isLab) {
        const eligible = teachers.filter(t => 
            t.subjects.includes(subjectName) &&
            t.assignedPeriods < t.maxPeriodsPerWeek &&
            !isTeacherBusy(t.id, day, period) &&
            (isLab ? (t.dailyLoad[day] <= (t.maxPeriodsPerDay - 2) && !isTeacherBusy(t.id, day, period + 1)) : t.dailyLoad[day] < t.maxPeriodsPerDay)
        );
        if (eligible.length === 0) return null;
        eligible.sort((a, b) => a.assignedPeriods - b.assignedPeriods); // Prioritize least-loaded teacher
        return eligible[0];
    }

    function isTeacherBusy(teacherId, day, period) {
        for (const secId in timetable) {
            if (timetable[secId][day][period] && timetable[secId][day][period].teacherId === teacherId) {
                return true;
            }
        }
        return false;
    }
    
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function displayTimetable(sectionId) {
        const timetableBody = document.querySelector('#timetableCard tbody');
        timetableBody.innerHTML = '';
        const section = sections.find(s => s.id === sectionId);
        document.getElementById('currentSection').textContent = section ? section.name : sectionId;
        
        for (let period = 0; period < 9; period++) {
            const row = document.createElement('tr');
            let timeLabel = ['8:00', '8:45', '9:30', '10:15', '11:00 (Lunch)', '11:45', '12:30', '1:15', '2:00'][period];
            row.innerHTML = `<td>${timeLabel}</td>`;
            for (let day = 0; day < 5; day++) {
                const cell = timetable[sectionId]?.[day]?.[period];
                let cellHtml = '<td></td>';
                if (cell) {
                    let classList = cell.isBreak ? 'lunch-break' : (cell.isLab ? 'lab-period' : (period < 4 ? 'first-half' : 'second-half'));
                    cellHtml = `<td class="${classList}">${cell.subject}<br><small>${cell.teacher}</small></td>`;
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
                    <div>${teacher.subjects.map((s, i) => `<span class="subject-badge">${s} (P${i+1})</span>`).join('')}</div>
                </div>
            `;
            teachersList.appendChild(teacherCard);
        });
    }

    function updateStats() { /* ... unchanged ... */ }
    document.getElementById('teacherCount').addEventListener('change', function() { initTeacherSpecialization(parseInt(this.value)); });

    // --- UPDATED SAVE FUNCTION ---
    async function saveToFirebase() {
        if (!firebaseInitialized) {
            alert("Firebase is not initialized. Please wait.");
            return;
        }
        
        // Step 1: Read all current data from the UI first!
        collectAllConfigurationData();
        
        try {
            const saveData = {
                sections: sections,
                subjects: subjects,
                teachers: teachers,
                timetable: timetable,
                lastUpdated: new Date().toISOString()
            };
            
            await window.firebase.setDoc(window.firebase.doc(window.firebase.db, "timetable", "current"), saveData);
            
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Configuration saved to cloud successfully!';
            document.querySelector('main.container').prepend(successMsg);
            
            setTimeout(() => successMsg.remove(), 4000);
            
        } catch (error) {
            console.error("Error saving to Firebase:", error);
            alert("Error saving data to cloud.");
        }
    }

    // --- UNCHANGED LOAD FUNCTION ---
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

    // --- UPDATED UI RESTORE FUNCTION ---
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
});

// Note: A placeholder updateStats function is included as it was in the original.
// Its internal logic is less critical to the save/load bug.
function updateStats() {
    let assignedClasses = 0;
    let totalTeacherLoad = 0;
    const sectionCount = sections.length;
    const totalClasses = sectionCount * 5 * 8;
    
    for (const sectionKey in timetable) {
        for (let day = 0; day < 5; day++) {
            for (let period = 0; period < 9; period++) {
                if (timetable[sectionKey]?.[day]?.[period] && !timetable[sectionKey][day][period].isBreak) {
                    assignedClasses++;
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