document.addEventListener('DOMContentLoaded', function() {
    const foodNameInput = document.getElementById('foodName');
    const totalWeightInput = document.getElementById('totalWeight');
    const totalCaloriesInput = document.getElementById('totalCalories');
    const servingSizeInput = document.getElementById('servingSize');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultDiv = document.getElementById('result');
    const shareWhatsappLink = document.getElementById('shareWhatsapp');
    const shareEmailLink = document.getElementById('shareEmail');
    const historyEntriesDiv = document.getElementById('history-entries');
    
    // Lade den Verlauf aus dem localStorage
    let history = JSON.parse(localStorage.getItem('calorieHistory') || '[]');

    // Funktion zum Hinzufügen eines neuen Verlaufseintrags
    function addHistoryEntry(foodName, totalWeight, totalCalories, servingSize, caloriesPerServing) {
        const entry = {
            date: new Date().toLocaleString('de-DE'),
            foodName,
            totalWeight,
            totalCalories,
            servingSize,
            caloriesPerServing
        };
        
        history.unshift(entry); // Füge neuen Eintrag am Anfang hinzu
        if (history.length > 3) history.pop(); // Behalte maximal 3 Einträge
        
        localStorage.setItem('calorieHistory', JSON.stringify(history));
        updateHistoryDisplay();
    }

    // Funktion zum Aktualisieren der Verlaufsanzeige
    function updateHistoryDisplay() {
        historyEntriesDiv.innerHTML = '';
        
        // Zeige nur die letzten 3 Einträge
        const recentEntries = history.slice(0, 3);
        
        recentEntries.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'history-entry';
            
            entryDiv.innerHTML = `
                <div class="content-wrapper">
                    <div class="date">${entry.date}</div>
                    <div class="content">
                        ${entry.foodName}: ${entry.caloriesPerServing.toFixed(2)} kcal 
                        pro ${entry.servingSize}g
                    </div>
                    <span class="share-icon" onclick="shareHistoryEntry(${index})">
                        🔗
                    </span>
                </div>
            `;
            
            // Swipe-to-Delete Funktionalität
            let startX = 0;
            let currentX = 0;
            let isDragging = false;
            const contentWrapper = entryDiv.querySelector('.content-wrapper');
            
            entryDiv.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
                entryDiv.classList.add('swiping');
            }, { passive: true });
            
            entryDiv.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentX = e.touches[0].clientX;
                const diff = currentX - startX;
                
                // Begrenze das Swipen nach rechts
                if (diff > 0) return;
                
                // Begrenze das Swipen nach links auf 100px
                const maxSwipe = -100;
                const swipeAmount = Math.max(diff, maxSwipe);
                
                contentWrapper.style.transform = `translateX(${swipeAmount}px)`;
            }, { passive: true });
            
            entryDiv.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;
                entryDiv.classList.remove('swiping');
                
                const diff = currentX - startX;
                if (diff < -80) {
                    // Wenn mehr als 80px nach links geswiped wurde, lösche den Eintrag
                    history.splice(index, 1);
                    localStorage.setItem('calorieHistory', JSON.stringify(history));
                    updateHistoryDisplay();
                } else {
                    // Sonst setze zurück
                    contentWrapper.style.transform = 'translateX(0)';
                }
            });
            
            historyEntriesDiv.appendChild(entryDiv);
        });
    }

    // Funktion zum Teilen eines Verlaufseintrags
    window.shareHistoryEntry = function(index) {
        const entry = history[index];
        const shareText = `${entry.foodName}: ${entry.caloriesPerServing.toFixed(2)} kcal pro ${entry.servingSize}g (Berechnet am ${entry.date})`;
        
        // Erstelle die Share-URLs
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        const emailUrl = `mailto:?subject=Kalorienberechnung&body=${encodeURIComponent(shareText)}`;
        
        // Öffne ein kleines Menü zum Teilen
        const shareMenu = document.createElement('div');
        shareMenu.className = 'share-menu';
        shareMenu.innerHTML = `
            <a href="${whatsappUrl}" target="_blank">WhatsApp</a>
            <a href="${emailUrl}">E-Mail</a>
        `;
        
        // Positioniere das Menü neben dem geklickten Share-Icon
        const shareIcon = event.target;
        shareIcon.appendChild(shareMenu);
        
        // Entferne das Menü nach dem Klick außerhalb
        document.addEventListener('click', function removeMenu(e) {
            if (!shareMenu.contains(e.target) && e.target !== shareIcon) {
                shareMenu.remove();
                document.removeEventListener('click', removeMenu);
            }
        });
    };

    // Funktion zum Aktualisieren der Share-Links
    function updateShareLinks() {
        const foodName = foodNameInput.value.trim();
        const totalWeight = parseFloat(totalWeightInput.value);
        const totalCalories = parseFloat(totalCaloriesInput.value);
        const servingSize = parseFloat(servingSizeInput.value);
        const result = resultDiv.textContent;

        let shareText = 'Kalorien pro Portion Rechner';
        if (result && result !== 'Bitte geben Sie gültige Zahlen ein.') {
            shareText = result;
        } else if (foodName && !isNaN(totalWeight) && !isNaN(totalCalories) && !isNaN(servingSize)) {
            const caloriesPerServing = (totalCalories / totalWeight) * servingSize;
            const formattedCalories = caloriesPerServing.toFixed(2);
            shareText = `Ich habe gerade die Kalorien pro Portion für ${foodName} berechnet: ${formattedCalories} kcal.`;
        }

        // Aktualisiere WhatsApp-Link
        const whatsappMessage = encodeURIComponent(shareText);
        shareWhatsappLink.href = `https://wa.me/?text=${whatsappMessage}`;

        // Aktualisiere E-Mail-Link
        const emailSubject = encodeURIComponent('Kalorienberechnung');
        const emailBody = encodeURIComponent(shareText);
        shareEmailLink.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
    }

    // Aktualisiere Share-Links bei Änderungen
    [foodNameInput, totalWeightInput, totalCaloriesInput, servingSizeInput].forEach(input => {
        input.addEventListener('input', updateShareLinks);
    });

    calculateBtn.addEventListener('click', function() {
        const foodName = foodNameInput.value.trim();
        const totalWeight = parseFloat(totalWeightInput.value);
        const totalCalories = parseFloat(totalCaloriesInput.value);
        const servingSize = parseFloat(servingSizeInput.value);

        if (isNaN(totalWeight) || isNaN(totalCalories) || isNaN(servingSize) || totalWeight <= 0 || totalCalories < 0 || servingSize <= 0) {
            resultDiv.textContent = 'Bitte geben Sie gültige Zahlen ein.';
            updateShareLinks();
            return;
        }

        const caloriesPerServing = (totalCalories / totalWeight) * servingSize;
        const formattedCalories = caloriesPerServing.toFixed(2);
        resultDiv.textContent = `Kalorien pro Portion: ${formattedCalories}`;
        
        // Füge den neuen Eintrag zum Verlauf hinzu
        addHistoryEntry(
            foodName,
            totalWeight,
            totalCalories,
            servingSize,
            caloriesPerServing
        );
        
        updateShareLinks();
    });

    // Initialisiere Share-Links und Verlauf beim Laden
    updateShareLinks();
    updateHistoryDisplay();

    // Pinball Animation für Food Icons
    const foodIcons = document.querySelectorAll('.food-icon');
    
    foodIcons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            // Verhindere, dass der Klick den Container erreicht
            e.stopPropagation();
            
            // Entferne die float Animation
            this.classList.add('pinball');
            
            // Berechne die Richtung basierend auf der Position
            const rect = this.getBoundingClientRect();
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            // Berechne die Distanz und Richtung
            const distanceX = centerX - rect.left;
            const distanceY = centerY - rect.top;
            
            // Erstelle eine zufällige Variation für die Animation
            const randomX = (Math.random() - 0.5) * 200;
            const randomY = (Math.random() - 0.5) * 200;
            
            // Setze die Animation
            this.style.animation = `pinball 1s ease-in-out forwards`;
            
            // Entferne die Animation nach dem Ende
            this.addEventListener('animationend', function() {
                this.classList.remove('pinball');
                this.style.animation = '';
            }, { once: true });
        });
    });

    // Tab Navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Entferne active Klasse von allen Buttons und Contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Füge active Klasse zum geklickten Button und entsprechenden Content hinzu
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Calculator Funktionalität
    const calcResult = document.getElementById('calcResult');
    const calcButtons = document.querySelectorAll('.calc-btn');
    let currentValue = '';
    let previousValue = '';
    let operation = null;

    calcButtons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.textContent;

            if (button.classList.contains('number')) {
                currentValue += value;
                calcResult.value = currentValue;
            } else if (button.classList.contains('operator')) {
                if (currentValue === '') return;
                if (previousValue !== '') {
                    calculate();
                }
                operation = value;
                previousValue = currentValue;
                currentValue = '';
            } else if (button.classList.contains('equals')) {
                if (currentValue === '' || previousValue === '' || operation === null) return;
                calculate();
                operation = null;
                previousValue = '';
                return;
            } else if (button.classList.contains('clear')) {
                currentValue = '';
                previousValue = '';
                operation = null;
                calcResult.value = '';
            }
        });
    });

    function calculate() {
        let result;
        const prev = parseFloat(previousValue);
        const current = parseFloat(currentValue);

        switch (operation) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '×':
                result = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    calcResult.value = 'Error';
                    return;
                }
                result = prev / current;
                break;
            case '%':
                result = prev % current;
                break;
            default:
                return;
        }

        // Runde das Ergebnis auf 2 Dezimalstellen
        result = Math.round(result * 100) / 100;
        currentValue = result.toString();
        calcResult.value = currentValue;
    }
});