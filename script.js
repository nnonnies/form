document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const newSurveyBtn = document.getElementById('new-survey-btn');
    const surveyFormContainer = document.getElementById('survey-form-container');
    const surveyForm = document.getElementById('survey-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const resultsTbody = document.getElementById('results-tbody');
    const resultsTable = document.getElementById('results-table');
    const resultsTableHead = resultsTable.querySelector('thead');
    const noResultsMessage = document.getElementById('no-results-message');
    const totalFormsSpan = document.getElementById('total-forms');
    const summaryDetailsDiv = document.getElementById('summary-details');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const seeMoreBtn = document.getElementById('seeMoreRecords'); // ปุ่ม More
    const seeLessBtn = document.getElementById('seeLessRecords'); // ปุ่ม Less
    const resultsContainer = document.getElementById('results-container'); // เพิ่มสำหรับ scroll
    //-ตัวแปรสำหรับปุ่ม Print
    const printSummaryBtn = document.getElementById('print-summary-btn');
    // --- Configuration ---
    const localStorageKey = 'surveySubmissions';
    const rowsPerLoad = 5; // จำนวนแถวที่จะแสดง/ซ่อน ต่อการกด 1 ครั้ง
    let currentlyVisibleRows = 0; // ตัวแปรเก็บจำนวนแถวที่แสดงอยู่ปัจจุบัน

    // --- Questions Data ---
    const questions = [
        "1. สถานที่ การจัดประชุม", "2. อุณหภูมิ และการถ่ายเทอากาศในห้องประชุม", "3. แสงสว่าง เสียง เวที ป้าย",
        "4. อาหารกลางวัน", "5. อาหารว่าง", "6. การติดต่อประสานงานของผู้จัดการประชุม",
        "7. เอกสารประกอบการประชุมมีประโยชน์", "8. หัวข้อการบรรยาย มีสาระ มีความรู้ สามารถนำไปใช้ได้",
        "9. วิทยากรผู้บรรยายของมีความรู้", "10. เวลาที่ใช้บรรยายของวิทยากร ตรงเวลา เหมาะสม",
        "11. ผู้ประชุม มีโอกาสได้แลกเปลี่ยนความรู้ประสบการณ์", "12. ประโยชน์ที่ได้รับจากวิทยากรโดยรวม",
        "13. ผู้ดำเนินรายการ (พิธีกร) มีความรู้ ความเข้าใจในการดำเนินการประชุม",
        "14. คณะกรรมการสมาคม มีอัธยาศัย มีมิตรไมตรี เป็นกันเอง สุภาพ อ่อนโยนกับผู้เข้าร่วมประชุม",
        "15. ผู้เข้าประชุมประทับใจกระบวนการจัดประชุม / สัมมนา",
        "16. การให้บริการ การดูแล ของตัวแทนบริษัทต่างๆที่เข้าร่วมกิจกรรมการประชุมครั้งนี้"
    ];
    const ratingLevels = ["มากที่สุด", "มาก", "ปานกลาง", "น้อยที่สุด"];

    // --- Functions ---

    function loadSubmissions() {
        const submissions = localStorage.getItem(localStorageKey);
        return submissions ? JSON.parse(submissions) : [];
    }

    function saveSubmissions(submissions) {
        localStorage.setItem(localStorageKey, JSON.stringify(submissions));
    }

    function generateFormQuestions() {
        const formTbody = surveyForm.querySelector('tbody');
        formTbody.innerHTML = '';
        questions.forEach((q, index) => {
            const row = formTbody.insertRow();
            const qCell = row.insertCell();
            qCell.textContent = q;
            qCell.style.fontWeight = '500';
            ratingLevels.forEach(level => {
                const cell = row.insertCell();
                const radioId = `q${index + 1}_${level.replace(/\s+/g, '')}`;
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `q${index + 1}`;
                radio.value = level;
                radio.required = true;
                radio.id = radioId;
                const label = document.createElement('label');
                label.htmlFor = radioId;
                label.style.cursor = 'pointer';
                label.appendChild(radio);
                cell.appendChild(label);
            });
        });
    }

    function generateResultsHeader() {
        resultsTableHead.innerHTML = '';
        const headerRow = resultsTableHead.insertRow();
        const thForm = document.createElement('th');
        thForm.textContent = 'ลำดับ';
        thForm.style.width = '5%';
        headerRow.appendChild(thForm);
        questions.forEach((q, index) => {
            const th = document.createElement('th');
            const questionParts = q.match(/^(\d+)\.\s*(.*)/);
            th.textContent = `ข้อ ${questionParts ? questionParts[1] : index + 1}`;
            th.title = questionParts ? questionParts[2] : q;
            headerRow.appendChild(th);
        });
    }

    // --- Update More/Less Button Visibility ---
    function updateMoreLessButtons() {
        const allRows = resultsTbody.querySelectorAll('tr');
        const totalRows = allRows.length;
        // const buttonContainer = seeMoreBtn.parentElement; // ไม่ต้องควบคุม container จากตรงนี้แล้ว

        // *** ตรวจสอบก่อนว่าปุ่มมีจริงหรือไม่ ***
        if (!seeMoreBtn || !seeLessBtn) {
             console.warn("More/Less buttons not found"); // แจ้งเตือนถ้าหาปุ่มไม่เจอ
             return;
        }

        // Hide/Show More button
        if (currentlyVisibleRows < totalRows) {
            seeMoreBtn.style.display = 'inline-block';
        } else {
            seeMoreBtn.style.display = 'none';
        }

        // Hide/Show Less button
        // แสดงปุ่ม Less ต่อเมื่อแถวที่แสดงอยู่ > จำนวนแถวเริ่มต้น
        if (currentlyVisibleRows > rowsPerLoad) {
            seeLessBtn.style.display = 'inline-block';
        } else {
            seeLessBtn.style.display = 'none';
        }
    }

    // --- Render the results table (Corrected version for More/Less) ---
    function renderResultsTable() {
        const submissions = loadSubmissions();
        resultsTbody.innerHTML = ''; // Clear existing rows before adding new ones
        // generateResultsHeader(); // Header is generated once on load now

        // Populate all rows first
        submissions.forEach((submission, index) => {
            const row = resultsTbody.insertRow();
            row.style.display = 'none'; // ***สำคัญ: ซ่อนแถวไว้ก่อน***
            const cellIndex = row.insertCell();
            cellIndex.textContent = index + 1;
            cellIndex.style.textAlign = 'center';
            questions.forEach((q, qIndex) => {
                const cell = row.insertCell();
                const answer = submission[`q${qIndex + 1}`] || '-';
                cell.textContent = answer;
                cell.style.textAlign = 'center';
            });
        });

        const allRows = resultsTbody.querySelectorAll('tr');
        const totalRows = allRows.length;

        // Determine and show initial rows
        const initialToShow = Math.min(rowsPerLoad, totalRows);
        for (let i = 0; i < initialToShow; i++) {
            if (allRows[i]) {
                allRows[i].style.display = ''; // ***สำคัญ: แสดงแถวเริ่มต้น***
            }
        }
        currentlyVisibleRows = initialToShow; // ***สำคัญ: ตั้งค่าจำนวนแถวที่แสดง***

        // Update visibility of table/message and buttons
        toggleResultsDisplay(totalRows > 0);
        updateMoreLessButtons(); // ***สำคัญ: อัปเดตสถานะปุ่ม***
    }

    function toggleResultsDisplay(hasData) {
        const tableContainerDiv = resultsTable.parentElement; // The div with overflow-x
        // *** เพิ่มการตรวจสอบว่าหา Container เจอ ***
        if (!tableContainerDiv) {
             console.error("Table container div not found!");
             return;
        }

        if (hasData) {
            tableContainerDiv.style.display = 'block'; // Show the container div (contains table AND buttons)
            resultsTable.style.display = 'table';    // Show table specifically
            noResultsMessage.classList.add('hidden');
        } else {
            tableContainerDiv.style.display = 'none'; // Hide container if no data
            resultsTable.style.display = 'none';    // Hide table specifically
            noResultsMessage.classList.remove('hidden');
        }
         // การเรียก updateMoreLessButtons() ตรงนี้ยังถูกต้องอยู่
        updateMoreLessButtons();
    }
    function renderSummary() {
        const submissions = loadSubmissions();
        const total = submissions.length;
        totalFormsSpan.textContent = total;
        summaryDetailsDiv.innerHTML = '';

        if (total === 0) {
            summaryDetailsDiv.textContent = 'ยังไม่มีข้อมูลสำหรับสรุปผล';
            return;
        }

        questions.forEach((q, index) => {
            const qKey = `q${index + 1}`;
            const counts = {};
            ratingLevels.forEach(level => counts[level] = 0);
            submissions.forEach(submission => {
                const answer = submission[qKey];
                if (answer && counts.hasOwnProperty(answer)) {
                    counts[answer]++;
                }
            });
            const questionSummaryDiv = document.createElement('div');
            const questionTitle = document.createElement('strong');
            const questionParts = q.match(/^(\d+)\.\s*(.*)/);
            questionTitle.textContent = `${questionParts ? questionParts[1] : index + 1}. ${questionParts ? questionParts[2] : q}`;
            questionSummaryDiv.appendChild(questionTitle);
            ratingLevels.forEach(level => {
                const countSpan = document.createElement('span');
                countSpan.textContent = `${level}: ${counts[level]} คน`;
                questionSummaryDiv.appendChild(countSpan);
            });
            summaryDetailsDiv.appendChild(questionSummaryDiv);
        });
    }

    // --- Event Listeners ---

    newSurveyBtn.addEventListener('click', () => {
        surveyForm.reset();
        generateFormQuestions();
        surveyFormContainer.classList.remove('hidden');
        window.scrollTo({ top: surveyFormContainer.offsetTop - 20, behavior: 'smooth' });
    });

    surveyForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(surveyForm);
        const submission = {};
        let allAnswered = true;
        for (let i = 0; i < questions.length; i++) {
            const qKey = `q${i + 1}`;
            const answer = formData.get(qKey);
            if (!answer) {
                allAnswered = false;
                const questionParts = questions[i].match(/^(\d+)\.\s*(.*)/);
                const questionNumber = questionParts ? questionParts[1] : i + 1;
                alert(`กรุณาตอบคำถามข้อ ${questionNumber}`);
                const firstRadioOfQuestion = surveyForm.querySelector(`input[name="${qKey}"]`);
                if (firstRadioOfQuestion) {
                    firstRadioOfQuestion.closest('tr').scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstRadioOfQuestion.focus();
                }
                break;
            }
            submission[qKey] = answer;
        }
        if (allAnswered) {
            const submissions = loadSubmissions();
            submissions.push(submission);
            saveSubmissions(submissions);
            renderResultsTable(); // Re-render table which handles More/Less state
            renderSummary();
            surveyFormContainer.classList.add('hidden');
            window.scrollTo({ top: resultsContainer.offsetTop - 20, behavior: 'smooth' });
        }
    });

    // *** Listener ของ cancelBtn และ clearAllBtn มีแค่ชุดเดียวพอ ***
    cancelBtn.addEventListener('click', () => {
        surveyFormContainer.classList.add('hidden');
    });

    clearAllBtn.addEventListener('click', () => {
        const isConfirmed = confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลที่บันทึกไว้ทั้งหมด? ข้อมูลจะหายไปอย่างถาวรและไม่สามารถกู้คืนได้');
        if (isConfirmed) {
            localStorage.removeItem(localStorageKey);
            renderResultsTable(); // Re-render table which handles More/Less state
            renderSummary();
            alert('ข้อมูลทั้งหมดถูกลบเรียบร้อยแล้ว');
        }
    });

    // --- More Button Event Listener ---
    seeMoreBtn.addEventListener('click', () => {
        const allRows = resultsTbody.querySelectorAll('tr');
        const totalRows = allRows.length;
        // Prevent showing more than available
        const newVisibleCount = Math.min(currentlyVisibleRows + rowsPerLoad, totalRows);

        for (let i = currentlyVisibleRows; i < newVisibleCount; i++) {
             if (allRows[i]) {
                allRows[i].style.display = ''; // Show row
             }
        }
        currentlyVisibleRows = newVisibleCount;
        updateMoreLessButtons();
    });

    // --- Less Button Event Listener ---
    seeLessBtn.addEventListener('click', () => {
        const allRows = resultsTbody.querySelectorAll('tr');
        // Calculate new target count, minimum is initial load count
        const newVisibleCount = Math.max(rowsPerLoad, currentlyVisibleRows - rowsPerLoad);

        // Hide rows from the new target count up to the currently visible count
        for (let i = newVisibleCount; i < currentlyVisibleRows; i++) {
             if (allRows[i]) {
                allRows[i].style.display = 'none'; // Hide row
             }
        }
        currentlyVisibleRows = newVisibleCount; // Update the count
        updateMoreLessButtons();
    });

    // --- Print Summary Button Event Listener (ใช้ window.print) ---
    printSummaryBtn.addEventListener('click', () => {
        const submissions = loadSubmissions();
        if (submissions.length === 0) {
            alert('ยังไม่มีข้อมูลสรุปผลให้พิมพ์');
            return;
        }
        // สั่ง Print โดยตรง (ใช้ CSS @media print จัดการเนื้อหา)
        window.print();
    });

    // --- Initial Page Load ---
    generateResultsHeader(); // Generate table header structure once on load
    renderResultsTable();   // Render table and handle initial More/Less state
    renderSummary();      // Render summary

});