// ========== ЗАЩИТА ==========
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ========== БАЗА ПРЕДМЕТОВ ==========
const DRAGON_IMG = "dragon.png";

const itemsDB = [
    { id: 12, name: "Dragon Prime", price: 40000, img: DRAGON_IMG } 
];

// ========== СИСТЕМА АККАУНТОВ ==========
let accounts = JSON.parse(localStorage.getItem('crushdrop_accounts')) || {};
let currentUser = JSON.parse(localStorage.getItem('crushdrop_user')) || null;
let globalClans = JSON.parse(localStorage.getItem('crushdrop_clans')) || [];

// АВТО-ИСПРАВЛЕНИЕ СТАРЫХ ЦЕН
if (currentUser && currentUser.inventory) {
    let needsSave = false;
    currentUser.inventory.forEach(item => {
        if (item.name === "Dragon Prime" && item.price !== 40000) {
            item.price = 40000;
            needsSave = true;
        }
    });
    if (needsSave) {
        localStorage.setItem('crushdrop_user', JSON.stringify(currentUser));
        accounts[currentUser.nick] = currentUser;
        localStorage.setItem('crushdrop_accounts', JSON.stringify(accounts));
    }
}

function playSuccessSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.frequency.setValueAtTime(800, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div'); toast.className = `toast ${type}`; toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideIn 0.3s reverse forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function login() {
    const nick = document.getElementById('auth-nick').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();
    if (!nick || !pass) return showToast("Заполните поля", "error");

    if (accounts[nick]) {
        if (accounts[nick].pass === pass) {
            currentUser = accounts[nick];
            localStorage.setItem('crushdrop_user', JSON.stringify(currentUser));
            showMainSite();
            showToast(`С возвращением, ${nick}!`, "success");
        } else {
            showToast("Неверный пароль!", "error");
        }
    } 
    else {
        const isAuthorNick = (nick.toLowerCase() === 'daris' || nick.toLowerCase() === 'author');
        
        const startBalance = isAuthorNick ? 1000000 : 1;
        const startInv = isAuthorNick ? [{ id: 12, name: "Dragon Prime", price: 40000, img: DRAGON_IMG }] : [];

        currentUser = { 
            nick: nick, pass: pass, id: Math.floor(10000000 + Math.random() * 90000000), 
            balance: startBalance, 
            inventory: startInv,
            usedPromos: [], luckLadder: false, luckMines: false,
            avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            authorCodeEntered: false, isAuthor: isAuthorNick, clan: null,
            passLevel: 1, passXP: 0, primePass: false, claimedFree: [], claimedPrime: []
        };
        
        accounts[nick] = currentUser;
        localStorage.setItem('crushdrop_accounts', JSON.stringify(accounts));
        localStorage.setItem('crushdrop_user', JSON.stringify(currentUser));
        showMainSite();
        showToast(`Аккаунт ${nick} успешно создан!`, "success");
    }
}

function showMainSite() { 
    document.getElementById('auth-screen').style.display = 'none'; 
    document.getElementById('main-site').style.display = 'block'; 
    updateUI(); 
    switchTab('crash'); 
}

function updateUI() {
    if (!currentUser) return;
    let displayName = currentUser.nick;
    if (currentUser.clan) {
        displayName = `[${currentUser.clan}] ${currentUser.nick}`;
        document.getElementById('clan-nav-btn').style.display = 'block';
    } else { 
        document.getElementById('clan-nav-btn').style.display = 'none'; 
    }

    document.getElementById('balance').innerText = currentUser.balance.toLocaleString('ru-RU');
    document.getElementById('profile-nick').innerText = displayName; 
    document.getElementById('profile-id').innerText = currentUser.id;
    document.getElementById('profile-balance').innerText = currentUser.balance.toLocaleString('ru-RU'); 
    
    const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    document.getElementById('header-avatar').src = currentUser.avatar || defaultAvatar;
    document.getElementById('profile-avatar-img').src = currentUser.avatar || defaultAvatar;

    if (currentUser.isAuthor) {
        document.getElementById('user-author-section').style.display = 'none';
        document.getElementById('author-dashboard').style.display = 'block';
    } else {
        document.getElementById('user-author-section').style.display = 'block';
        document.getElementById('author-dashboard').style.display = 'none';
        if (currentUser.authorCodeEntered) {
            document.getElementById('author-code-input').value = "HOLDIK";
            document.getElementById('author-code-input').disabled = true;
        }
    }
    renderInventory(); renderPass(); renderClan();
}

function logout() { 
    localStorage.removeItem('crushdrop_user'); 
    location.reload(); 
}

