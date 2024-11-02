const firebaseConfig = JSON.parse(atob("ewogICAgImFwaUtleSI6ICJBSXphU3lBQ0JBZGZ5enVpV0FhN19kMmlzRG1aSGNvR1BTMjhZa1UiLAogICAgImF1dGhEb21haW4iOiAiaGFsbG93ZWVuLTNlNTQxLmZpcmViYXNlYXBwLmNvbSIsCiAgICAiZGF0YWJhc2VVUkwiOiAiaHR0cHM6Ly9oYWxsb3dlZW4tM2U1NDEtZGVmYXVsdC1ydGRiLmV1cm9wZS13ZXN0MS5maXJlYmFzZWRhdGFiYXNlLmFwcCIsCiAgICAicHJvamVjdElkIjogImhhbGxvd2Vlbi0zZTU0MSIsCiAgICAic3RvcmFnZUJ1Y2tldCI6ICJoYWxsb3dlZW4tM2U1NDEuZmlyZWJhc2VzdG9yYWdlLmFwcCIsCiAgICAibWVzc2FnaW5nU2VuZGVySWQiOiAiNjI5ODkwOTgzMTc0IiwKICAgICJhcHBJZCI6ICIxOjYyOTg5MDk4MzE3NDp3ZWI6NGE2Y2QwNjNjYzEzZDEzNDAyYWE4NyIsCiAgICAibWVhc3VyZW1lbnRJZCI6ICJHLTJKNVgxTE43SFAiCn0="));

const defaultDatabase = {
    players: [{ id: 1, name: "Spieler 1", tasksDone: [] }, { id: 2, name: "Spieler 2", tasksDone: [] }],
    tasks: [{ id: 1, text: "Beispielaufgabe", timesUsed: 0 }],
    history: [],
    stats: { totalSpins: 0 }
};

