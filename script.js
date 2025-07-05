document.addEventListener('DOMContentLoaded', () => {
    const foodNameInput = document.getElementById('foodName');
    const pointsInput = document.getElementById('points');
    const addFoodBtn = document.getElementById('addFoodBtn');
    const autocompleteSuggestionsDiv = document.getElementById('autocompleteSuggestions');
    const dailyTotalSpan = document.getElementById('dailyTotal');
    const resetTotalBtn = document.getElementById('resetTotalBtn');
    const foodLogList = document.getElementById('foodLog');

    let dailyTotalPoints = 0;
    let rememberedFoodItems = [];
    let currentDayLog = [];

    const LOCAL_STORAGE_KEY_ITEMS = 'extraFoodTracker.rememberedItems';
    const LOCAL_STORAGE_KEY_TOTAL = 'extraFoodTracker.dailyTotal';
    const LOCAL_STORAGE_KEY_LOG = 'extraFoodTracker.currentDayLog';

    function saveItems() {
        localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(rememberedFoodItems));
    }

    function loadItems() {
        const storedItems = localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS);
        if (storedItems) {
            rememberedFoodItems = JSON.parse(storedItems);
        }
    }

    function saveDailyTotal() {
        localStorage.setItem(LOCAL_STORAGE_KEY_TOTAL, dailyTotalPoints.toString());
    }

    function loadDailyTotal() {
        const storedTotal = localStorage.getItem(LOCAL_STORAGE_KEY_TOTAL);
        if (storedTotal) {
            dailyTotalPoints = parseInt(storedTotal, 10);
        }
        updateDailyTotalDisplay();
    }

    function saveCurrentDayLog() {
        localStorage.setItem(LOCAL_STORAGE_KEY_LOG, JSON.stringify(currentDayLog));
    }

    function loadCurrentDayLog() {
        const storedLog = localStorage.getItem(LOCAL_STORAGE_KEY_LOG);
        if (storedLog) {
            currentDayLog = JSON.parse(storedLog);
        }
        updateFoodLogDisplay();
    }

    // Function to render custom autocomplete suggestions
    function renderSuggestions(suggestions) {
        autocompleteSuggestionsDiv.innerHTML = ''; // Clear existing suggestions

        // Only hide if there are NO suggestions to display
        if (suggestions.length === 0) {
            autocompleteSuggestionsDiv.style.display = 'none';
            return;
        }

        // Display the suggestions div
        autocompleteSuggestionsDiv.style.display = 'block';

        suggestions.forEach(item => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('autocomplete-suggestion-item');
            suggestionItem.innerHTML = `
                <span class="suggestion-name">${item.name}</span>
                <span class="suggestion-points">(${item.points} pts)</span>
            `;
            
            suggestionItem.addEventListener('click', () => {
                foodNameInput.value = item.name;
                pointsInput.value = item.points;
                autocompleteSuggestionsDiv.style.display = 'none';
                foodNameInput.focus();
            });
            autocompleteSuggestionsDiv.appendChild(suggestionItem);
        });
    }

    function updateDailyTotalDisplay() {
        dailyTotalSpan.textContent = dailyTotalPoints;
    }

    function updateFoodLogDisplay() {
        foodLogList.innerHTML = '';
        currentDayLog.forEach(entry => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<span class="log-item-name">${entry.name}</span> <span class="log-item-points">(${entry.points} pts)</span>`;
            foodLogList.appendChild(listItem);
        });
    }

    function addFoodItem(name, points) {
        dailyTotalPoints += points;
        updateDailyTotalDisplay();
        saveDailyTotal();

        currentDayLog.push({ name: name, points: points, timestamp: new Date().toISOString() });
        saveCurrentDayLog();
        updateFoodLogDisplay();

        const existingIndex = rememberedFoodItems.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
        
        let itemToMoveOrAdd = { name: name, points: points };

        if (existingIndex !== -1) {
            itemToMoveOrAdd = rememberedFoodItems.splice(existingIndex, 1)[0];
            if (itemToMoveOrAdd.points !== points) {
                itemToMoveOrAdd.points = points;
            }
        }
        
        rememberedFoodItems.push(itemToMoveOrAdd);
        saveItems();
        
        foodNameInput.value = '';
        pointsInput.value = '1';
        autocompleteSuggestionsDiv.style.display = 'none';
    }

    // --- Event Listeners ---

    addFoodBtn.addEventListener('click', () => {
        const foodName = foodNameInput.value.trim();
        const points = parseInt(pointsInput.value, 10);

        if (foodName && !isNaN(points) && points >= 0) {
            addFoodItem(foodName, points);
        } else {
            alert('Please enter a valid food item and points.');
        }
    });

    // Event listener for typing/pasting into the input field
    foodNameInput.addEventListener('input', () => {
        const currentInputValue = foodNameInput.value.trim().toLowerCase();
        
        // Always filter by input value if something is typed
        const filteredSuggestions = rememberedFoodItems
            .slice().reverse() // Reverse to show most recent first
            .filter(item => item.name.toLowerCase().includes(currentInputValue));

        renderSuggestions(filteredSuggestions);

        const exactMatch = rememberedFoodItems.find(item => item.name.toLowerCase() === currentInputValue);
        if (exactMatch) {
            pointsInput.value = exactMatch.points;
        } else {
            pointsInput.value = '1';
        }
    });

    // New/Corrected: Event listener to show all remembered items when input gets focus
    foodNameInput.addEventListener('focus', () => {
        // Show all remembered items (most recent first) if input is empty
        // Or show filtered if something is already typed
        const currentInputValue = foodNameInput.value.trim().toLowerCase();
        const suggestionsToShow = currentInputValue === ''
            ? rememberedFoodItems.slice().reverse() // Show all if empty
            : rememberedFoodItems.slice().reverse().filter(item => item.name.toLowerCase().includes(currentInputValue));

        renderSuggestions(suggestionsToShow);
    });

    // Hide suggestions if the input field loses focus
    foodNameInput.addEventListener('blur', () => {
        // A small delay allows click events on suggestions to fire before the div hides
        setTimeout(() => {
            autocompleteSuggestionsDiv.style.display = 'none';
        }, 150); 
    });


    resetTotalBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the daily total and log? This cannot be undone.')) {
            dailyTotalPoints = 0;
            currentDayLog = [];
            saveDailyTotal();
            saveCurrentDayLog();
            updateDailyTotalDisplay();
            updateFoodLogDisplay();
        }
    });

    // --- Initialization ---
    loadItems();
    loadDailyTotal();
    loadCurrentDayLog();
    // No initial rendering of suggestions here, as they appear on focus/input
});