function saveUser() { 
    if (!currentUser) return;
    localStorage.setItem('crushdrop_user', JSON.stringify(currentUser)); 
    accounts[currentUser.nick] = currentUser;
    localStorage.setItem('crushdrop_accounts', JSON.stringify(accounts));
}

function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ========== ПРОФИЛЬ И АВАТАР ==========
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { 
        currentUser.avatar = e.target.result; 
        saveUser(); updateUI(); 
        showToast("Аватарка обновлена!", "success"); 
    };
    reader.readAsDataURL(file);
}

function changeNickname() {
    const newNick = document.getElementById('new-nick-input').value.trim();
    if (!newNick) return showToast("Введите новый ник!", "error");
    if (newNick === currentUser.nick) return showToast("Это ваш текущий ник!", "error");
    if (accounts[newNick]) return showToast("Этот ник уже занят!", "error");

    const oldNick = currentUser.nick;
    
    if (currentUser.clan) {
        const clan = globalClans.find(c => c.name === currentUser.clan);
        if (clan) {
            clan.members = clan.members.map(m => m === oldNick ? newNick : m);
            if (clan.owner === oldNick) clan.owner = newNick;
            localStorage.setItem('crushdrop_clans', JSON.stringify(globalClans));
        }
    }

    delete accounts[oldNick];
    currentUser.nick = newNick; 
    currentUser.isAuthor = (newNick.toLowerCase() === 'daris' || newNick.toLowerCase() === 'author');
    accounts[newNick] = currentUser;
    
    saveUser(); 
    updateUI(); 
    document.getElementById('new-nick-input').value = '';
    playSuccessSound(); 
    showToast(`Ник изменен на ${newNick}!`, "success");
}

function applyAuthorCode() {
    const code = document.getElementById('author-code-input').value.trim().toUpperCase();
    if (code === 'HOLDIK') {
        if (currentUser.authorCodeEntered) return;
        currentUser.authorCodeEntered = true; saveUser(); updateUI();
        playSuccessSound(); showToast("Код автора активирован!", "success");
    } else { showToast("Неверный код", "error"); }
}

function simulateDeposit(amount) {
    currentUser.balance += amount;
    saveUser(); updateUI(); closeModal('depositModal');
    showToast(`Куплено ${amount} G!`, "success");
}

// ========== ПРОМОКОДЫ ==========
function applyPromo() {
    const input = document.getElementById('promo-input');
    const code = input.value.trim().toUpperCase();
    input.value = '';
    
    if (!code) return showToast("Введите код", "error");
    
    if (code !== 'YOU_BEEN_TROLLED' && currentUser.usedPromos.includes(code)) {
        return showToast("Вы уже активировали этот промокод!", "error");
    }

    let dragonUses = parseInt(localStorage.getItem('promo_DRAGON_PR1ME')) || 0;
    let releaseUses = parseInt(localStorage.getItem('promo_RELEASE')) || 0;
    let holdikUses = parseInt(localStorage.getItem('promo_HOLDIK_POKORMI')) || 0;
    let moggniUses = parseInt(localStorage.getItem('promo_MOGGNI_SEBA')) || 0;

    if (code === 'DRAGON_PR1ME') {
        if (dragonUses >= 1) return showToast("Этот промокод уже активирован в мире!", "error");
        
        currentUser.inventory.push({ id: 12, name: "Dragon Prime", price: 40000, img: DRAGON_IMG });
        currentUser.usedPromos.push(code);
        
        dragonUses++;
        localStorage.setItem('promo_DRAGON_PR1ME', dragonUses);
        
        saveUser(); updateUI(); playSuccessSound(); 
        showToast("МЕГА УСПЕХ! Вы получили Нож Dragon Prime.", "success"); 
        closeModal('promoModal');
    } 
    else if (code === 'RELEASE') {
        if (releaseUses >= 15) return showToast("Лимит активаций исчерпан (15)!", "error");
        
        currentUser.balance += 15; 
        currentUser.usedPromos.push(code); 
        
        releaseUses++;
        localStorage.setItem('promo_RELEASE', releaseUses);
        
        saveUser(); updateUI(); playSuccessSound(); 
        showToast("Успех! Баланс пополнен на 15 G.", "success"); 
        closeModal('promoModal');
    }
    else if (code === 'HOLDIK_POKORMI') {
        if (holdikUses >= 5) return showToast("Лимит активаций исчерпан (5)!", "error");
        
        currentUser.balance += 100; 
        currentUser.usedPromos.push(code); 
        
        holdikUses++;
        localStorage.setItem('promo_HOLDIK_POKORMI', holdikUses);
        
        saveUser(); updateUI(); playSuccessSound(); 
        showToast("Успех! Баланс пополнен на 100 G.", "success"); 
        closeModal('promoModal');
    }
    else if (code === 'TIKTAK_KITKAT') {
        currentUser.usedPromos.push(code);
        saveUser(); 
        addPassXP(100); 
        playSuccessSound(); 
        showToast("Успех! Получено +100 XP к HD Pass.", "success"); 
        closeModal('promoModal');
    }
    else if (code === 'MOGGNI_SEBA') {
        if (moggniUses >= 5) return showToast("Лимит активаций исчерпан (5)!", "error");
        
        currentUser.balance += 67; 
        currentUser.usedPromos.push(code); 
        
        moggniUses++;
        localStorage.setItem('promo_MOGGNI_SEBA', moggniUses);
        
        saveUser(); updateUI(); playSuccessSound(); 
        showToast("Успех! Баланс пополнен на 67 G.", "success"); 
        closeModal('promoModal');
    }
    else if (code === 'YOU_BEEN_TROLLED') {
        showToast("Вас развели! +0 G 💀", "error"); 
        closeModal('promoModal');
    }
    else { 
        showToast("Неверный промокод", "error"); 
    }
}

