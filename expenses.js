/*=====================================
        STRICT LOGIN CHECK 
=====================================*/
// Check both localStorage (Remember Me) and sessionStorage (standard login)
const isPersistentLogin = localStorage.getItem("isLoggedIn") === "true";
const isSessionLogin = sessionStorage.getItem("isLoggedIn") === "true";
const currentUserStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

if ((!isPersistentLogin && !isSessionLogin) || !currentUser || (!currentUser.userId && !currentUser.id)) {
    alert("You must be logged in to view this page.");
    window.location.href = "login.html";
}

/*=====================================
        SECURE DRAFT KEYS
=====================================*/
const activeUserId = (currentUser && (currentUser.userId || currentUser.id)) || "";
const DRAFT_KEY = "draftData_" + activeUserId;
const EXPENSES_KEY = "campaignExpenses_" + activeUserId;
const EXPENSE_TIME_KEY = "expenseTime_" + activeUserId;

/*=====================================
      CHAIN VERIFICATION & LOAD DRAFT
=====================================*/
const campaign = JSON.parse(localStorage.getItem(DRAFT_KEY));

// 🔥 FIX: Enforce the strict chain. If they didn't come from create.html, kick them back.
if (!campaign) {
    alert("Security Check: No active campaign draft found. Please start from step 1.");
    window.location.href = "create.html?new=true";
} else {
    // Load the summary data visually
    const initialTarget = Number(campaign.target || campaign.targetAmount) || 0;
    if (document.getElementById("giftName")) document.getElementById("giftName").innerText = campaign.gift || campaign.giftName || "Unknown Gift";
    if (document.getElementById("receiver")) document.getElementById("receiver").innerText = campaign.receiver || "Unknown";
    if (document.getElementById("targetAmount")) document.getElementById("targetAmount").innerText = initialTarget;
    if (document.getElementById("target")) document.getElementById("target").innerText = initialTarget;
}

/*=====================================
      EXPIRATION CHECK (6 HOURS)
=====================================*/
let savedTime = localStorage.getItem(EXPENSE_TIME_KEY);
if (savedTime) {
    let hoursPassed = (Date.now() - parseInt(savedTime)) / (1000 * 60 * 60);
    if (hoursPassed > 6) {
        localStorage.removeItem(EXPENSES_KEY);
        localStorage.removeItem(EXPENSE_TIME_KEY);
    }
}

/*=====================================
        MOBILE MENU
=====================================*/
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

if (menuBtn && menu) {
    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    });

    document.querySelectorAll("#menu a").forEach(link => {
        link.addEventListener("click", () => menu.classList.remove("show"));
    });

    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
            menu.classList.remove("show");
        }
    });
}

/*=====================================
      FLOATING HEARTS
=====================================*/
const hearts = document.querySelector(".hearts");
for (let i = 0; i < 18; i++) {
    let heart = document.createElement("div");
    heart.className = "heart";
    heart.innerHTML = "❤";
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.fontSize = 12 + Math.random() * 18 + "px";
    heart.style.animationDuration = 8 + Math.random() * 8 + "s";
    heart.style.animationDelay = Math.random() * 5 + "s";
    if (hearts) hearts.appendChild(heart);
}

/*=====================================
      EXPENSE VARIABLES
=====================================*/
const expenseContainer = document.getElementById("expenseContainer");
const totalExpense = document.getElementById("totalExpense");
const remaining = document.getElementById("remaining");
const progressFill = document.getElementById("progressFill");
const warning = document.getElementById("warning");
const continueBtn = document.getElementById("continueBtn");
const targetAmount = campaign ? (Number(campaign.target || campaign.targetAmount) || 0) : 0;

const multiRadios = document.getElementsByName("multiExpense");
const expenseCountContainer = document.getElementById("expenseCountContainer");
const expenseCountSelect = document.getElementById("expenseCount");