document.addEventListener('DOMContentLoaded', () => {
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const wheel = document.querySelector('.wheel');
    const tasksList = document.querySelector('.tasks-list');
    const settingsModal = document.getElementById('settingsModal');
    const playerList = document.getElementById('playerList');
    const taskList = document.getElementById('taskList');

    let gameDatabase = null;
    let currentRotation = 0;
    let isSpinning = false;

    function validateDatabase(data) {
        if (!data) return false;
        if (!Array.isArray(data.players)) data.players = defaultDatabase.players;
        if (!Array.isArray(data.tasks)) data.tasks = defaultDatabase.tasks;
        if (!Array.isArray(data.history)) data.history = [];
        if (!data.stats) data.stats = { totalSpins: 0 };
        if (data.players.length < 2) data.players = defaultDatabase.players;
        if (data.tasks.length < 1) data.tasks = defaultDatabase.tasks;
        return true;
    }

    function loadData() {
        database.ref('gameData').once('value').then((snapshot) => {
            const data = snapshot.val();
            if (!data) {
                gameDatabase = { ...defaultDatabase };
            } else {
                gameDatabase = data;
                validateDatabase(gameDatabase);
            }
            return saveData();
        }).then(() => {
            createWheelSections();
            updateSettingsList('players');
            updateSettingsList('tasks');
            displayHistory();  // Display previous results
        }).catch(() => {
            gameDatabase = { ...defaultDatabase };
            saveData().then(() => {
                createWheelSections();
                updateSettingsList('players');
                updateSettingsList('tasks');
                displayHistory();  // Display previous results
            });
        });
    }


    function saveData() {
        return database.ref('gameData').set(gameDatabase).catch(() => {});
    }

    database.ref('gameData').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && validateDatabase(data)) {
            gameDatabase = data;
            createWheelSections();
            updateSettingsList('players');
            updateSettingsList('tasks');
        }
    });

    function createWheelSections() {
        const players = gameDatabase.players;
        const sectionAngle = 360 / players.length;
        const radius = 50;
        const center = 50;
        const colors = generateColors(players.length);

        wheel.innerHTML = '';
        const circleBackground = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circleBackground.setAttribute('cx', center);
        circleBackground.setAttribute('cy', center);
        circleBackground.setAttribute('r', radius);
        circleBackground.setAttribute('fill', '#1a0000');
        circleBackground.setAttribute('stroke', '#600');
        circleBackground.setAttribute('stroke-width', '0.5');
        wheel.appendChild(circleBackground);

        players.forEach((player, index) => {
            const startAngle = index * sectionAngle;
            const endAngle = (index + 1) * sectionAngle;
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            const x1 = center + radius * Math.cos(startRad);
            const y1 = center + radius * Math.sin(startRad);
            const x2 = center + radius * Math.cos(endRad);
            const y2 = center + radius * Math.sin(endRad);
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const largeArcFlag = sectionAngle > 180 ? 1 : 0;
            const d = [`M ${center},${center}`, `L ${x1},${y1}`, `A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2}`, 'Z'].join(' ');
            path.setAttribute('d', d);
            path.setAttribute('fill', colors[index]);
            path.setAttribute('stroke', '#600');
            path.setAttribute('stroke-width', '0.5');
            wheel.appendChild(path);

            const textAngle = startAngle + (sectionAngle / 2);
            const textRad = (textAngle - 90) * Math.PI / 180;
            const textRadius = radius * 0.6;
            const textX = center + textRadius * Math.cos(textRad);
            const textY = center + textRadius * Math.sin(textRad);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute('x', textX);
            text.setAttribute('y', textY);
            text.setAttribute('fill', 'white');
            text.setAttribute('font-size', '5px');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('alignment-baseline', 'middle');
            let rotationAngle = textAngle;
            if (textAngle > 90 && textAngle < 270) rotationAngle += 180;
            text.setAttribute('transform', `rotate(${rotationAngle} ${textX} ${textY})`);
            const maxLength = 12;
            let displayName = player.name;
            if (displayName.length > maxLength) displayName = displayName.substring(0, maxLength - 2) + '..';
            text.textContent = displayName;
            wheel.appendChild(text);
        });

        const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        centerCircle.setAttribute('cx', center);
        centerCircle.setAttribute('cy', center);
        centerCircle.setAttribute('r', 3);
        centerCircle.setAttribute('fill', '#600');
        centerCircle.setAttribute('stroke', '#a20000');
        centerCircle.setAttribute('stroke-width', '0.5');
        wheel.appendChild(centerCircle);

        const borderCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        borderCircle.setAttribute('cx', center);
        borderCircle.setAttribute('cy', center);
        borderCircle.setAttribute('r', radius);
        borderCircle.setAttribute('fill', 'none');
        borderCircle.setAttribute('stroke', '#a20000');
        borderCircle.setAttribute('stroke-width', '1');
        wheel.appendChild(borderCircle);
    }

    function generateColors(count) {
        const colors = [];
        const baseHues = [0, 30, 60, 120, 180, 240, 280, 320];
        const saturation = 70;
        for (let i = 0; i < count; i++) {
            const hue = baseHues[i % baseHues.length];
            const group = Math.floor(i / baseHues.length);
            const lightness = 25 + (group % 2) * 15;
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
        return colors;
    }

    const sounds = {
        wheel: new Howl({ src: ['./horror-scary-metal-screech-01-256965.mp3'], volume: 0.5, loop: true }),
        result: new Howl({ src: ['./scary-scream-193752.mp3'], volume: 0.7 })
    };

    function spinWheel() {
        if (isSpinning) return;
        isSpinning = true;
        gameDatabase.stats.totalSpins++;
        sounds.wheel.play();
        
        const spins = 5 + Math.floor(Math.random() * 5);
        const extraDegrees = Math.floor(Math.random() * 360);
        const totalRotation = spins * 360 + extraDegrees;
        
        currentRotation += totalRotation;
        wheel.style.transform = `rotate(${currentRotation}deg)`;
        
        setTimeout(() => {
            sounds.wheel.fade(0.5, 0, 1000);
            setTimeout(() => sounds.wheel.stop(), 1000);
        }, 2000);
        
        setTimeout(() => {
            isSpinning = false;
            const winner = getWinner();
            const task = getRandomTask();
            recordResult(winner, task);
            displayTaskPopup(winner, task); // Show the popup
            sounds.result.play();
        }, 3000);
    }

    function getWinner() {
        const players = gameDatabase.players;
        const sections = players.length;
        const degrees = (360 - (currentRotation % 360)) % 360;
        const sectionSize = 360 / sections;
        const index = Math.floor(degrees / sectionSize);
        return players[index];
    }

    function getRandomTask() {
        // Kopiere alle Aufgaben
        const tasks = [...gameDatabase.tasks];
        
        // Gewichte für jede Aufgabe berechnen (inverse der Nutzung)
        const weights = tasks.map(task => {
            // Basis-Gewichtung: Je öfter verwendet, desto geringer die Chance
            const baseWeight = Math.max(1, 10 - task.timesUsed);
            
            // Zusätzliche zufällige Variation (±20%)
            const randomFactor = 0.8 + Math.random() * 0.4;
            
            // Zeit seit letzter Verwendung berücksichtigen
            const lastUsedIndex = gameDatabase.history.findIndex(h => h.taskId === task.id);
            const recencyBonus = lastUsedIndex === -1 ? 1.5 : // Noch nie verwendet
                Math.min(1.5, 1 + ((gameDatabase.history.length - lastUsedIndex) / gameDatabase.history.length));
            
            return baseWeight * randomFactor * recencyBonus;
        });
        
        // Summe aller Gewichte
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        // Zufallszahl zwischen 0 und Gesamtgewicht
        let random = Math.random() * totalWeight;
        
        // Aufgabe basierend auf Gewichtung auswählen
        let selectedTask;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                selectedTask = tasks[i];
                break;
            }
        }
        
        // Fallback falls etwas schiefgeht
        if (!selectedTask) {
            selectedTask = tasks[Math.floor(Math.random() * tasks.length)];
        }
        
        // Verwendung zählen
        selectedTask.timesUsed++;
        return selectedTask;
    }

    function displayTaskPopup(player, task) {
        popupPlayerName.textContent = player.name;
        popupTaskText.textContent = task.text;
        taskPopup.style.display = 'block';
    }

    function recordResult(player, task) {
        const result = { timestamp: new Date().toISOString(), playerId: player.id, playerName: player.name, taskId: task.id, taskText: task.text };
        player.tasksDone.push(result);
        gameDatabase.history.push(result);
        
        if (gameDatabase.history.length > 100) gameDatabase.history.shift();
        
        saveData();
    }

    function displayResult(player, task) {
        const result = document.createElement('div');
        result.className = 'task-result';
        result.innerHTML = `<span class="player">${player.name}</span><span class="task">${task.text}</span><span class="count">(${player.tasksDone.length}. Aufgabe)</span>`;
        result.classList.add('blood-splash');
        tasksList.insertBefore(result, tasksList.firstChild);
        if (tasksList.children.length > 5) tasksList.removeChild(tasksList.lastChild);
    }

    function updateSettingsList(type) {
        if (!gameDatabase || !gameDatabase[type]) return;
        const list = type === 'players' ? playerList : taskList;
        const items = gameDatabase[type];
        list.innerHTML = '';
    
        items.forEach(item => {
            if (type === 'players' && !item.tasksDone) item.tasksDone = [];
            if (type === 'tasks' && !item.timesUsed) item.timesUsed = 0;
    
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item-input';
            itemDiv.innerHTML = `
                <input type="text" value="${type === 'players' ? item.name : item.text}" 
                       data-id="${item.id}"
                       data-original="${type === 'players' ? item.name : item.text}" 
                       maxlength="30"
                       placeholder="Enter a name or task">
                <span class="item-stats">${type === 'players' 
                    ? `${item.tasksDone ? item.tasksDone.length : 0} Aufgaben` 
                    : `${item.timesUsed || 0}x verwendet`}</span>
                <button class="btn-delete" data-id="${item.id}">×</button>
            `;
            list.appendChild(itemDiv);
        });
    }
    

    function isNameUnique(name, excludeId = null) {
        return !gameDatabase.players.some(player => player.name.toLowerCase() === name.toLowerCase() && player.id !== excludeId);
    }

    wheel.addEventListener('click', spinWheel);

    document.getElementById('settingsBtn').addEventListener('click', () => {
        updateSettingsList('players');
        updateSettingsList('tasks');
        settingsModal.style.display = 'block';
    });

    document.getElementById('closeSettingsBtn').addEventListener('click', () => settingsModal.style.display = 'none');

    document.getElementById('addPlayerBtn').addEventListener('click', async () => {
        const newId = Math.max(...gameDatabase.players.map(p => p.id), 0) + 1;
        const newPlayer = { id: newId, name: '', tasksDone: [] };
        gameDatabase.players.push(newPlayer);
        updateSettingsList('players');
        const newInput = playerList.querySelector(`input[data-id="${newId}"]`);
        if (newInput) {
            newInput.focus();
            newInput.select();
        }
    });

    document.getElementById('addTaskBtn').addEventListener('click', async () => {
        const newId = Math.max(...gameDatabase.tasks.map(t => t.id), 0) + 1;
        const newTask = { id: newId, text: '', timesUsed: 0 };
        gameDatabase.tasks.push(newTask);
        updateSettingsList('tasks');
        const newInput = taskList.querySelector(`input[data-id="${newId}"]`);
        if (newInput) {
            newInput.focus();
            newInput.select();
        }
    });

    document.addEventListener('focusout', (e) => {
        if (e.target.closest('.item-input input')) handleInputSave(e.target);
    });

    document.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.closest('.item-input input')) e.target.blur();
    });

    async function handleInputSave(input) {
        const id = parseInt(input.dataset.id);
        const isPlayerList = input.closest('#playerList');
        let newValue = input.value.trim().substring(0, 50); // Limit to 50 chars and trim
        const originalValue = input.dataset.original;
    
        // Prevent saving if the input is empty
        if (newValue === '') {
            if (isPlayerList) {
              
                gameDatabase.players = gameDatabase.players.filter(player => player.id !== id);
        await saveData();
        updateSettingsList('players'); // Refresh the player list
            } else {
                // If a task is empty, remove it from the task list
                gameDatabase.tasks = gameDatabase.tasks.filter(task => task.id !== id);
                await saveData();
                updateSettingsList('tasks'); // Refresh the task list
            }
            return;
        }
    
        // No change, so no need to save
        if (newValue === originalValue) return;
    
        if (isPlayerList) {
            if (!isNameUnique(newValue, id)) {
                alert('This name already exists!');
                input.value = originalValue;
                return;
            }
            const player = gameDatabase.players.find(p => p.id === id);
            if (player) {
                player.name = newValue;
                input.dataset.original = newValue; // Update original to new value
            }
        } else {
            const task = gameDatabase.tasks.find(t => t.id === id);
            if (task) {
                task.text = newValue;
                input.dataset.original = newValue; // Update original to new value
            }
        }
        await saveData();
    }
    

    function displayHistory() {
        tasksList.innerHTML = '';
        gameDatabase.history.slice(-5).reverse().forEach(result => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'task-result';
            resultDiv.innerHTML = `<span class="player">${result.playerName}</span>
                                    <span class="task">${result.taskText}</span>
                                    <span class="count">(${result.timestamp})</span>`;
            tasksList.appendChild(resultDiv);
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const id = parseInt(e.target.dataset.id);
            const isPlayerList = e.target.closest('#playerList');
            if (isPlayerList) {
                if (gameDatabase.players.length <= 2) return;
                gameDatabase.players = gameDatabase.players.filter(p => p.id !== id);
                updateSettingsList('players');
            } else {
                if (gameDatabase.tasks.length <= 1) return;
                gameDatabase.tasks = gameDatabase.tasks.filter(t => t.id !== id);
                updateSettingsList('tasks');
            }
            saveData();
        }
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            e.target.classList.add('active');
            document.getElementById(`${tab}Tab`).classList.remove('hidden');
        });
    });

 

    window.onclick = (e) => {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
    };

    loadData();
});