// ========== ИНВЕНТАРЬ И ПАСС ==========
function renderInventory() {
    const invDiv = document.getElementById('user-inventory'); const emptyMsg = document.getElementById('empty-inv-msg'); invDiv.innerHTML = '';
    if (!currentUser.inventory || currentUser.inventory.length === 0) { emptyMsg.style.display = 'block'; return; }
    emptyMsg.style.display = 'none';
    
    currentUser.inventory.forEach((item, index) => {
        const el = document.createElement('div'); el.className = 'inv-item';
        
        el.innerHTML = `
            <img src="${item.img}">
            <div class="item-name">${item.name}</div>
            <div class="price">${item.price.toLocaleString()} G</div>
            <div class="item-actions">
                <button class="btn-sell" onclick="sellItem(${index})">Продать</button>
            </div>`;
        invDiv.appendChild(el);
    });
}
function sellItem(index) { 
    const item = currentUser.inventory[index]; 
    currentUser.balance += item.price; currentUser.inventory.splice(index, 1); 
    saveUser(); updateUI(); playSuccessSound(); showToast(`Продано ${item.name}`, "success"); 
}

function addPassXP(amount) {
    if (!currentUser) return;
    currentUser.passXP += amount;
    let req = 100 + (currentUser.passLevel - 1) * 25; let leveledUp = false;
    while (currentUser.passXP >= req && currentUser.passLevel < 100) {
        currentUser.passXP -= req; currentUser.passLevel++; req = 100 + (currentUser.passLevel - 1) * 25; leveledUp = true;
    }
    saveUser(); if (leveledUp) { playSuccessSound(); showToast(`Новый уровень Pass: ${currentUser.passLevel}!`, "success"); }
    renderPass();
}
function renderPass() {
    document.getElementById('pass-level').innerText = currentUser.passLevel;
    document.getElementById('pass-xp').innerText = currentUser.passXP;
    let req = 100 + (currentUser.passLevel - 1) * 25;
    document.getElementById('pass-xp-req').innerText = req;
    document.getElementById('pass-progress-fill').style.width = `${(currentUser.passXP / req) * 100}%`;

    const freeC = document.getElementById('free-track-levels'); const primeC = document.getElementById('prime-track-levels');
    freeC.innerHTML = ''; primeC.innerHTML = '';
    for (let i = 1; i <= 100; i++) {
        const isFreeUnlocked = currentUser.passLevel >= i; const isFreeClaimed = currentUser.claimedFree.includes(i);
        const fEl = document.createElement('div'); fEl.className = `pass-item ${isFreeUnlocked ? 'unlocked' : ''}`;
        fEl.innerHTML = `<div class="lvl">LVL ${i}</div><div class="reward">${i === 100 ? '100 G' : '10 G'}</div>`;
        if (isFreeUnlocked && !isFreeClaimed) { fEl.onclick = () => claimPass('free', i); fEl.style.cursor = 'pointer'; fEl.innerHTML += `<div class="claim-text">ЗАБРАТЬ</div>`; } 
        else if (isFreeClaimed) { fEl.innerHTML += `<div style="font-size:10px;color:#888;margin-top:5px;">Получено</div>`; }
        freeC.appendChild(fEl);

        const isPrimeUnlocked = currentUser.primePass && currentUser.passLevel >= i; const isPrimeClaimed = currentUser.claimedPrime.includes(i);
        const pEl = document.createElement('div'); pEl.className = `pass-item ${isPrimeUnlocked ? 'unlocked' : ''}`;
        pEl.innerHTML = `<div class="lvl">LVL ${i}</div><div class="reward">${i === 100 ? 'Клан HOOLD' : '15 G'}</div>`;
        if (isPrimeUnlocked && !isPrimeClaimed) { pEl.onclick = () => claimPass('prime', i); pEl.style.cursor = 'pointer'; pEl.innerHTML += `<div class="claim-text">ЗАБРАТЬ</div>`; } 
        else if (isPrimeClaimed) { pEl.innerHTML += `<div style="font-size:10px;color:#888;margin-top:5px;">Получено</div>`; }
        primeC.appendChild(pEl);
    }
}
function claimPass(type, lvl) {
    if (type === 'free') {
        if (currentUser.claimedFree.includes(lvl)) return;
        let reward = lvl === 100 ? 100 : 10; currentUser.balance += reward; currentUser.claimedFree.push(lvl);
        saveUser(); updateUI(); playSuccessSound(); showToast(`Получено ${reward} G!`, "success");
    } else {
        if (!currentUser.primePass) return showToast("Купите Prime Pass!", "error");
        if (currentUser.claimedPrime.includes(lvl)) return;
        if (lvl === 100) { showToast("Вы получили приглашение в клан HOOLD!", "success"); } 
        else { currentUser.balance += 15; showToast(`Получено 15 G!`, "success"); }
        currentUser.claimedPrime.push(lvl); saveUser(); updateUI(); playSuccessSound();
    }
    renderPass();
}
function buyPrimePass() {
    if (currentUser.primePass) return showToast("Уже куплен!", "error");
    if (currentUser.balance < 1500) return showToast("Нужно 1500 G", "error");
    currentUser.balance -= 1500; currentUser.primePass = true;
    saveUser(); updateUI(); renderPass(); playSuccessSound(); showToast("Prime Pass активирован!", "success");
}