/*=====================================
      CALCULATE & STRICT VALIDATION
=====================================*/
function calculate() {
    let total = 0;
    let allFilled = true;
    const inputs = document.querySelectorAll(".price");
    
    inputs.forEach(input => {
        if (input.value.trim() === "") allFilled = false;
        total += Number(input.value) || 0;
    });

    if (totalExpense) totalExpense.innerText = total;
    
    const remainingVal = targetAmount - total;
    if (remaining) remaining.innerText = remainingVal > 0 ? remainingVal : 0;

    let percent = targetAmount > 0 ? (total / targetAmount) * 100 : 0;
    if (progressFill) progressFill.style.width = Math.min(percent, 100) + "%";

    const checkedRadio = document.querySelector('input[name="multiExpense"]:checked');
    const isMulti = checkedRadio ? checkedRadio.value === 'yes' : false;

    if (total < targetAmount) {
        if (warning) {
            warning.innerText = "Expense amount can't be lower than the targeted amount.";
            warning.style.color = "#ff4d4d";
        }
        if (continueBtn) continueBtn.disabled = true;

        if (isMulti && allFilled && inputs.length > 0) {
            const lastInput = inputs[inputs.length - 1];
            if (lastInput.value.trim() !== "") {
                addExpenseRow();
                syncDropdown(inputs.length + 1);
            }
        }
    } else {
        if (continueBtn) continueBtn.disabled = false;
        if (total > targetAmount) {
            if (warning) {
                warning.innerText = "⚠ Expenses exceed campaign target.";
                warning.style.color = "#ffb300";
            }
        } else {
            if (warning) warning.innerText = "";
        }
    }
}

/*=====================================
      DYNAMIC ROWS LOGIC
=====================================*/
function attachDelete(button) {
    button.addEventListener("click", () => {
        const nameInput = button.parentElement.querySelector('.item');
        const priceInput = button.parentElement.querySelector('.price');
        
        if (nameInput.value.trim() === "") { alert("You are required to fill the expense name"); return; }
        if (priceInput.value.trim() === "") { alert("You are required to fill the expense amount"); return; }

        let total = 0;
        document.querySelectorAll(".price").forEach(input => total += Number(input.value) || 0);
        const rowVal = Number(priceInput.value) || 0;
        const newTotal = total - rowVal;
        
        if (newTotal < targetAmount) {
            alert("Expense amount can't be lower than the targeted amount.");
            return;
        }
        
        const checkedRadio = document.querySelector('input[name="multiExpense"]:checked');
        const isMulti = checkedRadio ? checkedRadio.value === 'yes' : false;
        const rowCount = document.querySelectorAll(".expense-row").length;
        
        if (isMulti && rowCount <= 2) { alert("You selected multiple expenses. Minimum 2 expenses required."); return; }
        else if (!isMulti && rowCount <= 1) { alert("At least 1 expense is required."); return; }

        button.parentElement.remove();
        if (isMulti) syncDropdown(document.querySelectorAll(".expense-row").length);
        calculate();
    });
}

function attachPrice(input) {
    input.addEventListener("input", calculate);
}

function addExpenseRow(itemName = "", itemAmount = "") {
    if (!expenseContainer) return;
    const row = document.createElement("div");
    row.className = "expense-row";
    row.innerHTML = `
        <input type="text" class="item" placeholder="Expense Name" value="${itemName}">
        <input type="number" class="price" placeholder="Amount" value="${itemAmount}">
        <button class="delete" type="button" tabindex="-1">🗑</button>
    `;
    expenseContainer.appendChild(row);
    attachDelete(row.querySelector(".delete"));
    attachPrice(row.querySelector(".price"));
}

function syncDropdown(count) {
    if (!expenseCountSelect) return;
    let option = expenseCountSelect.querySelector(`option[value="${count}"]`);
    if (!option) {
        option = document.createElement('option');
        option.value = count;
        option.innerText = count;
        expenseCountSelect.appendChild(option);
    }
    expenseCountSelect.value = count;
}

