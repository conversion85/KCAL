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
                <div class="date">${entry.date}</div>
                <div class="content">
                    ${entry.foodName}: ${entry.caloriesPerServing.toFixed(2)} kcal 
                    pro ${entry.servingSize}g
                </div>
                <span class="share-icon" onclick="shareHistoryEntry(${index})">
                    🔗
                </span>
            `;
            
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
});