// ========== КЛАНЫ ==========
function createClan() {
    const name = document.getElementById('create-clan-name').value.trim().toUpperCase();
    if (!/^[A-Z0-9]{2,10}$/.test(name)) return showToast("Только Англ. буквы и цифры (2-10 символов)!", "error");
    if (currentUser.balance < 500) return showToast("Нужно 500 G", "error");
    if (globalClans.find(c => c.name === name)) return showToast("Клан уже существует!", "error");
    
    currentUser.balance -= 500; 
    currentUser.clan = name;
    const newClan = { name: name, owner: currentUser.nick, members: [currentUser.nick], donations: 0, applications: [] };
    globalClans.push(newClan);
    localStorage.setItem('crushdrop_clans', JSON.stringify(globalClans));
    
    saveUser(); updateUI(); playSuccessSound(); showToast(`Клан [${name}] создан!`, "success");
}
function applyToClan() { showToast("Заявка отправлена (в тестовом режиме)", "success"); }
function renderClan() {
    const noClan = document.getElementById('clan-no-clan'); const inClan = document.getElementById('clan-in-clan');
    if (!currentUser.clan) { noClan.style.display = 'block'; inClan.style.display = 'none'; return; }
    noClan.style.display = 'none'; inClan.style.display = 'block';
    document.getElementById('clan-title-display').innerText = `Клан [${currentUser.clan}]`;
    
    const memList = document.getElementById('clan-members-list'); 
    memList.innerHTML = `<li>${currentUser.nick} 👑</li>`;
}
function leaveClan() {
    if (!currentUser.clan) return;
    const clan = globalClans.find(c => c.name === currentUser.clan);
    if (clan) {
        if (clan.owner === currentUser.nick) globalClans = globalClans.filter(c => c.name !== clan.name);
        else clan.members = clan.members.filter(m => m !== currentUser.nick);
        localStorage.setItem('crushdrop_clans', JSON.stringify(globalClans));
    }
    currentUser.clan = null; 
    saveUser(); updateUI(); showToast("Вы покинули клан.", "info");
}

