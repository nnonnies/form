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
    const summaryContainer = document.getElementById('summary-container');
    const summaryTitle = document.getElementById('summary-title');
    const summaryTbody = document.getElementById('summary-tbody');
    const summaryTable = document.getElementById('summary-table');
    const noSummaryMessage = document.getElementById('no-summary-message');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const seeMoreBtn = document.getElementById('seeMoreRecords');
    const seeLessBtn = document.getElementById('seeLessRecords');
    const resultsContainer = document.getElementById('results-container');
    const printSummaryBtn = document.getElementById('print-summary-btn');

    // --- Chart References ---
    const pieChartCanvas = document.getElementById('pieChartCanvas');
    const stackedColumnChartCanvas = document.getElementById('stackedColumnChartCanvas');
    const pieChartContainer = document.getElementById('pie-chart-container');
    const stackedChartContainer = document.getElementById('stacked-chart-container');

    // --- Chart Instances (Global within this scope) ---
    let pieChartInstance = null;
    let stackedColumnChartInstance = null;

    // --- Configuration --- (ประกาศครั้งเดียว)
    const localStorageKey = 'surveySubmissions';
    const rowsPerLoad = 5;
    let currentlyVisibleRows = 0;

    // --- Questions Data --- (ประกาศครั้งเดียว)
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
    const ratingLevelsInternal = ["มากที่สุด", "มาก", "ปานกลาง", "น้อยที่สุด"];
    const ratingLevelLabels = ["มากที่สุด", "มาก(1)", "ปานกลาง(2)", "น้อยที่สุด(2)"]; // สำหรับ header ตาราง (ถ้าต้องการ)
    const chartColors = { // กำหนดสีสำหรับกราฟ
        มากที่สุด: 'rgba(75, 192, 192, 0.8)', // Teal
        มาก: 'rgba(54, 162, 235, 0.8)', // Blue
        ปานกลาง: 'rgba(255, 206, 86, 0.8)', // Yellow
        น้อยที่สุด: 'rgba(255, 99, 132, 0.8)' // Red
    };

    // --- Functions ---

    function loadSubmissions() {
        const submissions = localStorage.getItem(localStorageKey);
        return submissions ? JSON.parse(submissions) : [];
    }

    function saveSubmissions(submissions) {
        localStorage.setItem(localStorageKey, JSON.stringify(submissions));
    }

    function generateFormQuestions() {
        // (โค้ดเดิมของ generateFormQuestions - ตรวจสอบว่ามีอยู่ครบ)
        const formTbody = surveyForm.querySelector('tbody');
        formTbody.innerHTML = '';
        questions.forEach((q, index) => {
            const row = formTbody.insertRow();
            const qCell = row.insertCell();
            qCell.textContent = q;
            qCell.style.fontWeight = '500';
            ratingLevelsInternal.forEach(level => {
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
        // (โค้ดเดิมของ generateResultsHeader - ตรวจสอบว่ามีอยู่ครบ)
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

    function updateMoreLessButtons() {
        // (โค้ดเดิมของ updateMoreLessButtons - ตรวจสอบว่ามีอยู่ครบ)
        const allRows = resultsTbody.querySelectorAll('tr');
        const totalRows = allRows.length;
        if (!seeMoreBtn || !seeLessBtn) {
            console.warn("More/Less buttons not found");
            return;
        }
        seeMoreBtn.style.display = (currentlyVisibleRows < totalRows) ? 'inline-block' : 'none';
        seeLessBtn.style.display = (currentlyVisibleRows > rowsPerLoad) ? 'inline-block' : 'none';
    }

    function renderResultsTable() {
        // (โค้ดเดิมของ renderResultsTable - ตรวจสอบว่ามีอยู่ครบ)
         const submissions = loadSubmissions();
        resultsTbody.innerHTML = '';

        submissions.forEach((submission, index) => {
            const row = resultsTbody.insertRow();
            row.style.display = 'none'; // Hide initially
            const cellIndex = row.insertCell();
            cellIndex.textContent = index + 1;
            cellIndex.style.textAlign = 'center';
            questions.forEach((q, qIndex) => {
                const cell = row.insertCell();
                const answer = submission[`q${qIndex + 1}`] || '-'; // Use internal key
                cell.textContent = answer;
                cell.style.textAlign = 'center';
            });
        });

        const allRows = resultsTbody.querySelectorAll('tr');
        const totalRows = allRows.length;
        const initialToShow = Math.min(rowsPerLoad, totalRows);

        for (let i = 0; i < initialToShow; i++) {
            if (allRows[i]) {
                allRows[i].style.display = '';
            }
        }
        currentlyVisibleRows = initialToShow;
        toggleResultsDisplay(totalRows > 0);
        updateMoreLessButtons();
    }

    function toggleResultsDisplay(hasData) {
        // (โค้ดเดิมของ toggleResultsDisplay - ตรวจสอบว่ามีอยู่ครบ)
        const tableContainerDiv = resultsTable.parentElement;
        if (!tableContainerDiv) {
             console.error("Results table container div not found!");
             return;
        }
        if (hasData) {
            tableContainerDiv.style.display = 'block';
            resultsTable.style.display = 'table';
            noResultsMessage.classList.add('hidden');
            clearAllBtn.style.display = 'inline-block';
        } else {
            tableContainerDiv.style.display = 'none';
            resultsTable.style.display = 'none';
            noResultsMessage.classList.remove('hidden');
            clearAllBtn.style.display = 'none';
        }
        updateMoreLessButtons(); // Keep this call
    }


    // --- Function to destroy existing charts ---
    function destroyCharts() {
        if (pieChartInstance) {
            pieChartInstance.destroy();
            pieChartInstance = null;
        }
        if (stackedColumnChartInstance) {
            stackedColumnChartInstance.destroy();
            stackedColumnChartInstance = null;
        }
        // Hide chart containers if they exist and are part of the DOM
        if (pieChartContainer) pieChartContainer.style.display = 'none';
        if (stackedChartContainer) stackedChartContainer.style.display = 'none';
    }

    // --- MODIFIED renderSummary function ---
    function renderSummary() {
        const submissions = loadSubmissions();
        const total = submissions.length;
        totalFormsSpan.textContent = total;
        summaryTbody.innerHTML = '';
        destroyCharts(); // Destroy old charts first

        if (total === 0) {
            summaryTable.style.display = 'none';
            noSummaryMessage.classList.remove('hidden');
            printSummaryBtn.style.display = 'none';
            // Ensure chart containers are hidden
            if (pieChartContainer) pieChartContainer.style.display = 'none';
            if (stackedChartContainer) stackedChartContainer.style.display = 'none';
            return;
        }

        summaryTable.style.display = 'table';
        noSummaryMessage.classList.add('hidden');
        printSummaryBtn.style.display = 'inline-block';
        // Only display chart containers if canvas exists (Important!)
        if (pieChartCanvas && pieChartContainer) pieChartContainer.style.display = 'block';
        if (stackedColumnChartCanvas && stackedChartContainer) stackedChartContainer.style.display = 'block';

        const summaryData = {};
        const questionLabels = []; // For chart labels
        questions.forEach((q, index) => {
            const qKey = `q${index + 1}`;
            const questionParts = q.match(/^(\d+)\.\s*(.*)/);
            const questionText = questionParts ? `${questionParts[1]}. ${questionParts[2]}` : q;
            const shortLabel = `ข้อ ${questionParts ? questionParts[1] : index + 1}`;
            questionLabels.push(shortLabel);

            summaryData[qKey] = {
                name: questionText,
                shortLabel: shortLabel,
                counts: {},
                total: 0
            };
            ratingLevelsInternal.forEach(level => summaryData[qKey].counts[level] = 0);
        });

        submissions.forEach(submission => {
            questions.forEach((q, index) => {
                const qKey = `q${index + 1}`;
                const answer = submission[qKey];
                if (answer && summaryData[qKey].counts.hasOwnProperty(answer)) {
                    summaryData[qKey].counts[answer]++;
                    summaryData[qKey].total++;
                }
            });
        });

        // Populate the summary table
        Object.keys(summaryData).forEach(qKey => {
            const data = summaryData[qKey];
            const row = summaryTbody.insertRow();
            const cellName = row.insertCell();
            cellName.textContent = data.name;
            cellName.style.textAlign = 'left';
            ratingLevelsInternal.forEach(level => {
                const cellCount = row.insertCell();
                cellCount.textContent = data.counts[level];
                cellCount.style.textAlign = 'center';
            });
            const cellTotal = row.insertCell();
            cellTotal.textContent = data.total;
            cellTotal.style.textAlign = 'center';
            cellTotal.style.fontWeight = 'bold';
        });

        // Prepare Data and Render Charts
        if (pieChartCanvas && stackedColumnChartCanvas) { // Check again if canvas elements exist
             prepareAndRenderPieChart(summaryData, questionLabels);
             prepareAndRenderStackedColumnChart(summaryData, questionLabels);
        } else {
             console.warn("Chart canvas element(s) not found. Charts cannot be rendered.");
             // Ensure containers are hidden if canvas is missing
             if (!pieChartCanvas && pieChartContainer) pieChartContainer.style.display = 'none';
             if (!stackedColumnChartCanvas && stackedChartContainer) stackedChartContainer.style.display = 'none';
        }
    }

    // --- Function to Prepare Pie Chart Data and Render ---
    function prepareAndRenderPieChart(summaryData, questionLabels) {
        const pieData = [];
        const pieLabels = [];

        Object.keys(summaryData).forEach(qKey => {
            pieData.push(summaryData[qKey].counts['มากที่สุด']);
            pieLabels.push(summaryData[qKey].shortLabel);
        });

        renderPieChart(pieLabels, pieData);
    }

    // --- Function to Render Pie Chart ---
    function renderPieChart(labels, data) {
        if (!pieChartCanvas) {
            console.error("Pie Chart Canvas not found!");
            return;
        }
        const ctx = pieChartCanvas.getContext('2d');
        if (!ctx) {
             console.error("Failed to get 2D context for Pie Chart Canvas!");
             return;
        }


        if (pieChartInstance) {
            pieChartInstance.destroy();
        }

        pieChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'จำนวนคำตอบ "มากที่สุด"',
                    data: data,
                    backgroundColor: [ /* ... สีเหมือนเดิม ... */
                         'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)', 'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)',
                        'rgba(199, 199, 199, 0.8)', 'rgba(83, 102, 255, 0.8)',
                        'rgba(100, 255, 100, 0.8)','rgba(255, 100, 100, 0.8)',
                        'rgba(100, 100, 255, 0.8)','rgba(200, 150, 50, 0.8)',
                        'rgba(50, 150, 200, 0.8)','rgba(150, 50, 150, 0.8)',
                        'rgba(150, 150, 50, 0.8)','rgba(120, 120, 120, 0.8)'
                    ],
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                },
                animation: false
            }
        });
    }

    // --- Function to Prepare Stacked Column Chart Data and Render ---
    function prepareAndRenderStackedColumnChart(summaryData, questionLabels) {
        const datasets = [];

        ratingLevelsInternal.forEach(level => {
            const levelData = [];
            Object.keys(summaryData).forEach(qKey => {
                levelData.push(summaryData[qKey].counts[level]);
            });
            datasets.push({
                label: level,
                data: levelData,
                backgroundColor: chartColors[level] || 'rgba(100, 100, 100, 0.8)'
            });
        });

        renderStackedColumnChart(questionLabels, datasets);
    }

    // --- Function to Render Stacked Column Chart ---
    function renderStackedColumnChart(labels, datasets) {
        if (!stackedColumnChartCanvas) {
             console.error("Stacked Column Chart Canvas not found!");
             return;
        }
        const ctx = stackedColumnChartCanvas.getContext('2d');
         if (!ctx) {
             console.error("Failed to get 2D context for Stacked Column Chart Canvas!");
             return;
        }

        if (stackedColumnChartInstance) {
            stackedColumnChartInstance.destroy();
        }

        stackedColumnChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: { display: true, text: 'ข้อคำถาม' }
                    },
                    y: {
                        stacked: true,
                        title: { display: true, text: 'จำนวนผู้ตอบ' },
                        beginAtZero: true
                    }
                },
                animation: false
            }
        });
    }

    // --- Event Listeners ---

    newSurveyBtn.addEventListener('click', () => {
        surveyForm.reset();
        // Check if form exists before generating questions
        if (surveyForm.querySelector('tbody')) {
             generateFormQuestions();
             surveyFormContainer.classList.remove('hidden');
             window.scrollTo({ top: surveyFormContainer.offsetTop - 20, behavior: 'smooth' });
        } else {
             console.error("Survey form tbody not found!");
        }
    });

    surveyForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(surveyForm);
        const submission = {};
        let allAnswered = true;
        // Basic check if questions array is populated
        if (!questions || questions.length === 0) {
             console.error("Questions array is empty or not defined.");
             return; // Prevent submission if questions aren't loaded
        }

        for (let i = 0; i < questions.length; i++) {
            const qKey = `q${i + 1}`;
            const answer = formData.get(qKey);
            if (!answer) {
                allAnswered = false;
                const questionParts = questions[i] ? questions[i].match(/^(\d+)\.\s*(.*)/) : null; // Add check for questions[i]
                const questionNumber = questionParts ? questionParts[1] : i + 1;
                alert(`กรุณาตอบคำถามข้อ ${questionNumber}`);
                const firstRadioOfQuestion = surveyForm.querySelector(`input[name="${qKey}"]`);
                if (firstRadioOfQuestion && firstRadioOfQuestion.closest('tr')) { // Check if element and row exist
                    const row = firstRadioOfQuestion.closest('tr');
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    row.style.backgroundColor = '#fff3cd';
                    setTimeout(() => { row.style.backgroundColor = ''; }, 2000);
                    try {
                        firstRadioOfQuestion.focus({ preventScroll: true });
                    } catch (e) { console.warn("Focus failed:", e); }
                }
                break;
            }
            submission[qKey] = answer;
        }

        if (allAnswered) {
            const submissions = loadSubmissions();
            submissions.push(submission);
            saveSubmissions(submissions);
            renderResultsTable();
            renderSummary(); // Update summary table AND charts
            surveyFormContainer.classList.add('hidden');
            if (resultsContainer) { // Check if results container exists
                 window.scrollTo({ top: resultsContainer.offsetTop - 20, behavior: 'smooth' });
            }
        }
    });

    cancelBtn.addEventListener('click', () => {
        surveyFormContainer.classList.add('hidden');
    });

    clearAllBtn.addEventListener('click', () => {
        const isConfirmed = confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลที่บันทึกไว้ทั้งหมด? ข้อมูลจะหายไปอย่างถาวรและไม่สามารถกู้คืนได้');
        if (isConfirmed) {
            localStorage.removeItem(localStorageKey);
            renderResultsTable();
            renderSummary(); // Will clear table and destroy charts
             alert('ข้อมูลทั้งหมดถูกลบเรียบร้อยแล้ว'); // Show alert after rendering
        }
    });

    seeMoreBtn.addEventListener('click', () => {
        const allRows = resultsTbody.querySelectorAll('tr');
        const totalRows = allRows.length;
        const newVisibleCount = Math.min(currentlyVisibleRows + rowsPerLoad, totalRows);
        for (let i = currentlyVisibleRows; i < newVisibleCount; i++) {
             if (allRows[i]) {
                allRows[i].style.display = '';
             }
        }
        currentlyVisibleRows = newVisibleCount;
        updateMoreLessButtons();
    });

    seeLessBtn.addEventListener('click', () => {
        const allRows = resultsTbody.querySelectorAll('tr');
        const newVisibleCount = Math.max(rowsPerLoad, currentlyVisibleRows - rowsPerLoad);
        for (let i = newVisibleCount; i < currentlyVisibleRows; i++) {
             if (allRows[i]) {
                allRows[i].style.display = 'none';
             }
        }
        currentlyVisibleRows = newVisibleCount;
        updateMoreLessButtons();
    });

    printSummaryBtn.addEventListener('click', () => {
        // Ensure charts are rendered before printing if data exists
        // Note: Chart.js rendering is usually synchronous enough, but complex charts might need a slight delay.
        // For simplicity, we assume rendering completes before print dialog opens.
        window.print();
    });

    summaryTitle.addEventListener('keydown', (event) => {
        if (event.keyCode === 13 || event.key === 'Enter') { // Check both keyCode and key
            event.preventDefault();
            summaryTitle.blur();
        }
    });

     summaryTitle.addEventListener('blur', () => {
        summaryTitle.textContent = summaryTitle.textContent.trim();
     });

    // --- Initial Page Load ---
    // Ensure elements exist before calling functions that use them
    if (resultsTableHead) generateResultsHeader();
    if (resultsTbody) renderResultsTable(); else console.error("Results tbody not found!");
    // renderSummary will check for its own elements internally
    renderSummary();

});