document.addEventListener('DOMContentLoaded', () => {
    createBloodSplatter();
    
    const taskPopup = document.getElementById('taskPopup');
    const popupPlayerName = document.getElementById('popupPlayerName');
    const popupTaskText = document.getElementById('popupTaskText');
    const closeTaskPopup = document.getElementById('closeTaskPopup');

    closeTaskPopup.addEventListener('click', () => {
        taskPopup.style.display = 'none';
    });

    window.onclick = function(event) {
        if (event.target == taskPopup) {
            taskPopup.style.display = 'none';
        }
    };


});

function createBloodSplatter() {
    const container = document.querySelector('.blood-container');

    function createSplatter() {
        const splatter = document.createElement('div');
        splatter.className = 'blood-splatter';
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * (window.innerHeight * 0.7);
        const size = Math.random() * 30 + 10;
        const randomShape = Math.random();
        let borderRadius;
        if (randomShape < 0.3) {
            borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
        } else if (randomShape < 0.6) {
            borderRadius = '60% 40% 50% 50% / 50% 50% 50% 50%';
        } else {
            borderRadius = '50%';
        }
        splatter.style.cssText = `left: ${x}px; top: ${y}px; width: ${size}px; height: ${size}px; border-radius: ${borderRadius}; animation: splatter ${Math.random() * 2 + 3}s linear forwards;`;

        const drip = document.createElement('div');
        drip.style.cssText = `position: absolute; top: ${size}px; left: 50%; transform: translateX(-50%); width: ${size * 0.2}px; height: ${size * 0.8}px; background: var(--blood-red); --drip-distance: ${Math.random() * 100 + 50}px; animation: drip ${Math.random() * 2 + 2}s ease-in forwards; filter: blur(1px);`;

        splatter.appendChild(drip);
        container.appendChild(splatter);

        setTimeout(() => splatter.remove(), 5000);
    }

    for (let i = 0; i < 5; i++) setTimeout(createSplatter, Math.random() * 1000);

    setInterval(() => {
        if (container.children.length < 15) createSplatter();
    }, 2000);
}

