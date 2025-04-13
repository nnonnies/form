document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const newSurveyBtn = document.getElementById('new-survey-btn');
    const surveyFormContainer = document.getElementById('survey-form-container');
    const surveyForm = document.getElementById('survey-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const resultsTbody = document.getElementById('results-tbody');
    const resultsTable = document.getElementById('results-table'); // Reference to the whole table
    const resultsTableHead = resultsTable.querySelector('thead');
    const noResultsMessage = document.getElementById('no-results-message');
    const totalFormsSpan = document.getElementById('total-forms');
    const summaryDetailsDiv = document.getElementById('summary-details');
    const clearAllBtn = document.getElementById('clear-all-btn');

    // --- Data ---
    const localStorageKey = 'surveySubmissions'; // Key for localStorage
    const questions = [
        "1. สถานที่ การจัดประชุม",
        "2. อุณหภูมิ และการถ่ายเทอากาศในห้องประชุม",
        "3. แสงสว่าง เสียง เวที ป้าย",
        "4. อาหารกลางวัน",
        "5. อาหารว่าง",
        "6. การติดต่อประสานงานของผู้จัดการประชุม",
        "7. เอกสารประกอบการประชุมมีประโยชน์",
        "8. หัวข้อการบรรยาย มีสาระ มีความรู้ สามารถนำไปใช้ได้",
        "9. วิทยากรผู้บรรยายของมีความรู้",
        "10. เวลาที่ใช้บรรยายของวิทยากร ตรงเวลา เหมาะสม",
        "11. ผู้ประชุม มีโอกาสได้แลกเปลี่ยนความรู้ประสบการณ์",
        "12. ประโยชน์ที่ได้รับจากวิทยากรโดยรวม",
        "13. ผู้ดำเนินรายการ (พิธีกร) มีความรู้ ความเข้าใจในการดำเนินการประชุม",
        "14. คณะกรรมการสมาคม มีอัธยาศัย มีมิตรไมตรี เป็นกันเอง สุภาพ อ่อนโยนกับผู้เข้าร่วมประชุม",
        "15. ผู้เข้าประชุมประทับใจกระบวนการจัดประชุม / สัมมนา",
        "16. การให้บริการ การดูแล ของตัวแทนบริษัทต่างๆที่เข้าร่วมกิจกรรมการประชุมครั้งนี้"
    ];
    const ratingLevels = ["มากที่สุด", "มาก", "ปานกลาง", "น้อยที่สุด"];

    // --- Functions ---

    // Load data from localStorage
    function loadSubmissions() {
        const submissions = localStorage.getItem(localStorageKey);
        return submissions ? JSON.parse(submissions) : [];
    }

    // Save data to localStorage
    function saveSubmissions(submissions) {
        localStorage.setItem(localStorageKey, JSON.stringify(submissions));
    }

    // Generate form questions dynamically
    function generateFormQuestions() {
        const formTbody = surveyForm.querySelector('tbody');
        formTbody.innerHTML = ''; // Clear existing questions
        questions.forEach((q, index) => {
            const row = formTbody.insertRow();
            const qCell = row.insertCell();
            qCell.textContent = q;
            qCell.style.fontWeight = '500'; // Make question text slightly bolder

            ratingLevels.forEach(level => {
                const cell = row.insertCell();
                const radioId = `q${index + 1}_${level.replace(/\s+/g, '')}`; // Unique ID for label
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `q${index + 1}`; // Group radios by question (q1, q2, ...)
                radio.value = level;
                radio.required = true; // Make selection mandatory for each question
                radio.id = radioId;

                const label = document.createElement('label');
                label.htmlFor = radioId; // Link label to radio button
                // Optional: Add text to label if needed visually, e.g., label.textContent = level;
                label.style.cursor = 'pointer'; // Make label look clickable
                label.appendChild(radio); // Put radio inside label for better click area

                cell.appendChild(label);
            });
        });
    }

    // Generate results table header dynamically
    function generateResultsHeader() {
         resultsTableHead.innerHTML = ''; // Clear existing header
         const headerRow = resultsTableHead.insertRow();
         const thForm = document.createElement('th');
         thForm.textContent = 'ลำดับ'; // Changed label to 'ลำดับ'
         thForm.style.width = '5%'; // Allocate small width for index
         headerRow.appendChild(thForm);

         questions.forEach((q, index) => {
             const th = document.createElement('th');
             // Extract question number and text for better display
             const questionParts = q.match(/^(\d+)\.\s*(.*)/);
             th.textContent = `ข้อ ${questionParts ? questionParts[1] : index + 1}`; // Use extracted number or index+1
             th.title = questionParts ? questionParts[2] : q; // Show full question text on hover
             headerRow.appendChild(th);
         });
    }

    // Toggle visibility of results table and 'no results' message
    function toggleResultsDisplay(hasData) {
        if (hasData) {
            resultsTable.classList.remove('hidden');
            noResultsMessage.classList.add('hidden');
        } else {
            resultsTable.classList.add('hidden');
            noResultsMessage.classList.remove('hidden');
        }
    }

    // Render the results table
    function renderResultsTable() {
        const submissions = loadSubmissions();
        resultsTbody.innerHTML = ''; // Clear existing rows
        generateResultsHeader(); // Regenerate header (important if questions change)

        toggleResultsDisplay(submissions.length > 0); // Show/hide table based on data

        submissions.forEach((submission, index) => {
            const row = resultsTbody.insertRow();
            const cellIndex = row.insertCell();
            cellIndex.textContent = index + 1; // Form number (1-based)
            cellIndex.style.textAlign = 'center';

            questions.forEach((q, qIndex) => {
                const cell = row.insertCell();
                const answer = submission[`q${qIndex + 1}`] || '-'; // Get answer for q1, q2... or show '-'
                cell.textContent = answer;
                cell.style.textAlign = 'center'; // Center align answers
            });
        });
    }

    // Calculate and render summary statistics
    function renderSummary() {
        const submissions = loadSubmissions();
        const total = submissions.length;
        totalFormsSpan.textContent = total;

        summaryDetailsDiv.innerHTML = ''; // Clear previous summary

        if (total === 0) {
            summaryDetailsDiv.textContent = 'ยังไม่มีข้อมูลสำหรับสรุปผล';
            return;
        }

        questions.forEach((q, index) => {
            const qKey = `q${index + 1}`;
            const counts = {}; // Use object for flexibility
            ratingLevels.forEach(level => counts[level] = 0); // Initialize counts for all levels

            submissions.forEach(submission => {
                const answer = submission[qKey];
                if (answer && counts.hasOwnProperty(answer)) {
                    counts[answer]++;
                }
            });

            const questionSummaryDiv = document.createElement('div');
            const questionTitle = document.createElement('strong');
             // Extract question number and text for better display
             const questionParts = q.match(/^(\d+)\.\s*(.*)/);
            questionTitle.textContent = `${questionParts ? questionParts[1] : index + 1}. ${questionParts ? questionParts[2] : q}`; // Display question number and text
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

    // Show form when "New Survey" is clicked
    newSurveyBtn.addEventListener('click', () => {
        surveyForm.reset(); // Clear previous selections
        generateFormQuestions(); // Ensure form is correctly generated
        surveyFormContainer.classList.remove('hidden');
        window.scrollTo(0, surveyFormContainer.offsetTop - 20); // Scroll to the form
        // Optional: Hide the "New Survey" button while form is shown
        // newSurveyBtn.classList.add('hidden');
    });

    // Handle form submission
    surveyForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent default page reload

        const formData = new FormData(surveyForm);
        const submission = {};
        let allAnswered = true;

        // Validate if all questions are answered and collect data
        for (let i = 0; i < questions.length; i++) {
            const qKey = `q${i + 1}`;
            const answer = formData.get(qKey);
            if (!answer) {
                allAnswered = false;
                const questionParts = questions[i].match(/^(\d+)\.\s*(.*)/);
                const questionNumber = questionParts ? questionParts[1] : i + 1;
                alert(`กรุณาตอบคำถามข้อ ${questionNumber}`);
                // Find the first radio button of the unanswered question to focus
                const firstRadioOfQuestion = surveyForm.querySelector(`input[name="${qKey}"]`);
                 if(firstRadioOfQuestion) {
                     // Scroll to the question and focus
                     firstRadioOfQuestion.closest('tr').scrollIntoView({ behavior: 'smooth', block: 'center' });
                     firstRadioOfQuestion.focus();
                 }
                break; // Stop checking after the first missing answer
            }
            submission[qKey] = answer;
        }

        if (allAnswered) {
            const submissions = loadSubmissions();
            submissions.push(submission);
            saveSubmissions(submissions);

            renderResultsTable();
            renderSummary();

            surveyFormContainer.classList.add('hidden'); // Hide form after submission
            // Optional: Show the "New Survey" button again if it was hidden
            // newSurveyBtn.classList.remove('hidden');
            window.scrollTo(0, resultsContainer.offsetTop - 20); // Scroll to results
            alert('บันทึกข้อมูลเรียบร้อยแล้ว');
        }
    });

    // Handle cancel button click
    cancelBtn.addEventListener('click', () => {
         surveyFormContainer.classList.add('hidden');
         // Optional: Show the "New Survey" button again if it was hidden
         // newSurveyBtn.classList.remove('hidden');
    });

    // Handle Clear All button click
    clearAllBtn.addEventListener('click', () => {
        // Ask for confirmation before deleting
        const isConfirmed = confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลที่บันทึกไว้ทั้งหมด? ข้อมูลจะหายไปอย่างถาวรและไม่สามารถกู้คืนได้');

        if (isConfirmed) {
            // Remove data from localStorage
            localStorage.removeItem(localStorageKey);

            // Update the display (table and summary) to reflect the cleared data
            renderResultsTable();
            renderSummary();

            alert('ข้อมูลทั้งหมดถูกลบเรียบร้อยแล้ว');
        }
    });

    // --- Initial Page Load ---
    generateResultsHeader(); // Generate table header structure on load
    renderResultsTable();   // Render table with any previously stored data
    renderSummary();      // Render summary with any previously stored data

});