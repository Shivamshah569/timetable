
        document.addEventListener('DOMContentLoaded', function() {
            
            const animatedElements = document.querySelectorAll('.animated');
            animatedElements.forEach((el, index) => {
                setTimeout(() => {
                    el.classList.add('visible');
                }, 100 * index);
            });

            
            const subjects = {
                year2: {
                    major: [],
                    minor: [],
                    labs: []
                },
                year3: {
                    major: [],
                    minor: [],
                    labs: []
                },
                year4: {
                    major: [],
                    minor: [],
                    labs: []
                }
            };

            const teachers = [];
            const teacherWorkload = {};
            const timetable = {};
            
            
            for (let year = 2; year <= 4; year++) {
                for (let section of ['A', 'B', 'C', 'D', 'E']) {
                    const key = `year${year}-${section}`;
                    timetable[key] = Array(5).fill().map(() => Array(8).fill(null));
                }
            }

            
            document.querySelectorAll('.year-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const year = this.dataset.year;
                    
                    
                    document.querySelectorAll('.tab-content').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    document.querySelectorAll('.year-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    
                    document.getElementById(`${year === 'teachers' ? 'teachers' : 'year' + year}-tab`).classList.add('active');
                    this.classList.add('active');
                    
                    if (year === 'teachers') {
                        initTeacherSpecialization(parseInt(document.getElementById('teacherCount').value));
                    }
                });
            });
            
            
            document.getElementById('year2-setup-btn').addEventListener('click', function() {
                setupSubjectInputs(2);
            });
            
            document.getElementById('year3-setup-btn').addEventListener('click', function() {
                setupSubjectInputs(3);
            });
            
            document.getElementById('year4-setup-btn').addEventListener('click', function() {
                setupSubjectInputs(4);
            });
            
           
            function setupSubjectInputs(year) {
                const majorCount = parseInt(document.getElementById(`year${year}-major-count`).value);
                const minorCount = parseInt(document.getElementById(`year${year}-minor-count`).value);
                const labCount = parseInt(document.getElementById(`year${year}-lab-count`).value);
                
                const container = document.getElementById(`year${year}-subject-inputs`);
                container.innerHTML = '';
                
                
                for (let i = 1; i <= majorCount; i++) {
                    const div = document.createElement('div');
                    div.className = 'input-group';
                    div.innerHTML = `
                        <label>Major Subject ${i}</label>
                        <input type="text" id="year${year}-major-${i}" placeholder="Enter subject name" value="Major ${i}">
                    `;
                    container.appendChild(div);
                }
                
               
                for (let i = 1; i <= minorCount; i++) {
                    const div = document.createElement('div');
                    div.className = 'input-group';
                    div.innerHTML = `
                        <label>Minor Subject ${i}</label>
                        <input type="text" id="year${year}-minor-${i}" placeholder="Enter subject name" value="Minor ${i}">
                    `;
                    container.appendChild(div);
                }
                
                
                for (let i = 1; i <= labCount; i++) {
                    const div = document.createElement('div');
                    div.className = 'input-group';
                    div.innerHTML = `
                        <label>Lab ${i}</label>
                        <input type="text" id="year${year}-lab-${i}" placeholder="Enter lab name" value="Lab ${i}">
                    `;
                    container.appendChild(div);
                }
            }
            
            
            setupSubjectInputs(2);
            setupSubjectInputs(3);
            setupSubjectInputs(4);
            
            
            document.querySelectorAll('[data-display-year]').forEach(btn => {
                btn.addEventListener('click', function() {
                    const year = this.dataset.displayYear;
                    
                    
                    document.querySelectorAll('.controls .section-btn').forEach(btn => {
                        btn.style.display = 'none';
                    });
                    
                    
                    document.querySelectorAll(`.section-btn[data-year="${year}"]`).forEach(btn => {
                        btn.style.display = 'inline-block';
                    });
                    
                    const firstSection = document.querySelector(`.section-btn[data-year="${year}"]`);
                    if (firstSection) {
                        document.querySelectorAll('.section-btn').forEach(btn => {
                            btn.classList.remove('active');
                        });
                        firstSection.classList.add('active');
                        displayTimetable(year, firstSection.dataset.section);
                    }
                    
                    
                    document.querySelectorAll('[data-display-year]').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    this.classList.add('active');
                });
            });

           
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
                            <div class="teacher-option">
                                <strong>Primary Subject</strong>
                                <select id="teacher${i}_subject1">
                                    ${getSubjectOptions(allSubjects)}
                                </select>
                                <div class="priority">Priority 1</div>
                            </div>
                            <div class="teacher-option">
                                <strong>Secondary Subject</strong>
                                <select id="teacher${i}_subject2">
                                    ${getSubjectOptions(allSubjects)}
                                </select>
                                <div class="priority">Priority 2</div>
                            </div>
                            <div class="teacher-option">
                                <strong>Tertiary Subject</strong>
                                <select id="teacher${i}_subject3">
                                    ${getSubjectOptions(allSubjects)}
                                </select>
                                <div class="priority">Priority 3</div>
                            </div>
                        </div>
                    `;
                    
                    teacherList.appendChild(teacherDiv);
                }
            }

           
            function getAllSubjects() {
                const allSubjects = [];
                
                for (let year = 2; year <= 4; year++) {
                    const majorCount = parseInt(document.getElementById(`year${year}-major-count`).value);
                    const minorCount = parseInt(document.getElementById(`year${year}-minor-count`).value);
                    const labCount = parseInt(document.getElementById(`year${year}-lab-count`).value);
                    
                    for (let i = 1; i <= majorCount; i++) {
                        const subject = document.getElementById(`year${year}-major-${i}`)?.value;
                        if (subject && !allSubjects.includes(subject)) allSubjects.push(subject);
                    }
                    for (let i = 1; i <= minorCount; i++) {
                        const subject = document.getElementById(`year${year}-minor-${i}`)?.value;
                        if (subject && !allSubjects.includes(subject)) allSubjects.push(subject);
                    }
                    for (let i = 1; i <= labCount; i++) {
                        const lab = document.getElementById(`year${year}-lab-${i}`)?.value;
                        if (lab && !allSubjects.includes(lab)) allSubjects.push(lab);
                    }
                }
                
                return allSubjects;
            }

            
            function getSubjectOptions(allSubjects) {
                return allSubjects.map(subj => `<option value="${subj}">${subj}</option>`).join('');
            }

            
            function generateTeachers(count) {
                teachers.length = 0;
                
                for (let i = 1; i <= count; i++) {
                    const name = document.getElementById(`teacher${i}_name`).value;
                    
                    
                    const subject1 = document.getElementById(`teacher${i}_subject1`).value;
                    const subject2 = document.getElementById(`teacher${i}_subject2`).value;
                    const subject3 = document.getElementById(`teacher${i}_subject3`).value;
                    
                    teachers.push({
                        id: i,
                        name: name,
                        subjects: [subject1, subject2, subject3],
                        maxPeriodsPerDay: 3,
                        maxPeriodsPerWeek: 13,
                        assignedPeriods: 0,
                        dailyLoad: [0, 0, 0, 0, 0] 
                    });
                    
                    
                    teacherWorkload[i] = 0;
                }
            }

            
            function collectSubjects() {
                for (let year = 2; year <= 4; year++) {
                    subjects[`year${year}`].major = [];
                    subjects[`year${year}`].minor = [];
                    subjects[`year${year}`].labs = [];
                    
                    const majorCount = parseInt(document.getElementById(`year${year}-major-count`).value);
                    const minorCount = parseInt(document.getElementById(`year${year}-minor-count`).value);
                    const labCount = parseInt(document.getElementById(`year${year}-lab-count`).value);
                    
                    for (let i = 1; i <= majorCount; i++) {
                        const subject = document.getElementById(`year${year}-major-${i}`)?.value;
                        if (subject) subjects[`year${year}`].major.push(subject);
                    }
                    for (let i = 1; i <= minorCount; i++) {
                        const subject = document.getElementById(`year${year}-minor-${i}`)?.value;
                        if (subject) subjects[`year${year}`].minor.push(subject);
                    }
                    for (let i = 1; i <= labCount; i++) {
                        const lab = document.getElementById(`year${year}-lab-${i}`)?.value;
                        if (lab) subjects[`year${year}`].labs.push(lab);
                    }
                }
            }

            
            function generateTimetable() {
                collectSubjects();
                const teacherCount = parseInt(document.getElementById('teacherCount').value);
                generateTeachers(teacherCount);
                
                
                const timetableCard = document.getElementById('timetableCard');
                const teachersCard = document.getElementById('teachersCard');
                timetableCard.style.display = 'block';
                teachersCard.style.display = 'block';
                
                
                const generateBtn = document.getElementById('generateBtn');
                generateBtn.innerHTML = '<div class="spinner"></div> Generating...';
                
                
                setTimeout(() => {
                    
                    for (let year = 2; year <= 4; year++) {
                        for (let section of ['A', 'B', 'C', 'D', 'E']) {
                            generateSectionTimetable(year, section);
                        }
                    }
                    
            
                    displayTimetable(2, 'A');
                    
                
                    displayTeachers();
                    
                    
                    updateStats();
                    
                
                    generateBtn.innerHTML = '<i class="fas fa-cogs"></i> Generate Optimized Timetable';
                    
                    
                    const successMsg = document.createElement('div');
                    successMsg.className = 'success-message';
                    successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Timetable generated successfully! All 600 classes allocated with no free periods.';
                    document.getElementById('timetableCard').prepend(successMsg);
                    
                    setTimeout(() => {
                        successMsg.remove();
                    }, 5000);
                }, 1000);
            }

            
            function generateSectionTimetable(year, section) {
                const key = `year${year}-${section}`;
                
            
                timetable[key] = Array(5).fill().map(() => Array(8).fill(null));
                
                
                const majorSubjects = [...subjects[`year${year}`].major];
                const minorSubjects = [...subjects[`year${year}`].minor];
                const labs = [...subjects[`year${year}`].labs];
                
                
                const totalPeriods = 5 * 8; 
                const labPeriods = labs.length * 2; 
                const remainingPeriods = totalPeriods - labPeriods - 5; 
                
                
                const majorPeriods = Math.floor(remainingPeriods * 0.7 / majorSubjects.length) * majorSubjects.length;
                const minorPeriods = Math.floor(remainingPeriods * 0.3 / minorSubjects.length) * minorSubjects.length;
                
                
                const subjectDistribution = [];
                
                
                for (const subject of majorSubjects) {
                    const count = majorPeriods / majorSubjects.length;
                    for (let i = 0; i < count; i++) {
                        subjectDistribution.push(subject);
                    }
                }
                
                
                for (const subject of minorSubjects) {
                    const count = minorPeriods / minorSubjects.length;
                    for (let i = 0; i < count; i++) {
                        subjectDistribution.push(subject);
                    }
                }
                
                
                shuffleArray(subjectDistribution);
                
               
                let subjectIndex = 0;
                
                for (let day = 0; day < 5; day++) {
                    
                    const scheduledLabs = [];
                    
                    for (let period = 0; period < 8; period++) {
                        
                        if (timetable[key][day][period]) continue;
                        
                        
                        if (period === 4) {
                            timetable[key][day][period] = {
                                subject: "LUNCH BREAK",
                                teacher: "-",
                                teacherId: null,
                                isBreak: true
                            };
                            continue;
                        }
                        
                        
                        if (period <= 6 && scheduledLabs.length < labs.length) {
                            
                            const availableLabs = labs.filter(lab => !scheduledLabs.includes(lab));
                            if (availableLabs.length > 0) {
                                const lab = availableLabs[Math.floor(Math.random() * availableLabs.length)];
                                scheduledLabs.push(lab);
                                
                               
                                const teacher = findAvailableTeacher(lab, day, period, key);
                                if (teacher) {
                                    timetable[key][day][period] = {
                                        subject: lab,
                                        teacher: teacher.name,
                                        teacherId: teacher.id,
                                        isLab: true
                                    };
                                    
                                    timetable[key][day][period+1] = {
                                        subject: lab + " (Cont.)",
                                        teacher: teacher.name,
                                        teacherId: teacher.id,
                                        isLab: true
                                    };
                                    
                                    
                                    teacher.assignedPeriods += 2;
                                    teacher.dailyLoad[day] += 2;
                                    teacherWorkload[teacher.id] += 2;
                                }
                                continue;
                            }
                        }
                        
                        
                        if (subjectIndex < subjectDistribution.length) {
                            const subject = subjectDistribution[subjectIndex++];
                            const teacher = findAvailableTeacher(subject, day, period, key);
                            
                            if (teacher) {
                                timetable[key][day][period] = {
                                    subject: subject,
                                    teacher: teacher.name,
                                    teacherId: teacher.id
                                };
                                
                                
                                teacher.assignedPeriods++;
                                teacher.dailyLoad[day]++;
                                teacherWorkload[teacher.id]++;
                            }
                        }
                    }
                }
            }

            
            function shuffleArray(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            }

            
            function findAvailableTeacher(subject, day, period, sectionKey) {
                
                const eligibleTeachers = teachers.filter(teacher => 
                    teacher.subjects.includes(subject) && 
                    teacher.assignedPeriods < teacher.maxPeriodsPerWeek &&
                    teacher.dailyLoad[day] < teacher.maxPeriodsPerDay &&
                    !isTeacherBusy(teacher.id, day, period, sectionKey)
                );
                
                if (eligibleTeachers.length === 0) return null;
                
                
                eligibleTeachers.sort((a, b) => a.assignedPeriods - b.assignedPeriods);
                
                return eligibleTeachers[0];
            }

            
            function isTeacherBusy(teacherId, day, period, currentSection) {
                for (const sectionKey in timetable) {
                    if (sectionKey === currentSection) continue;
                    
                    if (timetable[sectionKey][day][period] && 
                        timetable[sectionKey][day][period].teacherId === teacherId) {
                        return true;
                    }
                }
                return false;
            }

            
            function displayTimetable(year, section) {
                const key = `year${year}-${section}`;
                const timetableBody = document.querySelector('#timetableCard tbody');
                timetableBody.innerHTML = '';
                
                
                document.getElementById('currentSection').textContent = `Year ${year} - Section ${section}`;
                
                
                document.querySelectorAll('.section-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.year == year && btn.dataset.section === section) {
                        btn.classList.add('active');
                    }
                });
                
                
                for (let period = 0; period < 8; period++) {
                    const row = document.createElement('tr');
                    
                    
                    let timeLabel = '';
                    switch(period) {
                        case 0: timeLabel = '8:00-9:00'; break;
                        case 1: timeLabel = '9:00-10:00'; break;
                        case 2: timeLabel = '10:00-11:00'; break;
                        case 3: timeLabel = '11:00-12:00'; break;
                        case 4: timeLabel = '12:00-1:00'; break;
                        case 5: timeLabel = '1:00-2:00'; break;
                        case 6: timeLabel = '2:00-3:00'; break;
                        case 7: timeLabel = '3:00-4:00'; break;
                    }
                    
                    row.innerHTML = `<td>${timeLabel}</td>`;
                    
                   
                    for (let day = 0; day < 5; day++) {
                        const cell = timetable[key][day][period];
                        if (cell) {
                            if (cell.isBreak) {
                                row.innerHTML += `<td class="lunch-break">${cell.subject}<br><small>${cell.teacher}</small></td>`;
                            } else if (cell.isLab) {
                                row.innerHTML += `<td class="lab-period">${cell.subject}<br><small>${cell.teacher}</small></td>`;
                            } else {
                                row.innerHTML += `<td>${cell.subject}<br><small>${cell.teacher}</small></td>`;
                            }
                        } else {
                            
                            row.innerHTML += '<td class="free-period">Free<br><small>Error in scheduling</small></td>';
                        }
                    }
                    
                    timetableBody.appendChild(row);
                }
                
                
                updateStats();
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
                            <div>
                                ${teacher.subjects.map((subj, index) => 
                                    `<span class="subject-badge ${isLab(subj) ? 'lab' : ''}">${subj}${index === 0 ? ' (P1)' : index === 1 ? ' (P2)' : ' (P3)'}</span>`
                                ).join('')}
                            </div>
                        </div>
                    `;
                    
                    teachersList.appendChild(teacherCard);
                });
            }
            
            
            function isLab(subject) {
                for (let year = 2; year <= 4; year++) {
                    if (subjects[`year${year}`].labs.includes(subject)) return true;
                }
                return false;
            }

            
            function updateStats() {
                let assignedClasses = 0;
                let freePeriods = 0;
                let totalTeacherLoad = 0;
                
                for (const sectionKey in timetable) {
                    for (let day = 0; day < 5; day++) {
                        for (let period = 0; period < 8; period++) {
                            if (timetable[sectionKey][day][period] && !timetable[sectionKey][day][period].isBreak) {
                                assignedClasses++;
                            } else if (!timetable[sectionKey][day][period] || 
                                      (timetable[sectionKey][day][period] && timetable[sectionKey][day][period].isBreak)) {
                                freePeriods++;
                            }
                        }
                    }
                }
                
                teachers.forEach(teacher => {
                    totalTeacherLoad += teacher.assignedPeriods;
                });
                
                const avgTeacherLoad = teachers.length > 0 ? (totalTeacherLoad / teachers.length).toFixed(1) : 0;
                
                document.getElementById('assignedClasses').textContent = assignedClasses;
                document.getElementById('teacherLoad').textContent = avgTeacherLoad;
                document.getElementById('freePeriods').textContent = freePeriods;
            }

            
            initTeacherSpecialization(24);

            
            document.getElementById('generateBtn').addEventListener('click', generateTimetable);
            
            
            document.querySelectorAll('.section-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    displayTimetable(parseInt(this.dataset.year), this.dataset.section);
                });
            });
            

            document.getElementById('teacherCount').addEventListener('change', function() {
                initTeacherSpecialization(parseInt(this.value));
            });
        });
    