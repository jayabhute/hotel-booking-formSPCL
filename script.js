// ===== DOM elements =====
const checkinInput = document.getElementById('checkinInput');
const checkoutInput = document.getElementById('checkoutInput');
const roomType = document.getElementById('roomType');
const guestCount = document.getElementById('guestCount');
const special = document.getElementById('specialReq');
const charSpan = document.getElementById('charCount');

// error divs
const checkinErr = document.getElementById('checkinError');
const checkoutErr = document.getElementById('checkoutError');
const roomErr = document.getElementById('roomError');
const guestErr = document.getElementById('guestError');
const globalFeedback = document.getElementById('globalFeedback');

const form = document.getElementById('bookingForm');

// ===== helper: format Date to DD/MM/YYYY =====
function formatDDMMYYYY(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ===== set DEFAULT dates (today & tomorrow) =====
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

checkinInput.value = formatDDMMYYYY(today);      // default today
checkoutInput.value = formatDDMMYYYY(tomorrow);  // default tomorrow

// ===== flexible date parser (accepts '/' or ':') =====
function parseDate(str) {
    if (!str) return null;
    // split on / or :
    const parts = str.split(/[\/:]/);
    if (parts.length !== 3) return null;

    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1; // month 0-based
    const y = parseInt(parts[2], 10);

    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    // basic range check
    if (d < 1 || d > 31 || m < 0 || m > 11 || y < 2000 || y > 2100) return null;

    return new Date(y, m, d, 12, 0, 0); // noon to avoid DST issues
}

// ===== comparison: dateStr1 > dateStr2 ? =====
function isAfter(dateStr1, dateStr2) {
    const d1 = parseDate(dateStr1);
    const d2 = parseDate(dateStr2);
    if (!d1 || !d2) return false;
    return d1.getTime() > d2.getTime();
}

// ===== show field error =====
function showFieldError(inputEl, errDiv, msg) {
    inputEl.classList.add('field-error');
    errDiv.querySelector('span').textContent = msg;
    errDiv.classList.remove('hidden');
}

// ===== clear field error =====
function clearFieldError(inputEl, errDiv) {
    inputEl.classList.remove('field-error');
    errDiv.classList.add('hidden');
}

// ===== main validation =====
function validateForm() {
    let isValid = true;

    // clear all field errors
    [checkinInput, checkoutInput, roomType, guestCount].forEach(el => el.classList.remove('field-error'));
    [checkinErr, checkoutErr, roomErr, guestErr].forEach(div => div.classList.add('hidden'));
    
    // hide global feedback initially
    globalFeedback.classList.add('hidden');
    globalFeedback.classList.remove('success', 'error');
    globalFeedback.innerHTML = '';

    // ----- 1. check-in -----
    const cinVal = checkinInput.value.trim();
    if (!cinVal) {
        showFieldError(checkinInput, checkinErr, 'Check-in date required (dd/mm/yyyy)');
        isValid = false;
    } else {
        const cinDate = parseDate(cinVal);
        if (!cinDate) {
            showFieldError(checkinInput, checkinErr, 'Invalid format. Use DD/MM/YYYY');
            isValid = false;
        } else {
            // not past (compare with start of today)
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
            if (cinDate < todayStart) {
                showFieldError(checkinInput, checkinErr, 'Check-in cannot be in the past');
                isValid = false;
            }
        }
    }

    // ----- 2. check-out -----
    const coutVal = checkoutInput.value.trim();
    if (!coutVal) {
        showFieldError(checkoutInput, checkoutErr, 'Check-out date required');
        isValid = false;
    } else {
        const coutDate = parseDate(coutVal);
        if (!coutDate) {
            showFieldError(checkoutInput, checkoutErr, 'Invalid format. Use DD/MM/YYYY');
            isValid = false;
        } else {
            // compare with check-in if check-in is valid
            if (cinVal && parseDate(cinVal)) {
                if (!isAfter(coutVal, cinVal)) {
                    showFieldError(checkoutInput, checkoutErr, 'Check-out must be AFTER check‑in');
                    isValid = false;
                }
            }
        }
    }

    // ----- 3. room type -----
    if (!roomType.value) {
        showFieldError(roomType, roomErr, 'Select a room type');
        isValid = false;
    }

    // ----- 4. guest count -----
    const guests = parseInt(guestCount.value);
    if (!guestCount.value || isNaN(guests) || guests < 1) {
        showFieldError(guestCount, guestErr, 'At least 1 guest');
        isValid = false;
    } else if (guests > 10) {
        showFieldError(guestCount, guestErr, 'Maximum 10 guests');
        isValid = false;
    }

    return isValid;
}

// ===== live clear errors on input/change =====
checkinInput.addEventListener('input', () => clearFieldError(checkinInput, checkinErr));
checkoutInput.addEventListener('input', () => clearFieldError(checkoutInput, checkoutErr));
roomType.addEventListener('change', () => clearFieldError(roomType, roomErr));
guestCount.addEventListener('input', () => clearFieldError(guestCount, guestErr));

// ===== character counter for special requests =====
special.addEventListener('input', () => {
    charSpan.textContent = special.value.length;
});
// initial count
charSpan.textContent = special.value.length;

// ===== form submit handler =====
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const valid = validateForm();

    if (valid) {
        // success display
        globalFeedback.classList.remove('hidden');
        globalFeedback.classList.add('success');
        
        const roomOpt = roomType.options[roomType.selectedIndex]?.text || roomType.value;
        const guestVal = guestCount.value;
        const specialNote = special.value.trim() ? ` · "${special.value.substring(0, 30)}..."` : '';

        globalFeedback.innerHTML = `
            <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                <i class="fa-regular fa-circle-check" style="color: #166534; font-size: 1.25rem;"></i>
                <div>
                    <span style="font-weight: 600;">✓ Booking data OK (demo)</span><br>
                    <span style="font-size: 0.875rem;">📅 ${checkinInput.value} → ${checkoutInput.value} | ${roomOpt} | ${guestVal} guests ${specialNote}</span>
                    <p style="font-size: 0.75rem; margin-top: 0.5rem; color: #166534;">default dates pre-filled • all validations passed</p>
                </div>
            </div>
        `;
    } else {
        // error summary
        globalFeedback.classList.remove('hidden');
        globalFeedback.classList.add('error');
        globalFeedback.innerHTML = `
            <div style="display: flex; gap: 0.5rem;">
                <i class="fa-regular fa-circle-xmark" style="color: #991b1b; font-size: 1.25rem;"></i>
                <span><strong>Please fix errors</strong> — date format DD/MM/YYYY (or DD:MM:YYYY) required.</span>
            </div>
        `;
    }
});