// ========== КРАШ ==========
let isCrashRunning = false, crashMultiplier = 1.00, crashBetAmount = 0, crashAutoStop = 0;
let animationId, startTime, crashPoint;
const canvas = document.getElementById('crash-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

function resizeCanvas() {
    if(canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        drawGraph();
    }
}
window.addEventListener('resize', resizeCanvas);

function drawGraph() {
    if (!ctx || !canvas.width) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1f1f1f'; ctx.lineWidth = 1; const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    
    if (!isCrashRunning) return;

    let progress = Math.min(1, (Date.now() - startTime) / 10000); 
    let currentY = canvas.height - ((crashMultiplier - 1) * 100); 
    let currentX = progress * canvas.width;

    ctx.beginPath(); ctx.moveTo(0, canvas.height); ctx.lineTo(currentX, currentY); ctx.lineTo(currentX, canvas.height); ctx.fillStyle = 'rgba(255, 68, 68, 0.1)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, canvas.height); ctx.lineTo(currentX, currentY); ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 4; ctx.stroke();
}

function toggleCrash() {
    if (isCrashRunning) {
        let win = Math.floor(crashBetAmount * crashMultiplier); currentUser.balance += win;
        updateUI(); saveUser(); playSuccessSound(); showToast(`Забрано ${win.toLocaleString()} G!`, "success"); 
        stopCrash();
    } else {
        const bet = parseInt(document.getElementById('crash-bet').value);
        const autoStop = parseFloat(document.getElementById('crash-autostop').value);
        if (isNaN(bet) || bet < 1 || bet > currentUser.balance) return showToast("Ошибка ставки", "error");
        
        crashBetAmount = bet; crashAutoStop = autoStop > 1 ? autoStop : 0;
        currentUser.balance -= bet; 
        updateUI(); saveUser(); addPassXP(Math.floor(bet * 0.5));
        
        isCrashRunning = true; crashMultiplier = 1.00; 
        crashPoint = Math.random() < 0.05 ? 1.00 : parseFloat((1 / (1 - Math.random() * 0.95)).toFixed(2)); 
        startTime = Date.now();
        
        document.getElementById('crash-multiplier').innerText = `x1.00`;
        const btn = document.getElementById('crash-action-btn'); btn.innerText = "Забрать"; btn.classList.add('cashout-mode');
        resizeCanvas();
        
        const gameLoop = () => {
            if (!isCrashRunning) return;
            let elapsed = Date.now() - startTime;
            crashMultiplier = parseFloat(Math.pow(Math.E, 0.00006 * elapsed).toFixed(2));
            document.getElementById('crash-multiplier').innerText = `x${crashMultiplier.toFixed(2)}`;
            drawGraph();
            if (crashAutoStop > 0 && crashMultiplier >= crashAutoStop) { toggleCrash(); return; }
            if (crashMultiplier >= crashPoint) { 
                isCrashRunning = false; cancelAnimationFrame(animationId);
                document.getElementById('crash-multiplier').innerText = `x${crashMultiplier.toFixed(2)}`;
                const btn = document.getElementById('crash-action-btn'); btn.innerText = "Играть"; btn.classList.remove('cashout-mode');
                showToast(`КРАШ на x${crashMultiplier.toFixed(2)}!`, "error");
                return;
            }
            animationId = requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
}

function stopCrash() {
    isCrashRunning = false; cancelAnimationFrame(animationId);
    const btn = document.getElementById('crash-action-btn'); btn.innerText = "Играть"; btn.classList.remove('cashout-mode');
    drawGraph();
}

// ========== ИГРА САПЕР ==========
let minesState = { active: false, bet: 1, bombs: 3, grid: [], opened: 0, totalSafe: 22 };

function updateMinesUI() {
    const maxWinEl = document.getElementById('mines-max-win');
    if (maxWinEl) {
        let maxMult = (1 / ((25 - minesState.bombs) / 25)); 
        if (minesState.bombs >= 24) maxMult = 25;
        const maxWin = Math.floor(minesState.bet * maxMult * 0.95);
        maxWinEl.innerText = maxWin.toLocaleString('ru-RU');
    }
    const trapEl = document.getElementById('mines-trap-count');
    if (trapEl) trapEl.innerText = minesState.bombs;
}

function initMinesGame() {
    if (minesState.active) return;
    let betInput = document.getElementById('mines-bet-input');
    if(betInput) minesState.bet = parseInt(betInput.value) || 1;
    
    const grid = document.getElementById('mines-grid');
    if(!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell'; cell.id = `mine-cell-${i}`;
        cell.onclick = () => openMineCell(i);
        grid.appendChild(cell);
    }
}

function startMinesGame() {
    if (minesState.active) return;
    minesState.bet = parseInt(document.getElementById('mines-bet-input').value);
    if (isNaN(minesState.bet) || minesState.bet < 1 || minesState.bet > currentUser.balance) return showToast("Ошибка ставки", "error");
    
    currentUser.balance -= minesState.bet;
    updateUI(); saveUser(); addPassXP(Math.floor(minesState.bet * 0.5));
    
    let newGrid = Array(25).fill(0); 
    let bombsPlaced = 0;
    while (bombsPlaced < minesState.bombs) { 
        const idx = Math.floor(Math.random() * 25); 
        if (newGrid[idx] === 0) { newGrid[idx] = 1; bombsPlaced++; } 
    }
    
    minesState.active = true; minesState.grid = newGrid;
    minesState.opened = 0; minesState.totalSafe = 25 - minesState.bombs;
    
    initMinesGame();
    document.getElementById('mines-bet-input').disabled = true;
    document.getElementById('mines-trap-minus').disabled = true;
    document.getElementById('mines-trap-plus').disabled = true;
    document.getElementById('mines-btn-half').disabled = true;
    document.getElementById('mines-btn-double').disabled = true;
    
    const btn = document.getElementById('mines-play-btn');
    btn.innerText = "Забрать"; btn.classList.add('cashout-mode');
}

function openMineCell(index) {
    if (!minesState.active) return;
    const cell = document.getElementById(`mine-cell-${index}`);
    if (cell.classList.contains('revealed')) return;
    
    cell.classList.add('revealed');
    let isBomb = minesState.grid[index] === 1;
    
    if (isBomb && currentUser.luckMines) { 
        isBomb = false; currentUser.luckMines = false; 
        minesState.grid[index] = 0; minesState.totalSafe++; 
        saveUser(); updateUI(); showToast("УДАЧА СПАСЛА!", "success"); 
    }
    
    if (isBomb) {
        minesState.active = false; cell.classList.add('bomb');
        for (let i = 0; i < 25; i++) { 
            if (minesState.grid[i] === 1) document.getElementById(`mine-cell-${i}`).classList.add('revealed', 'bomb'); 
        }
        showToast(`Взрыв! Проиграно ${minesState.bet} G.`, "error");
        setTimeout(() => endMinesGame(), 2000);
        return;
    }
    
    cell.classList.add('safe'); cell.innerText = 'G'; minesState.opened++;
    const mul = getMinesMultiplier();
    const winAmount = Math.floor(minesState.bet * mul);
    document.getElementById('mines-play-btn').innerText = `Забрать ${winAmount} G (x${mul})`;
    
    if (minesState.opened === minesState.totalSafe) { cashoutMines(); }
}

function getMinesMultiplier() {
    if (minesState.opened === 0) return 1;
    let mul = 1;
    for (let i = 0; i < minesState.opened; i++) { 
        const c = (minesState.totalSafe - i) / (25 - i); mul *= (1 / c); 
    }
    return parseFloat((mul * 0.95).toFixed(2));
}

function cashoutMines() {
    if (!minesState.active) return; 
    minesState.active = false; 
    const mul = getMinesMultiplier(); 
    const winAmount = Math.floor(minesState.bet * mul);
    currentUser.balance += winAmount; 
    updateUI(); saveUser(); playSuccessSound(); 
    showToast(`Забрано ${winAmount} G!`, "success"); 
    endMinesGame();
}

function endMinesGame() {
    minesState.active = false;
    let betInput = document.getElementById('mines-bet-input');
    if(betInput) betInput.disabled = false;
    
    let trapMinus = document.getElementById('mines-trap-minus');
    if(trapMinus) trapMinus.disabled = false;
    
    let trapPlus = document.getElementById('mines-trap-plus');
    if(trapPlus) trapPlus.disabled = false;
    
    let btnHalf = document.getElementById('mines-btn-half');
    if(btnHalf) btnHalf.disabled = false;

    let btnDouble = document.getElementById('mines-btn-double');
    if(btnDouble) btnDouble.disabled = false;

    const btn = document.getElementById('mines-play-btn');
    if(btn) {
        btn.innerText = "Играть"; 
        btn.classList.remove('cashout-mode');
    }
    initMinesGame(); updateMinesUI();
}

// ========== ЛЕСЕНКА ==========
let selectedStones = 3;
let ladderState = { active: false, currentLevel: 0, maxLevel: 12, bet: 0, stones: 3, multipliers: [] };
const ladderMultipliersDB = {
    1: [1.06, 1.12, 1.19, 1.27, 1.36, 1.46, 1.58, 1.72, 1.89, 2.10, 2.36, 2.70],
    2: [1.12, 1.27, 1.46, 1.72, 2.10, 2.65, 3.48, 4.80, 7.00, 11.00, 18.00, 30.00],
    3: [1.12, 1.33, 1.60, 1.94, 2.39, 2.99, 3.81, 4.95, 6.60, 9.08, 12.97, 19.46],
    4: [1.18, 1.51, 1.94, 2.54, 3.39, 4.62, 6.47, 9.36, 14.02, 22.03, 36.72, 66.10],
    5: [1.27, 1.72, 2.38, 3.37, 4.90, 7.35, 11.43, 18.57, 31.83, 58.36, 116.72, 262.62],
    6: [1.36, 1.99, 2.98, 4.61, 7.38, 12.30, 21.52, 39.97, 79.94, 175.87, 439.68, 1319.04],
    7: [1.46, 2.31, 3.78, 6.43, 11.43, 21.43, 42.86, 92.86, 222.86, 612.86, 2042.87, 9192.92]
};
function selectStones(count) {
    if (ladderState.active) return;
    selectedStones = count;
    document.querySelectorAll('.stone-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.stone-btn[onclick="selectStones(${count})"]`).classList.add('active');
    renderEmptyLadder();
}
function renderEmptyLadder() {
    const grid = document.getElementById('ladder-grid'); if(!grid) return; grid.innerHTML = '';
    const muls = ladderMultipliersDB[selectedStones];
    for (let i = ladderState.maxLevel - 1; i >= 0; i--) {
        const levelDiv = document.createElement('div'); levelDiv.className = 'ladder-level';
        levelDiv.innerHTML = `<div class="level-multiplier">X${muls[i].toFixed(2)}</div>`;
        const tracksDiv = document.createElement('div'); tracksDiv.className = 'level-tracks';
        for (let j = 0; j < 9; j++) { const track = document.createElement('div'); track.className = 'track'; tracksDiv.appendChild(track); }
        levelDiv.appendChild(tracksDiv); grid.appendChild(levelDiv);
    }
}
function handleLadderButton() { if (!ladderState.active) { startLadder(); } else { cashoutLadder(); } }
function startLadder() {
    const bet = parseInt(document.getElementById('ladder-bet').value);
    if (isNaN(bet) || bet < 1 || bet > currentUser.balance) return showToast("Ошибка ставки", "error");
    currentUser.balance -= bet; updateUI(); saveUser(); addPassXP(Math.floor(bet * 0.5));
    ladderState = { active: true, currentLevel: 0, maxLevel: 12, bet: bet, stones: selectedStones, multipliers: ladderMultipliersDB[selectedStones] };
    const btn = document.getElementById('ladder-main-btn'); btn.innerText = `Забрать ${bet} G`; btn.classList.add('cashout-mode'); btn.disabled = false;
    const char = document.getElementById('character-icon'); char.style.display = 'block'; char.innerText = "🧗"; char.style.filter = "none"; char.style.bottom = "20px";
    const grid = document.getElementById('ladder-grid'); grid.innerHTML = '';
    for (let i = ladderState.maxLevel - 1; i >= 0; i--) {
        const levelDiv = document.createElement('div'); levelDiv.className = 'ladder-level'; levelDiv.id = `level-${i}`;
        levelDiv.innerHTML = `<div class="level-multiplier">X${ladderState.multipliers[i].toFixed(2)}</div>`;
        const tracksDiv = document.createElement('div'); tracksDiv.className = 'level-tracks';
        for (let j = 0; j < 9; j++) {
            const track = document.createElement('div'); track.className = 'track'; track.id = `track-${i}-${j}`;
            if (i === 1) { track.onclick = () => climbLadder(i, j); track.classList.add('active'); }
            tracksDiv.appendChild(track);
        }
        levelDiv.appendChild(tracksDiv); grid.appendChild(levelDiv);
    }
}
function climbLadder(level, trackIndex) {
    if (!ladderState.active || level !== ladderState.currentLevel + 1) return;
    ladderState.currentLevel = level;
    const char = document.getElementById('character-icon'); const targetTrack = document.getElementById(`track-${level}-${trackIndex}`);
    if (!targetTrack) return;
    const trackRect = targetTrack.getBoundingClientRect(); const areaRect = document.getElementById('ladder-game-area').getBoundingClientRect();
    const charLeft = trackRect.left - areaRect.left + (trackRect.width / 2) - 9; const charBottom = areaRect.bottom - trackRect.top - 10; 
    char.style.left = `${charLeft}px`; char.style.bottom = `${charBottom}px`;
    const rocksContainer = document.getElementById('falling-rocks'); rocksContainer.innerHTML = '';
    const successChance = 1 - (ladderState.stones * 0.07); let isLoss = Math.random() > successChance;
    if (isLoss && currentUser.luckLadder) { isLoss = false; currentUser.luckLadder = false; saveUser(); updateUI(); showToast("УДАЧА СПАСЛА!", "success"); }
    for (let i = 0; i < ladderState.stones; i++) {
        const rock = document.createElement('div'); rock.className = 'rock';
        let rockX = (isLoss && i === 0) ? (charLeft + 9 - 15) : (Math.random() * (areaRect.width - 40));
        rock.style.left = `${rockX}px`; rock.style.top = `-30px`; rocksContainer.appendChild(rock);
    }
    if (isLoss) {
        ladderState.active = false; char.innerText = "💀"; char.style.filter = "grayscale(1)";
        const panel = document.getElementById('ladder-panel'); panel.classList.add('shake-effect'); setTimeout(() => panel.classList.remove('shake-effect'), 500);
        showToast(`Камень упал! Проиграно ${ladderState.bet} G.`, "error");
        const btn = document.getElementById('ladder-main-btn'); btn.innerText = "Начать игру"; btn.classList.remove('cashout-mode'); btn.disabled = true; 
        setTimeout(() => { char.style.display = 'none'; renderEmptyLadder(); btn.disabled = false; }, 1500); return;
    }
    for (let j = 0; j < 9; j++) { const oldTrack = document.getElementById(`track-${ladderState.currentLevel - 1}-${j}`); if (oldTrack) oldTrack.classList.add('passed'); }
    if (ladderState.currentLevel + 1 < ladderState.maxLevel) {
        for (let j = 0; j < 9; j++) { const nextTrack = document.getElementById(`track-${ladderState.currentLevel + 1}-${j}`); if (nextTrack) { nextTrack.classList.add('active'); nextTrack.onclick = () => climbLadder(ladderState.currentLevel + 1, j); } }
    }
    const winAmount = Math.floor(ladderState.bet * ladderState.multipliers[ladderState.currentLevel - 1]);
    document.getElementById('ladder-main-btn').innerText = `Забрать ${winAmount.toLocaleString()} G`;
    if (ladderState.currentLevel >= ladderState.maxLevel) { showToast("Ты на вершине!", "success"); cashoutLadder(); return; }
}
function cashoutLadder() {
    if (!ladderState.active) return; 
    let winAmount = ladderState.bet;
    if (ladderState.currentLevel > 0) winAmount = Math.floor(ladderState.bet * ladderState.multipliers[ladderState.currentLevel - 1]);
    currentUser.balance += winAmount; updateUI(); saveUser(); playSuccessSound(); showToast(`Забрано ${winAmount.toLocaleString()} G!`, "success");
    ladderState.active = false; const btn = document.getElementById('ladder-main-btn'); btn.innerText = "Начать игру"; btn.classList.remove('cashout-mode');
    document.getElementById('character-icon').style.display = 'none'; renderEmptyLadder();
}

// ========== ВКЛАДКИ ==========
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn, .dropdown-content button').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    if (tabName === 'inventory' || tabName === 'clan') {
        const btn = document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`); if(btn) btn.classList.add('active');
    } else {
        document.querySelector('.dropdown-toggle').classList.add('active');
        const btn = document.querySelector(`.dropdown-content button[onclick="switchTab('${tabName}')"]`); if(btn) btn.classList.add('active');
    }
    
    if (tabName === 'crash') setTimeout(resizeCanvas, 50); 
    if (tabName === 'mines') initMinesGame();
}

// Инициализация при загрузке
window.addEventListener('DOMContentLoaded', () => {
    renderPass(); updateMinesUI();
    setTimeout(resizeCanvas, 100);
    
    if (currentUser) {
        showMainSite();
    }

    const trapMinus = document.getElementById('mines-trap-minus');
    if(trapMinus) {
        trapMinus.onclick = () => { if (!minesState.active && minesState.bombs > 1) { minesState.bombs--; updateMinesUI(); } };
        document.getElementById('mines-trap-plus').onclick = () => { if (!minesState.active && minesState.bombs < 24) { minesState.bombs++; updateMinesUI(); } };
        document.getElementById('mines-btn-half').onclick = () => { if (minesState.active) return; let val = parseInt(document.getElementById('mines-bet-input').value) || 1; document.getElementById('mines-bet-input').value = Math.max(1, Math.floor(val / 2)); updateMinesUI(); };
        document.getElementById('mines-btn-double').onclick = () => { if (minesState.active) return; let val = parseInt(document.getElementById('mines-bet-input').value) || 1; document.getElementById('mines-bet-input').value = val * 2; updateMinesUI(); };
        document.getElementById('mines-play-btn').onclick = () => { if (minesState.active) cashoutMines(); else startMinesGame(); };
    }
});