/*=====================================
      RADIO & DROPDOWN LISTENERS
=====================================*/
multiRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const currentRows = Array.from(document.querySelectorAll('.expense-row'));
        const data = currentRows.map(r => ({
            item: r.querySelector('.item').value,
            amount: r.querySelector('.price').value
        }));

        expenseContainer.innerHTML = ''; 

        if (e.target.value === 'yes') {
            expenseCountContainer.style.display = 'block';
            let targetCount = Math.max(2, data.length); 
            syncDropdown(targetCount);
            for (let i = 0; i < targetCount; i++) {
                addExpenseRow(data[i]?.item || "", data[i]?.amount || "");
            }
        } else {
            expenseCountContainer.style.display = 'none';
            addExpenseRow(data[0]?.item || "", data[0]?.amount || "");
        }
        calculate();
    });
});

if (expenseCountSelect) {
    expenseCountSelect.addEventListener('change', (e) => {
        const targetCount = parseInt(e.target.value);
        const currentRows = Array.from(document.querySelectorAll('.expense-row'));
        const currentCount = currentRows.length;
        
        if (targetCount > currentCount) {
            for (let i = currentCount; i < targetCount; i++) addExpenseRow();
        } else if (targetCount < currentCount) {
            for (let i = currentCount - 1; i >= targetCount; i--) currentRows[i].remove();
        }
        calculate();
    });
}

/*=====================================
      INITIALIZE & LOAD DRAFT
=====================================*/
let savedExpenses = JSON.parse(localStorage.getItem(EXPENSES_KEY));

// Fallback: If editing an existing campaign, check if expenses are stored inside the draft object
if ((!savedExpenses || savedExpenses.length === 0) && campaign && campaign.expenses) {
    if (Array.isArray(campaign.expenses)) {
        savedExpenses = campaign.expenses;
    } else if (typeof campaign.expenses === "string" && campaign.expenses.trim() !== "") {
        try { savedExpenses = JSON.parse(campaign.expenses); }
        catch (e) { savedExpenses = null; }
    }
}

if (savedExpenses && savedExpenses.length > 0) {
    if (savedExpenses.length > 1) {
        const yesRadio = document.querySelector('input[name="multiExpense"][value="yes"]');
        if (yesRadio) yesRadio.checked = true;
        if (expenseCountContainer) expenseCountContainer.style.display = 'block';
        syncDropdown(savedExpenses.length);
    } else {
        const noRadio = document.querySelector('input[name="multiExpense"][value="no"]');
        if (noRadio) noRadio.checked = true;
    }
    
    if (expenseContainer) expenseContainer.innerHTML = "";
    savedExpenses.forEach(exp => {
        addExpenseRow(exp.item || exp.title || "", exp.amount || exp.cost || "");
    });
} else {
    addExpenseRow();
}
calculate();

/*=====================================
      CONTINUE & BACK
=====================================*/
if (continueBtn) {
    continueBtn.addEventListener("click", () => {
        const expenses = [];
        let missingItemName = false;
        
        document.querySelectorAll(".expense-row").forEach(row => {
            const item = row.querySelector(".item").value.trim();
            const amount = row.querySelector(".price").value.trim();
            
            if (amount !== "" && Number(amount) > 0 && item === "") {
                missingItemName = true;
            }
            if (item !== "" && amount !== "" && Number(amount) > 0) {
                expenses.push({ item, amount: Number(amount) });
            }
        });

        if (missingItemName || expenses.length === 0) {
            alert("Please enter an Expense Name for each expense item before continuing.");
            return;
        }

        // Save to User-Specific Key with Timestamp
        localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
        localStorage.setItem(EXPENSE_TIME_KEY, Date.now()); 
        window.location.href = "preview.html";
    });
}

const backBtn = document.querySelector(".back-btn");
if (backBtn) {
    backBtn.addEventListener("click", () => {
        history.back();
    });
}
