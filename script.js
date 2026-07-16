    function currentUser() { return document.getElementById('current-username').innerText; }

    // 統一封裝 POST 請求樣板，回傳值與原本的 fetch(...) 完全相同（一個 Promise<Response>），
    // 所以呼叫端原有的 .then(res => res.json()) 或 await fetch(...) 寫法都不需要更動。
    function gasPost(action, payload = {}) {
        return fetch(gasURL, { method: 'POST', body: JSON.stringify({ action: action, ...payload }) });
    }

    // 在目前的航程搜尋結果下，靜默重新抓取名單並重繪（不開關 loading，交由呼叫端自行控制）
    function refreshCurrentList() {
        const groupCode = document.getElementById('search-groupCode').value;
        if (!groupCode) return Promise.resolve();
        return fetch(gasURL + "?action=searchOrders&groupCode=" + encodeURIComponent(groupCode) + "&t=" + Date.now())
            .then(res => res.json())
            .then(res => { if (res.status === 'success') { window.currentGroupData = res.data; window.currentGroupHeaders = res.headers; renderList(); } })
            .catch(() => {});
    }

    function pNum(val) {
        if (val === undefined || val === null || val === '') return 0;
        return Number(String(val).replace(/,/g, '')) || 0;
    }

    function fmtNum(val) {
        if (val === undefined || val === null || val === '') return "0";
        let num = Number(String(val).replace(/,/g, ''));
        if (isNaN(num)) return "0";
        return num.toLocaleString('en-US');
    }

    function formatNumInput(input) {
        if (input.value === "" || input.value === "-") return;
        input.value = fmtNum(input.value);
    }

    function unformatNum(input) {
        if (input.value === "0") { input.value = ""; return; }
        input.value = String(input.value).replace(/,/g, '');
        input.select();
    }

    function getCurrentYYYYMM() {
        const now = new Date();
        return now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0');
    }
    
    function fmtDate(val) {
        if (!val) return "";
        let str = String(val);
        if (str.includes("T")) {
            let parts = str.split("T");
            if(parts[0].match(/^\d{4}-\d{2}-\d{2}$/)) return parts[0].replace(/-/g, '/');
        }
        let parsed = new Date(str);
        if (!isNaN(parsed) && str.includes("GMT")) {
            let m = String(parsed.getMonth()+1).padStart(2, '0');
            let d = String(parsed.getDate()).padStart(2, '0');
            return `${parsed.getFullYear()}/${m}/${d}`;
        }
        return str.replace(/-/g, '/');
    }

    function formatDateInput(input) {
        let v = input.value.replace(/[^\d\/]/g, '');
        if (input.value !== v) { input.value = v; }
    }

    function validateDateBlur(input) {
        let v = input.value.trim();
        if (!v) return;
        let digits = v.replace(/\D/g, '');
        if (digits.length === 8 && !v.includes('/')) {
            v = digits.slice(0,4) + '/' + digits.slice(4,6) + '/' + digits.slice(6);
            input.value = v;
        }
        if (!isValidDate(v)) {
            customAlert("生日日期錯誤！請確認日期格式為 YYYY/MM/DD", "warning");
            input.value = ""; 
        }
    }

    function isValidDate(dateString) {
        if (!dateString || dateString.trim() === "") return true;
        const parts = dateString.split('/');
        if (parts.length !== 3) return false;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
        if (year < 1900 || year > 2100) return false;
        if (month < 1 || month > 12) return false;
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day < 1 || day > daysInMonth) return false;
        return true;
    }

    // 完整的房型規範(前端嚴格綁定標籤)
    const roomOptionsHTML = `
        <option value="">-- 請選擇房型 --</option>
        <option value="Pair Owner's Suite-A1-(雙人)主人套房">Pair Owner's Suite-A1-(雙人)主人套房</option>
        <option value="Pair Penthouse Suite-A2-(雙人)閣樓套房">Pair Penthouse Suite-A2-(雙人)閣樓套房</option>
        <option value="Pair Premium Suite-A3-(雙人)尊爵套房">Pair Premium Suite-A3-(雙人)尊爵套房</option>
        <option value="Pair Suite-A4-(雙人)豪華套房">Pair Suite-A4-(雙人)豪華套房</option>
        <option value="Pair Junior Suite-B-(雙人)迷你套房">Pair Junior Suite-B-(雙人)迷你套房</option>
        <option value="Pair Balcony Ⅰ-C1-(雙人)陽台房I">Pair Balcony Ⅰ-C1-(雙人)陽台房I</option>
        <option value="Pair Balcony Ⅱ-C2-(雙人)陽台房II">Pair Balcony Ⅱ-C2-(雙人)陽台房II</option>
        <option value="Pair Outside wide-D1-(雙人)海景寬敞房">Pair Outside wide-D1-(雙人)海景寬敞房</option>
        <option value="Pair Outside view-D2-(雙人)海景景緻房">Pair Outside view-D2-(雙人)海景景緻房</option>
        <option value="Pair OutsideⅠ-E-(雙人)海景房I">Pair OutsideⅠ-E-(雙人)海景房I</option>
        <option value="Pair OutsideⅡ-F-(雙人)海景房II">Pair OutsideⅡ-F-(雙人)海景房II</option>
        <option value="Pair Inside-G-(雙人)內艙房">Pair Inside-G-(雙人)內艙房</option>
        <option value="Single Balcony Ⅰ-I-(單人)陽台房I">Single Balcony Ⅰ-I-(單人)陽台房I</option>
        <option value="Single Balcony Ⅱ-J-(單人)陽台房II">Single Balcony Ⅱ-J-(單人)陽台房II</option>
        <option value="Single Outside Ⅰ-K-(單人)海景房I">Single Outside Ⅰ-K-(單人)海景房I</option>
        <option value="Single Outside Ⅱ-L-(單人)海景房II">Single Outside Ⅱ-L-(單人)海景房II</option>
        <option value="Single Inside-M-(單人)內艙房">Single Inside-M-(單人)內艙房</option>
        <option value="Semi Single Outside Ⅰ-E2-(半單)海景房I">Semi Single Outside Ⅰ-E2-(半單)海景房I</option>
        <option value="Semi Single Outside Ⅱ-F2-(半單)海景房II">Semi Single Outside Ⅱ-F2-(半單)海景房II</option>
        <option value="Semi Single Inside-G2-(半單)內艙房">Semi Single Inside-G2-(半單)內艙房</option>
        <option value="Friendly Outside Ⅱ-F4-(友好)海景房II">Friendly Outside Ⅱ-F4-(友好)海景房II</option>
        <option value="Friendly Inside-G3-(友好)內艙房">Friendly Inside-G3-(友好)內艙房</option>
        <option value="Friendly inside young-Y-(青年價)內艙房">Friendly inside young-Y-(青年價)內艙房</option>
    `;

    const gasURL = "https://script.google.com/macros/s/AKfycbwXVsk6P7i3KcYsgXNtJ-e8EHb546aprMrLeWtm2gvr0ew0vZUvtTtUB38RXeMmIZPYpw/exec";
    let passengerCount = 0; let blockCounter = 0;
    let priceDict = {}; let existingPassengers = []; 
    window.currentGroupData = []; window.currentGroupHeaders = []; let cachedLogs = null;
    let isLogsDirty = true; 
    let managerType = ""; let currentManagerOldTag = ""; let managerLeaderNo = null; let cancelTargetNo = null;
    let tempSelectedNos = new Set(); let hiddenCols = []; window.globalLogCache = [];
    window.voyageDefaults = {};
    let activeColFilters = {};
    let activeColSort = null;
    let currentFilterCol = ""; 
    let forceNoSort = false;

    // 帳款系統相關變數
    let accReportData = {}; 
    let accExtraCols = []; 
    let accAllPossibleCols = new Set();
    const accDefaultCols = ["NO.", "旅客姓名", "NAME", "ID", "各種優惠價/船內特典", "房型", "登船港", "離船港", "名義變更金額", "SF船費", "JGD", "AGTD", "佣金", "佣金%", "港務費", "小費", "國際旅客稅", "下鋪指定A", "下鋪指定B", "免治馬桶", "房型升等", "SET應付"];
    
    // 手動加入帳款名單相關變數
    let accManualAvailable = [];
    let accManualSelected = [];
    let currentAccAddVoyage = "";
    let accHeadersCache = [];

    function clearInput(id) {
        const el = document.getElementById(id);
        el.value = ''; el.focus();
        if(id === 'global-groupCode') { document.getElementById('step-2-container').style.opacity = '0'; setTimeout(() => document.getElementById('step-2-container').style.display = 'none', 400); handleGroupInput(); }
        if(id === 'log-search-kw') { renderLogsUI(window.globalLogCache); }
        if(id === 'acc-add-voyage') { document.getElementById('acc-add-search').value = ""; accManualAvailable = []; renderAccAddLists(); }
    }

    let modalCallback = null;
    
    function showCustomModal(options) {
        document.getElementById('modal-title').innerText = options.title || 'INFORMATION';
        document.getElementById('modal-msg').innerHTML = options.msg.replace(/\n/g, '<br>');
        const btnCancel = document.getElementById('modal-btn-cancel'); 
        const btnConfirm = document.getElementById('modal-btn-confirm');
        
        btnCancel.onclick = function() { closeModal(false); };
        btnConfirm.onclick = function() { closeModal(true); };

        if (options.type === 'confirm') { 
            btnCancel.style.display = 'block'; 
            btnCancel.innerText = '取消'; 
            btnConfirm.innerText = 'CONFIRM'; 
        } 
        else { btnCancel.style.display = 'none'; btnConfirm.innerText = '確定'; }
        
        modalCallback = options.callback || null; 
        document.getElementById('custom-modal').classList.add('show');
    }
    
    function closeModal(isConfirm) { 
        document.getElementById('custom-modal').classList.remove('show'); 
        document.querySelector('#custom-modal .modal-box').style.width = '';
        document.querySelector('#custom-modal .modal-box').style.maxWidth = '';

        if (modalCallback && isConfirm) setTimeout(modalCallback, 200); 
        modalCallback = null; 
    }
    
    function customAlert(msg, type = 'info') { let title = 'INFORMATION';
        if (type === 'success') title = 'SUCCESS'; if (type === 'error') title = 'ERROR';
        if (type === 'warning') title = 'WARNING'; showCustomModal({ type: 'alert', title, msg });
    }
    function customConfirm(msg, onConfirm, isDanger = false) { showCustomModal({ type: 'confirm', title: isDanger ? 'DANGEROUS ACTION' : 'PLEASE CONFIRM', msg: msg, callback: onConfirm }); }
    
    function customPrompt(title, msg, isPassword) {
        return new Promise((resolve) => {
            document.getElementById('input-modal-title').innerText = title;
            document.getElementById('input-modal-msg').innerHTML = msg;
            let inputGrp = document.querySelector('#input-modal .input-group');
            inputGrp.innerHTML = `<input type="${isPassword ? 'password' : 'text'}" id="input-modal-value" style="text-align: center; font-size: 18px; font-weight: 500; height:50px; color:var(--primary);" onkeydown="if(event.key === 'Enter') closeInputModal(true)">`;
            
            window._inputModalResolve = resolve;
            document.getElementById('input-modal').classList.add('show');
            setTimeout(() => document.getElementById('input-modal-value').focus(), 100);
        });
    }
    function closeInputModal(isConfirm) {
        let valEl = document.getElementById('input-modal-value') || document.getElementById('input-modal-select');
        let val = valEl ? valEl.value : null;
        document.getElementById('input-modal').classList.remove('show');
        if (window._inputModalResolve) {
            let resolveFn = window._inputModalResolve;
            window._inputModalResolve = null;
            setTimeout(() => resolveFn(isConfirm ? val : null), 300);
        }
    }

    function showLoading(text = 'LOADING...') { document.getElementById('loading-text').innerText = text; document.getElementById('loading-overlay').style.display = 'flex'; }
    function hideLoading() { document.getElementById('loading-overlay').style.display = 'none'; }
    function showTagTooltip(e, contentHTML) { let tt = document.getElementById('global-tooltip'); tt.innerHTML = contentHTML; tt.style.display = 'block';
        tt.style.left = (e.clientX + 15) + 'px'; tt.style.top = (e.clientY + 15) + 'px';
    }
    function hideTagTooltip() { document.getElementById('global-tooltip').style.display = 'none'; }
    function moveTagTooltip(e) { let tt = document.getElementById('global-tooltip');
        if(tt.style.display === 'block') { tt.style.left = (e.clientX + 15) + 'px'; tt.style.top = (e.clientY + 15) + 'px'; } 
    }

    // 自動判斷並洗淨 Log 的專用函數
    function formatLogContentForDisplay(rawStr) {
        let str = String(rawStr || "");
        
        // 1. 處理 GAS 可能將 Array stringify 存入的情況
        try {
            if (str.startsWith('[') && str.endsWith(']')) {
                let parsed = JSON.parse(str);
                if (Array.isArray(parsed)) str = parsed.join('\n\n');
            }
        } catch(e) {}

        // 2. 針對舊有歷史紀錄（帶有 HTML 的），進行乾淨轉換
        if (str.includes('<') && str.includes('>')) {
            str = str.replace(/<br\s*\/?>/gi, '\n');
            str = str.replace(/<\/div>/gi, '\n');
            str = str.replace(/<\/p>/gi, '\n');
            str = str.replace(/<\/li>/gi, '\n');
            str = str.replace(/<li[^>]*>/gi, '• ');
            str = str.replace(/&nbsp;/g, ' ');
            str = str.replace(/<[^>]*>/g, ''); // 拔除剩餘所有 HTML 標籤
        }

        // 3. 將純文字被逗號相連的情況，盡量排版好
        str = str.replace(/,(\s*\[NO\.)/g, '\n\n$1');
        
        // 4. 將連續多個換行縮減為兩個，保持版面整潔
        str = str.replace(/\n{3,}/g, '\n\n');
        
        return str.trim();
    }

    function showLogDetails(content) { 
        document.getElementById('log-detail-content').innerText = formatLogContentForDisplay(content); 
        document.getElementById('log-detail-modal').classList.add('show'); 
    }

    function copyLogDetails() { navigator.clipboard.writeText(document.getElementById('log-detail-content').innerText).then(() => customAlert('已複製明細到剪貼簿！', 'success')); }

    window.onload = function() {
        const statusEl = document.getElementById('system-status');
        const t = new Date().getTime();
        fetch(gasURL + "?action=getPriceData&t=" + t).then(res => res.json()).then(res => { 
            if(res.status === 'success') { 
                priceDict = res.data; 
                window.voyageDefaults = res.voyageDefaults || {}; 
                statusEl.innerText = "(READY)"; 
                statusEl.style.color = "var(--success)"; 
                const groupCodeInput = document.getElementById('global-groupCode');
                groupCodeInput.disabled = false;
                groupCodeInput.placeholder = "手動輸入或選擇";
            } 
        });
        fetch(gasURL + "?action=getGroupList&t=" + t).then(res => res.json()).then(res => { if(res.status === 'success') { const datalist = document.getElementById('groupOptions'); datalist.innerHTML = ""; res.data.forEach(group => { const opt = document.createElement('option'); opt.value = group; datalist.appendChild(opt); }); } });
    };

    function switchTab(id) { document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active')); document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active')); document.getElementById(id).classList.add('active'); document.querySelector(`.nav-tab[onclick="switchTab('${id}')"]`).classList.add('active'); if(id === 'page-logs') loadLogs(false); }
    
    function generateRoomId() { return "RM-" + Date.now().toString().slice(-5) + Math.floor(Math.random()*10); }

    function handleGroupInput() { 
        for(let i=1; i<=blockCounter; i++) { applyVoyageDefaults(i); autoCalcPrice(i); }
    }

    function applyVoyageDefaults(num) {
        const block = document.getElementById(`p-block-${num}`);
        if(!block) return;
        const groupCode = document.getElementById('global-groupCode').value.trim();
        let defs = window.voyageDefaults[groupCode];
        if (defs) {
            block.querySelector('.h-portFee').value = fmtNum(defs.portFee);
            block.querySelector('.h-tips').value = fmtNum(defs.tips);
            block.querySelector('.h-intlTax').value = fmtNum(defs.intlTax);
            block.querySelector('.h-alaskaTax').value = fmtNum(defs.alaskaTax);
            if (defs.boardPort !== undefined && defs.boardPort !== "") block.querySelector('.p-board-port').value = defs.boardPort;
            if (defs.offPort !== undefined && defs.offPort !== "") block.querySelector('.p-off-port').value = defs.offPort;
        } else {
            block.querySelector('.h-portFee').value = "0";
            block.querySelector('.h-tips').value = "0";
            block.querySelector('.h-intlTax').value = "0";
            block.querySelector('.h-alaskaTax').value = "0";
            block.querySelector('.p-board-port').value = "Yokohama";
            block.querySelector('.p-off-port').value = "Keelung";
        }
    }

    function handleGroupChange() {
        const groupCode = document.getElementById('global-groupCode').value;
        if(!groupCode) return;
        const step2 = document.getElementById('step-2-container'); step2.style.display = 'block'; setTimeout(() => step2.style.opacity = '1', 50);
        if (passengerCount === 0) addPassenger();
        const t = new Date().getTime();
        fetch(gasURL + "?action=getExistingPassengers&groupCode=" + encodeURIComponent(groupCode) + "&t=" + t).then(res => res.json()).then(res => { if(res.status === 'success') { existingPassengers = res.data; updateAllJoinSelects(); } });
        for(let i=1; i<=blockCounter; i++) { applyVoyageDefaults(i); autoCalcPrice(i); }
    }

    function updateAllJoinSelects() { 
        const dlName = document.getElementById('existing-list-name');
        const dlId = document.getElementById('existing-list-id');
        dlName.innerHTML = ''; dlId.innerHTML = '';
        existingPassengers.forEach(p => { 
            if(p.name) { const o = document.createElement('option'); o.value = p.name; dlName.appendChild(o); }
            if(p.id) { const o = document.createElement('option'); o.value = p.id; dlId.appendChild(o); }
        });
    }

    function joinExistingRoom(inputEl, num, type) {
        const roomIdInput = document.querySelector(`#p-block-${num} .p-room-id`);
        const currentRoomSelect = document.querySelector(`#p-block-${num} .p-room`);
        const searchVal = inputEl.value.trim().toLowerCase();
        if (!searchVal) { roomIdInput.value = generateRoomId(); return; }
        const found = existingPassengers.find(p => (type === 'name' && p.name.toLowerCase() === searchVal) || (type === 'id' && p.id && String(p.id).toLowerCase() === searchVal));
        if (found) { 
            if (currentRoomSelect.value !== found.roomType) {
                customAlert(`綁定失敗！親友 [${found.name}] 的房型為「${found.roomType || '未指定'}」，與目前所選房型不一致。請確認房型相同後再綁定。`, "warning");
                inputEl.value = ""; roomIdInput.value = generateRoomId(); return;
            }
            if(found.roomGroup) { roomIdInput.value = found.roomGroup; } 
            else { roomIdInput.value = `與NO.${found.no} ${found.name} (ID:${found.id||'--'}) 同房`; }
            customAlert(`已成功掛載 [${found.name}] 的同房狀態！`, "success");
        } else { customAlert(`找不到此條件的親友，請重新確認。`, "warning"); inputEl.value = ""; roomIdInput.value = generateRoomId(); }
    }

    function syncP1ToAll() {
        const p1PromoInput = document.querySelector('#p-block-1 .p-promo');
        const p1RoomSelect = document.querySelector('#p-block-1 .p-room');
        if(!p1PromoInput || !p1RoomSelect) return;
        const p1Promo = p1PromoInput.value; const p1Room = p1RoomSelect.value;
        for (let i = 2; i <= blockCounter; i++) {
            const block = document.getElementById(`p-block-${i}`);
            if(!block) continue;
            const companionPromo = block.querySelector('.p-promo'); if (companionPromo) companionPromo.value = p1Promo;
            const check = block.querySelector('.sync-check');
            if (check && check.checked) { const companionRoom = block.querySelector('.p-room'); if(companionRoom) companionRoom.value = p1Room; }
            autoCalcPrice(i);
        }
        autoCalcPrice(1); 
    }

    function autoCalcPrice(num) {
        const block = document.getElementById(`p-block-${num}`);
        if(!block) return;
        const promoCode = block.querySelector('.p-promo').value.trim(); 
        const groupCode = document.getElementById('global-groupCode').value.trim(); 
        const fullRoomType = block.querySelector('.p-room').value.trim(); 
        
        let roomCode = fullRoomType;
        if (fullRoomType) { const parts = fullRoomType.split('-'); if (parts.length >= 3) roomCode = parts[parts.length - 2].trim();
        else if (parts.length === 2) roomCode = parts[1].trim(); }

        let lookupKey = promoCode + "-" + groupCode + "-" + roomCode;
        let lastLookup = block.getAttribute('data-last-lookup');
        
        let childRemarkSelect = block.querySelector('.p-child-remark');
        let childRemark = childRemarkSelect ? childRemarkSelect.value : "";
        let isSingle = fullRoomType.includes("(單人)");
        let isDouble = fullRoomType.includes("(雙人)");

        const subASelect = block.querySelector('.h-subA');
        const subBSelect = block.querySelector('.h-subB');
        if (subASelect && subASelect.tagName === 'SELECT' && subBSelect && subBSelect.tagName === 'SELECT') {
            let curA = subASelect.value;
            let curB = subBSelect.value;
            let optA = ['0'];
            let optB = ['0'];
            if (fullRoomType.includes("G3")) {
                optA = ['0', '44000'];
                optB = ['0', '22000'];
            } else if (fullRoomType.includes("F4")) {
                optA = ['0'];
                optB = ['0', '44000'];
            }
            subASelect.innerHTML = optA.map(v => `<option value="${v}">${v==='0'?'0':fmtNum(v)}</option>`).join('');
            subBSelect.innerHTML = optB.map(v => `<option value="${v}">${v==='0'?'0':fmtNum(v)}</option>`).join('');
            subASelect.value = optA.includes(curA) ? curA : '0';
            subBSelect.value = optB.includes(curB) ? curB : '0';
        }

        if (childRemark === "7-12歲" && !isSingle && !isDouble && fullRoomType !== "") {
            customAlert("7-12歲孩童計價僅適用於「(雙人)」或「(單人)」房型！請重新確認房型。", "warning");
            if (childRemarkSelect) childRemarkSelect.value = "";
            childRemark = "";
            block.setAttribute('data-last-lookup', '');
        }
        
        if(lookupKey !== lastLookup) { 
            let pd = priceDict[lookupKey];
            if(pd) { 
                let baseSf = pNum(pd.sfPrice);
                if (childRemark === "2-6歲") {
                    baseSf = 0;
                } else if (childRemark === "7-12歲") {
                    if (isDouble) baseSf = Math.round(baseSf * 0.2);
                    else if (isSingle) baseSf = Math.round(baseSf * 0.1);
                }
                block.querySelector('.calc-sf').value = fmtNum(baseSf);
                
                if (!window.voyageDefaults || !window.voyageDefaults[groupCode]) {
                    block.querySelector('.h-portFee').value = fmtNum(pd.portTax);
                }
            } else { 
                block.querySelector('.calc-sf').value = "0";
            } 
            block.setAttribute('data-last-lookup', lookupKey);
        } else {
            let pd = priceDict[lookupKey];
            if (pd) {
                let baseSf = pNum(pd.sfPrice);
                if (childRemark === "2-6歲") { baseSf = 0; } 
                else if (childRemark === "7-12歲") {
                    if (isDouble) baseSf = Math.round(baseSf * 0.2);
                    else if (isSingle) baseSf = Math.round(baseSf * 0.1);
                }
                block.querySelector('.calc-sf').value = fmtNum(baseSf);
            }
        }

        let sf = pNum(block.querySelector('.calc-sf').value); 
        let jgd = pNum(block.querySelector('.h-jgd').value);
        let agtd = pNum(block.querySelector('.h-agtd').value);
        let subA = pNum(block.querySelector('.h-subA').value); 
        let subB = pNum(block.querySelector('.h-subB').value);
        let toilet = pNum(block.querySelector('.h-toilet').value);
        let intlTax = pNum(block.querySelector('.h-intlTax').value); 
        let visa = pNum(block.querySelector('.h-alaskaTax').value);
        let accRoom = pNum(block.querySelector('.h-accRoom').value);
        let upgRoom = pNum(block.querySelector('.h-upgRoom').value); 
        let portFee = pNum(block.querySelector('.h-portFee').value);
        let tips = pNum(block.querySelector('.h-tips').value);
        let otherFee = pNum(block.querySelector('.h-otherFee').value);
        let posterDiscount = pNum(block.querySelector('.h-poster').value);
        
        const isInside = fullRoomType.includes("內艙");
        const isSS = /SS/i.test(groupCode);
        let commRate = isSS ? 0.15 : (isInside ? 0.18 : 0.15);
        if (childRemark === "2-6歲") commRate = 0; 

        // 移除多餘的強制 15% 轉換，直接輸出小數值 (0.15 / 0.18)
        block.querySelector('.calc-comm-rate').value = commRate;
        
        let baseTotal = sf - jgd - agtd + subA + subB + toilet + intlTax + visa + accRoom + upgRoom + portFee + tips + otherFee - posterDiscount;
        let commBase = sf - jgd - agtd; 
        block.querySelector('.calc-total').value = fmtNum(baseTotal);
        let commission = Math.round(commBase * commRate);
        block.querySelector('.calc-comm').value = fmtNum(commission);
        let setPay = baseTotal - commission;
        
        block.querySelector('.calc-set').value = fmtNum(setPay);
    }

    function addPassenger() {
        const p1PromoInput = document.querySelector('#p-block-1 .p-promo');
        let inheritedPromo = ""; let inheritedRoom = "";
        if (passengerCount >= 1) { inheritedPromo = p1PromoInput ? p1PromoInput.value.trim() : getCurrentYYYYMM();
        inheritedRoom = document.querySelector('#p-block-1 .p-room').value; }
        if (passengerCount >= 4) { customAlert("一筆訂單最多只能包含 4 位旅客！", "warning"); return; }
        
        passengerCount++; blockCounter++;
        const num = blockCounter; const isMain = (passengerCount === 1);
        const defaultRoomId = isMain ? generateRoomId() : document.querySelector('.p-room-id')?.value || generateRoomId();
        const wrapper = document.getElementById('passengers-wrapper'); const block = document.createElement('div'); block.className = 'passenger-block'; block.id = `p-block-${num}`;
        block.innerHTML = `
            <div class="passenger-header">
                <h3 class="p-title">旅客 ${passengerCount} ${isMain ? '(主聯絡人)' : '(同行者)'}</h3>
                <div style="display:flex; gap:15px; align-items:center;">
                    <label style="display:flex; align-items:center; gap:6px; cursor:pointer; margin:0;"><input type="checkbox" class="p-waitlist" style="width:15px; height:15px; margin:0; accent-color:var(--waitlist);"> 設為候補</label>
                    ${!isMain ? `<button type="button" class="btn-remove" onclick="removePassenger(${num})" style="margin:0; height:auto;">[ 移除 ]</button>` : ''}
                </div>
            </div>
            <div class="room-sync-box">
                <div class="input-group" style="flex:none;"><label>系統房號配置</label><input type="text" class="p-room-id" value="${defaultRoomId}" readonly style="width:140px; height:42px;"></div>
                ${!isMain ? `<div style="height:42px; display:flex; align-items:center; flex:none;"><label style="margin:0; display:flex; align-items:center; gap:5px; cursor:pointer;"><input type="checkbox" class="sync-check" checked onchange="toggleRoomSync(${num})"> 與第一位同房</label></div>` : ''}
                <div class="input-group" style="flex:none; width: 300px;">
                    <label>與既有親友同房 (選姓名或ID)</label>
                    <div style="display:flex; gap:10px;">
                        <div class="input-wrapper" style="width:140px;"><input type="text" class="join-existing-name" id="join-existing-name-${num}" list="existing-list-name" placeholder="選姓名..." onchange="joinExistingRoom(this, ${num}, 'name')" style="height:42px; padding-right:20px;"><span class="clear-btn" onclick="clearInput('join-existing-name-${num}')" style="top:50%; transform:translateY(-50%); font-size:14px;">&times;</span></div>
                        <div class="input-wrapper" style="width:140px;"><input type="text" class="join-existing-id" id="join-existing-id-${num}" list="existing-list-id" placeholder="選ID..." onchange="joinExistingRoom(this, ${num}, 'id')" style="height:42px; padding-right:20px;"><span class="clear-btn" onclick="clearInput('join-existing-id-${num}')" style="top:50%; transform:translateY(-50%); font-size:14px;">&times;</span></div>
                    </div>
                </div>
            </div>
            <div class="grid-5">
                <div class="input-group"><label>東南訂編</label><input type="text" class="p-order-id" required></div>
                <div class="input-group"><label>業務</label><input type="text" class="p-sales" required placeholder="例：門市-業務名稱"></div>
                <div class="input-group"><label>中文姓名</label><input type="text" class="p-name" required></div>
                <div class="input-group"><label>NAME (護照英文)</label><input type="text" class="p-ename" style="text-transform:uppercase" required></div>
                <div class="input-group"><label>性別</label><select class="p-gender"><option value="F">女 (F)</option><option value="M">男 (M)</option></select></div>
            </div>
            <div class="grid-5">
                <div class="input-group"><label>生日</label><input type="text" class="p-birth" placeholder="YYYY/MM/DD" maxlength="10" oninput="formatDateInput(this)" onblur="validateDateBlur(this)" required></div>
                <div class="input-group"><label>報名來源</label><input type="text" class="p-source" value="" placeholder="例：1/11 台北"></div>
                <div class="input-group"><label>老客</label><input type="text" class="p-old-customer" placeholder="例：118/否"></div>
                <div class="input-group"><label>登船港</label><input type="text" class="p-board-port" value="Yokohama"></div>
                <div class="input-group"><label>離船港</label><input type="text" class="p-off-port" value="Keelung"></div>
            </div>
            <div class="grid-5">
                <div class="input-group"><label>當月優惠價</label><input type="text" class="p-promo" value="${isMain ? getCurrentYYYYMM() : inheritedPromo}" oninput="${isMain ? 'syncP1ToAll()' : 'autoCalcPrice('+num+')'}" onchange="${isMain ? 'syncP1ToAll()' : 'autoCalcPrice('+num+')'}"></div>
                <div class="input-group"><label>各種優惠價/特典</label><input type="text" class="p-promo-extras" placeholder="例：1月繳清價-JGD 1萬(1萬)"></div>
                <div class="input-group"><label>預存金</label><input type="text" class="p-coupon-dep"></div>
                <div class="input-group"><label>優惠券</label><input type="text" class="p-coupon-vou"></div>
                <div class="input-group"><label>房型</label><select class="p-room" onchange="${isMain ? 'syncP1ToAll()' : 'autoCalcPrice('+num+')'}" ${!isMain ? 'disabled' : ''}>${roomOptionsHTML}</select></div>
            </div>
            
            <div class="toggle-btn" onclick="toggleAdvanced(${num})">[+] 展開/隱藏 其他區段與特殊需求</div>
            <div class="advanced-fields" id="advanced-${num}">
                <div class="grid-4">
                    <div class="input-group"><label>備註或需求</label><input type="text" class="p-special-req"></div>
                    <div class="input-group"><label>預購 (5萬)</label><input type="text" class="p-deposit" value="0" onfocus="unformatNum(this)" onblur="formatNumInput(this)"></div>
                    <div class="input-group"><label>孩童備註</label><select class="p-child-remark" onchange="document.getElementById('p-block-${num}').setAttribute('data-last-lookup', ''); autoCalcPrice(${num})">
                        <option value="">無</option><option value="2-6歲">2-6歲</option><option value="7-12歲">7-12歲</option>
                    </select></div>
                    <div class="input-group"><label>區段</label><select class="p-segment">
                        <option value="">--請選擇--</option><option value="全程">全程</option><option value="區段">區段</option>
                    </select></div>
                    <input type="hidden" class="p-other-remark" value="">
                </div>
            </div>

            <div class="cost-calc-area">
                <div class="section-title" style="margin-top:0; margin-bottom:20px; border-left-color:var(--accent); color:var(--primary); font-size:12px;">▍ 費用即時計算區</div>
                <div class="grid-5" style="margin-bottom: 15px;">
                    <div class="input-group"><label>SF船費</label><input type="text" class="calc-sf" readonly></div>
                    <div class="input-group"><label>港務費 </label><input type="text" class="h-portFee" value="0" oninput="autoCalcPrice(${num})" onfocus="unformatNum(this)" onblur="formatNumInput(this); autoCalcPrice(${num})"></div>
                    <div class="input-group"><label>小費 </label><input type="text" class="h-tips" value="0" oninput="autoCalcPrice(${num})" onfocus="unformatNum(this)" onblur="formatNumInput(this); autoCalcPrice(${num})"></div>
                    <div class="input-group"><label style="color:var(--danger);">JG D (填正數) </label><input type="text" class="h-jgd" value="0" oninput="autoCalcPrice(${num})" onfocus="unformatNum(this)" onblur="formatNumInput(this); autoCalcPrice(${num})"></div>
                    <div class="input-group"><label style="color:var(--danger);">AGT D (填正數) </label><input type="text" class="h-agtd" value="0" oninput="autoCalcPrice(${num})" onfocus="unformatNum(this)" onblur="formatNumInput(this); autoCalcPrice(${num})"></div>
                </div>
                <div class="grid-5" style="margin-bottom: 15px;">
                    <div class="input-group"><label>下鋪A</label><select class="h-subA" onchange="autoCalcPrice(${num})"><option value="0">0</option></select></div>
                    <div class="input-group"><label>下鋪B</label><select class="h-subB" onchange="autoCalcPrice(${num})"><option value="0">0</option></select></div>
                    <div class="input-group"><label>免治馬桶</label><input type="text" class="h-toilet" value="0" oninput="autoCalcPrice(${num})" onfocus="unformatNum(this)" onblur="formatNumInput(this); autoCalcPrice(${num})"></div>
                    <div class="input-group"><label>國際旅客稅</label><input type="text" class="h-intlTax" value="0" oninput="autoCalcPrice(${num})" onfocus="unformatNum(this)" onblur="formatNumInput(this); autoCalcPrice(${num})"></div>
                    <div class="input-group"><label>阿拉斯加稅</label><input type="text" class="h-alaskaTax" value="0" oninput="autoCalcPrice(${num})" onfocus="unformatNum(this)" onblur="formatNumInput(this); autoCalcPrice(${num})"></div>
                </div>
                <div class="grid-5" style="margin-bottom: 25px;">
                    <div class="input-group"><label>無障礙房型</label><input type="text" class="h-accRoom" value="0" oninput="autoCalcPrice(${num})" onfocus="unformatNum(this)" onblur="formatNumInput(this); autoCalcPrice(${num})"></div>
                    <div class="input-group"><label>房型升等</label><input type="text" class="h-upgRoom" value="0" oninput="autoCalcPrice(${num})" onfocus="unformatNum(this)" onblur="formatNumInput(this); autoCalcPrice(${num})"></div>
                    <div class="input-group"><label>其他追加費用</label><input type="text" class="h-otherFee" value="0" oninput="autoCalcPrice(${num})" onfocus="unformatNum(this)" onblur="formatNumInput(this); autoCalcPrice(${num})"></div>
                    <div class="input-group"><label style="color:var(--danger);">海報志工優惠折扣金 (填正數)</label><input type="text" class="h-poster" value="0" oninput="autoCalcPrice(${num})" onfocus="unformatNum(this)" onblur="formatNumInput(this); autoCalcPrice(${num})"></div>
                </div>
                <div class="cost-calc-grid grid-4">
                    <div class="input-group"><label>基本旅費總價</label><input type="text" class="calc-total" readonly style="font-weight:700; color:var(--white);"></div>
                    <div class="input-group"><label>佣金%</label><input type="text" class="calc-comm-rate" readonly></div>
                    <div class="input-group"><label>佣金</label><input type="text" class="calc-comm" readonly style="font-weight:600;"></div>
                    <div class="input-group"><label style="color:var(--gold);">SET應付</label><input type="text" class="calc-set" readonly></div>
                </div>
            </div>
        `;
        wrapper.appendChild(block);
        
        block.querySelector('.p-room').value = ""; 
        if (!isMain && inheritedRoom) block.querySelector('.p-room').value = inheritedRoom;
        
        applyVoyageDefaults(num);
        autoCalcPrice(num);
    }

    function toggleRoomSync(num) {
        const check = document.querySelector(`#p-block-${num} .sync-check`); const roomIdInput = document.querySelector(`#p-block-${num} .p-room-id`); const roomSelect = document.querySelector(`#p-block-${num} .p-room`);
        if (check.checked) { roomIdInput.value = document.querySelector('#p-block-1 .p-room-id').value; roomSelect.value = document.querySelector('#p-block-1 .p-room').value;
        roomSelect.disabled = true; autoCalcPrice(num); } else { roomIdInput.value = generateRoomId(); roomSelect.disabled = false; }
    }
    function toggleAdvanced(num) { const el = document.getElementById(`advanced-${num}`); el.style.display = (el.style.display === 'block') ? 'none' : 'block'; }
    function removePassenger(num) { document.getElementById(`p-block-${num}`).remove(); passengerCount--;
        const titles = document.querySelectorAll('.p-title'); titles.forEach((title, index) => { title.innerText = `旅客 ${index + 1} ${index === 0 ? '(主聯絡人)' : '(同行者)'}`; });
    }

    function promptForSegmentOptions(callback) {
        document.getElementById('input-modal-title').innerText = "請填寫區段";
        document.getElementById('input-modal-msg').innerHTML = "注意：部分旅客登船港或離船港與預設不同，請選擇區段屬性：";
        let inputGrp = document.querySelector('#input-modal .input-group');
        let oldContent = inputGrp.innerHTML;
        inputGrp.innerHTML = `<select id="input-modal-select" style="width:100%; height:42px; border:1px solid var(--border); border-radius:6px; padding:0 15px;"><option value="全程">全程</option><option value="區段">區段</option></select>`;
        
        window._inputModalResolve = (isConfirm) => {
            let val = isConfirm ? document.getElementById('input-modal-select').value : null;
            inputGrp.innerHTML = oldContent; 
            if(isConfirm && val) {
                const groupCode = document.getElementById('global-groupCode').value;
                let defs = window.voyageDefaults[groupCode] || {};
                let defBoard = (defs.boardPort !== undefined && defs.boardPort !== "") ? defs.boardPort : "Yokohama";
                let defOff = (defs.offPort !== undefined && defs.offPort !== "") ? defs.offPort : "Keelung";
                
                document.querySelectorAll('.passenger-block').forEach(b => {
                    let bp = b.querySelector('.p-board-port').value.trim();
                    let op = b.querySelector('.p-off-port').value.trim();
                    let seg = b.querySelector('.p-segment');
                    if ((bp !== defBoard || op !== defOff) && seg.value === "") {
                        seg.value = val;
                    }
                });
                callback();
            }
        };
        document.getElementById('input-modal').classList.add('show');
    }

    function submitOrder() {
        let hasInvalidDate = false;
        document.querySelectorAll('.passenger-block').forEach(b => {
            let birthVal = b.querySelector('.p-birth').value.trim();
            if (birthVal && !isValidDate(birthVal)) {
                hasInvalidDate = true;
            }
        });

        if (hasInvalidDate) {
            customAlert("生日日期格式不正確，請確認輸入為有效的 YYYY/MM/DD！", "warning");
            return;
        }

        const groupCode = document.getElementById('global-groupCode').value;
        const operatorAccount = document.getElementById('current-username').innerText; 
        const finalData = [];
        let hasPortMismatch = false;
        let needsSegmentPrompt = false;

        let defs = window.voyageDefaults[groupCode] || {};
        let defBoard = (defs.boardPort !== undefined && defs.boardPort !== "") ? defs.boardPort : "Yokohama";
        let defOff = (defs.offPort !== undefined && defs.offPort !== "") ? defs.offPort : "Keelung";

        document.querySelectorAll('.passenger-block').forEach(b => {
            let bp = b.querySelector('.p-board-port').value.trim();
            let op = b.querySelector('.p-off-port').value.trim();
            let segInput = b.querySelector('.p-segment');
            
            if (bp !== defBoard || op !== defOff) {
                hasPortMismatch = true;
                if(segInput.value === "") needsSegmentPrompt = true;
            }
        });

        const executeSubmit = () => {
            const compiledData = [];
            document.querySelectorAll('.passenger-block').forEach(b => {
                compiledData.push({
                    groupCode: groupCode, operatorSales: b.querySelector('.p-sales').value, status: b.querySelector('.p-waitlist').checked ? "候補" : "正常", roomGroup: b.querySelector('.p-room-id').value, orderId: b.querySelector('.p-order-id').value,
                    name: b.querySelector('.p-name').value, ename: b.querySelector('.p-ename').value.toUpperCase(), gender: b.querySelector('.p-gender').value, birth: b.querySelector('.p-birth').value,
                    source: b.querySelector('.p-source').value, oldCustomer: b.querySelector('.p-old-customer').value, deposit: pNum(b.querySelector('.p-deposit').value), segment: b.querySelector('.p-segment').value,
                    roomType: b.querySelector('.p-room').value, promotion: b.querySelector('.p-promo').value, boardPort: b.querySelector('.p-board-port').value, offPort: b.querySelector('.p-off-port').value,
                    specialReq: b.querySelector('.p-special-req').value, childRemark: b.querySelector('.p-child-remark').value, otherRemark: b.querySelector('.p-other-remark').value, promoExtras: b.querySelector('.p-promo-extras').value, couponDeposit: b.querySelector('.p-coupon-dep').value, couponVoucher: b.querySelector('.p-coupon-vou').value,
                    portFee: pNum(b.querySelector('.h-portFee').value), tips: pNum(b.querySelector('.h-tips').value), jgd: pNum(b.querySelector('.h-jgd').value), agtD: pNum(b.querySelector('.h-agtd').value),
                    subA: pNum(b.querySelector('.h-subA').value), subB: pNum(b.querySelector('.h-subB').value), toilet: pNum(b.querySelector('.h-toilet').value), intlTax: pNum(b.querySelector('.h-intlTax').value), visa: pNum(b.querySelector('.h-alaskaTax').value), accRoom: pNum(b.querySelector('.h-accRoom').value), upgRoom: pNum(b.querySelector('.h-upgRoom').value),
                    otherFee: pNum(b.querySelector('.h-otherFee').value), posterDiscount: pNum(b.querySelector('.h-poster').value),
                    sf: pNum(b.querySelector('.calc-sf').value), totalDirect: pNum(b.querySelector('.calc-total').value), commRateStr: b.querySelector('.calc-comm-rate').value, commission: pNum(b.querySelector('.calc-comm').value), setPay: pNum(b.querySelector('.calc-set').value)
                });
            });

            if(compiledData.length === 0) { customAlert("沒有可送出的旅客資料！", "warning"); return; }
            
            showLoading();
            gasPost('addOrder', { data: compiledData, operatorAccount: operatorAccount })
            .then(res => res.json())
            .then(res => {
                hideLoading(); 
                if(res.status === 'success'){ 
                    isLogsDirty = true; 

                    // 補送詳細的新增紀錄（不等待此請求完成，避免拖慢/延遲畫面反應）
                    let detailsText = compiledData.map(p => {
                        return `[新增完整明細] 姓名: ${p.name} (ID: ${p.id||'--'})\n` +
                               `  • 房型: ${p.roomType || '(空)'}\n` +
                               `  • 登船/離船: ${p.boardPort || '(空)'} / ${p.offPort || '(空)'}\n` +
                               `  • 當月優惠價: ${p.promotion || '(空)'}\n` +
                               `  • 優惠特典: ${p.promoExtras || '(空)'}\n` +
                               `  • SF船費: ${fmtNum(p.sf)}\n` +
                               `  • 港務費: ${fmtNum(p.portFee)}\n` +
                               `  • 小費: ${fmtNum(p.tips)}\n` +
                               `  • 基本旅費總價: ${fmtNum(p.totalDirect)}\n` +
                               `  • 佣金%: ${p.commRateStr}\n` +
                               `  • 佣金: ${fmtNum(p.commission)}\n` +
                               `  • SET應付: ${fmtNum(p.setPay)}`;
                    }).join('\n\n');
                    gasPost('addCustomLog', { operator: operatorAccount, target: '航程 ' + groupCode, actionName: '建立新訂單', details: detailsText });

                    customAlert("已新增訂單", "success");
                    document.getElementById('orderForm').reset();
                    document.getElementById('passengers-wrapper').innerHTML = ''; 
                    document.getElementById('global-groupCode').value = ''; 
                    document.getElementById('step-2-container').style.opacity = '0'; 
                    setTimeout(() => document.getElementById('step-2-container').style.display = 'none', 400); 
                    passengerCount = 0; blockCounter = 0; window.scrollTo({ top: 0, behavior: 'smooth' }); 
                    
                    const t = new Date().getTime(); 
                    fetch(gasURL + "?action=getGroupList&t=" + t).then(r => r.json()).then(r => { 
                        if(r.status === 'success') { 
                            const datalist = document.getElementById('groupOptions'); 
                            datalist.innerHTML = ""; 
                            r.data.forEach(group => { 
                                const opt = document.createElement('option'); opt.value = group; datalist.appendChild(opt); 
                            }); 
                        } 
                    }); 
                } else { 
                    customAlert("寫入失敗：" + res.message, "error"); 
                }
            }).catch(err => { hideLoading(); customAlert("網路連線異常，請稍後再試", "error"); });
        };

        if (hasPortMismatch) {
            customConfirm(`注意：有旅客的「登船港」或「離船港」與此航程的預設值 (${defBoard} / ${defOff}) 不同！\n\n確定要繼續送出訂單嗎？\n(Dangerous Action)`, () => {
                if (needsSegmentPrompt) {
                    promptForSegmentOptions(executeSubmit);
                } else {
                    executeSubmit();
                }
            }, true);
        } else {
            executeSubmit();
        }
    }

    function searchList() {
        const groupCode = document.getElementById('search-groupCode').value;
        if(!groupCode) { customAlert("請先輸入或選擇欲搜尋的航程代碼", "warning"); return; } showLoading();
        const t = new Date().getTime();
        fetch(gasURL + "?action=searchOrders&groupCode=" + encodeURIComponent(groupCode) + "&t=" + t).then(res => res.json()).then(res => { hideLoading(); if(res.status === 'success') { window.currentGroupData = res.data; window.currentGroupHeaders = res.headers; renderList(); } }).catch(err => { hideLoading(); customAlert("網路連線異常，請稍後再試", "error"); });
    }

    function sortByNoOnly() {
        forceNoSort = true; activeColSort = null; renderList();
    }

    function openColumnFilter(e, colName) {
        e.stopPropagation(); currentFilterCol = colName;
        document.getElementById('filter-col-title').innerText = colName;
        
        let searchInput = document.getElementById('col-filter-search');
        if(searchInput) searchInput.value = '';
        
        let uniqueVals = new Set();
        window.currentGroupData.forEach(item => { let val = String(getFilterVal(item, colName) || "").trim(); uniqueVals.add(val); });
        let listDiv = document.getElementById('col-filter-list'); listDiv.innerHTML = "";
        let allChecked = true;
        Array.from(uniqueVals).sort((a,b) => a.localeCompare(b, 'zh-TW', {numeric:true})).forEach(val => {
            let isChecked = true;
            if (activeColFilters[colName] && !activeColFilters[colName].has(val)) { isChecked = false; allChecked = false; }
            let lbl = document.createElement('label');
            lbl.style.display = "flex"; lbl.style.alignItems = "center"; lbl.style.gap = "6px"; lbl.style.cursor = "pointer"; lbl.style.marginBottom = "4px";
            lbl.innerHTML = `<input type="checkbox" class="col-filter-cb" value="${val}" ${isChecked ? 'checked' : ''}> <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${val === "" ? "(空白/未填寫)" : val}</span>`;
            listDiv.appendChild(lbl);
        });
        document.getElementById('filter-select-all').checked = allChecked;
        let popup = document.getElementById('col-filter-popup'); popup.style.display = 'block';
        let rect = e.target.getBoundingClientRect(); popup.style.left = rect.left + 'px';
        popup.style.top = (rect.bottom + window.scrollY + 8) + 'px';
        document.getElementById('col-filter-overlay').style.display = 'block';
    }

    function filterColumnCheckboxes(kw) {
        kw = kw.toLowerCase().trim();
        let listDiv = document.getElementById('col-filter-list');
        let labels = listDiv.querySelectorAll('label');
        labels.forEach(lbl => {
            let cb = lbl.querySelector('.col-filter-cb');
            if(!cb) return;
            let valStr = String(cb.value).toLowerCase();
            let displayTxt = (cb.value === "") ? "(空白/未填寫)" : valStr;
            if (displayTxt.includes(kw)) { lbl.style.display = "flex"; } else { lbl.style.display = "none"; }
        });
    }

    function toggleAllFilters(chk) { 
        document.querySelectorAll('.col-filter-cb').forEach(cb => {
            let lbl = cb.closest('label');
            if (lbl && lbl.style.display !== 'none') { cb.checked = chk.checked; }
        }); 
    }
    
    function closeColumnFilter() { document.getElementById('col-filter-popup').style.display = 'none'; document.getElementById('col-filter-overlay').style.display = 'none'; }
    function applySort(dir) { activeColSort = { col: currentFilterCol, dir: dir }; closeColumnFilter(); renderList(); }
    function applyColFilter() {
        let selected = [];
        document.querySelectorAll('.col-filter-cb:checked').forEach(cb => selected.push(cb.value));
        let allCount = document.querySelectorAll('.col-filter-cb').length;
        if (selected.length === allCount) { delete activeColFilters[currentFilterCol];
        } else { activeColFilters[currentFilterCol] = new Set(selected); }
        closeColumnFilter(); renderList();
    }
    function clearColFilter() { delete activeColFilters[currentFilterCol]; closeColumnFilter(); renderList(); }
    
    function resetTableFilters() { 
        activeColFilters = {}; activeColSort = null; forceNoSort = false;
        document.getElementById('status-filter').value = "全部";
        document.getElementById('search-name').value = "";
        renderList(); 
    }

    function getVal(item, colName) { 
        let idx = window.currentGroupHeaders.indexOf(colName);
        if (idx === -1 && colName === "備註或需求") idx = window.currentGroupHeaders.indexOf("特殊需求");
        if (idx === -1 && colName === "特殊需求") idx = window.currentGroupHeaders.indexOf("備註或需求");
        return idx > -1 ? (item.raw[idx] !== undefined ? item.raw[idx] : "") : ""; 
    }

    function getFilterVal(item, col) {
        if(col === "NO") return String(item.no || "");
        if(col === "旅客姓名") return item.name || "";
        if(col === "NAME") return item.ename || "";
        if(col === "ID") return item.id || "";
        if(col === "房型") return item.roomType || "";
        if(col === "備註或需求" || col === "特殊需求") return getVal(item, "備註或需求") || "";
        return getVal(item, col);
    }

    function calcGridRow(no) {
        let tr = document.getElementById('row-' + no);
        if(!tr) return;
        let sf = pNum(tr.querySelector('.adv-input[data-col="SF船費"]')?.value); 
        let jgd = pNum(tr.querySelector('.adv-input[data-col="JGD"]')?.value); 
        let agtd = pNum(tr.querySelector('.adv-input[data-col="AGTD"]')?.value);
        let subA = pNum(tr.querySelector('.adv-input[data-col="下鋪指定A"]')?.value); 
        let subB = pNum(tr.querySelector('.adv-input[data-col="下鋪指定B"]')?.value); 
        let toilet = pNum(tr.querySelector('.adv-input[data-col="免治馬桶"]')?.value);
        let intlTax = pNum(tr.querySelector('.adv-input[data-col="國際旅客稅"]')?.value); 
        let visa = pNum(tr.querySelector('.adv-input[data-col="阿拉斯加稅"]')?.value); 
        let accRoom = pNum(tr.querySelector('.adv-input[data-col="無障礙房型"]')?.value);
        let upgRoom = pNum(tr.querySelector('.adv-input[data-col="房型升等"]')?.value); 
        let portFee = pNum(tr.querySelector('.adv-input[data-col="港務費"]')?.value); 
        let tips = pNum(tr.querySelector('.adv-input[data-col="小費"]')?.value);
        let otherFee = pNum(tr.querySelector('.adv-input[data-col="其他追加費用"]')?.value);
        let posterDiscount = pNum(tr.querySelector('.adv-input[data-col="海報志工優惠折扣金"]')?.value);
        let nameChangeAmt = pNum(tr.querySelector('.edit-nameChange')?.value);
        let room = tr.querySelector('.edit-room').value || "";
        let groupCode = document.getElementById('search-groupCode').value.trim();
        let isInside = room.includes("內艙");
        let isSS = /SS/i.test(groupCode);
        
        let origData = window.currentGroupData.find(d => String(d.no) === no);
        let childRemark = origData ? getVal(origData, "孩童備註") : "";

        let commRate = isSS ? 0.15 : (isInside ? 0.18 : 0.15); 
        if (childRemark === "2-6歲") commRate = 0; 

        tr.querySelector('.edit-crate').value = commRate;
        let baseTotal = sf - jgd - agtd + subA + subB + toilet + intlTax + visa + accRoom + upgRoom + portFee + tips + otherFee - posterDiscount;
        let commBase = sf - jgd - agtd; 
        tr.querySelector('.edit-tot').value = fmtNum(baseTotal); 
        let comm = Math.round(commBase * commRate); 
        tr.querySelector('.edit-comm').value = fmtNum(comm);
        tr.querySelector('.edit-set').value = fmtNum(baseTotal - comm + nameChangeAmt);
    }

    function fetchDictForGridRow(no) {
        let tr = document.getElementById('row-' + no);
        if(!tr) return;
        let promo = tr.querySelector('.edit-promo').value.trim(); let roomFull = tr.querySelector('.edit-room').value.trim(); let groupCode = document.getElementById('search-groupCode').value.trim(); 
        let roomCode = roomFull;
        let parts = roomFull.split('-'); if(parts.length >= 3) roomCode = parts[parts.length-2].trim(); else if(parts.length === 2) roomCode = parts[1].trim();
        let lookupKey = promo + "-" + groupCode + "-" + roomCode; let pd = priceDict[lookupKey];
        
        let origData = window.currentGroupData.find(d => String(d.no) === no);
        let childVal = origData ? getVal(origData, "孩童備註") : "";
        let isSingle = roomFull.includes("(單人)");
        let isDouble = roomFull.includes("(雙人)");

        if (childVal === "7-12歲" && !isSingle && !isDouble && roomFull !== "") {
            customAlert(`NO.${no} 的房型非(單人)/(雙人)，無法套用7-12歲計價規則！`, "warning");
        }

        if(pd) { 
            let baseSf = pNum(pd.sfPrice);
            
            if (childVal === "2-6歲") { baseSf = 0; }
            else if (childVal === "7-12歲") {
                if (isDouble) baseSf = Math.round(baseSf * 0.2);
                else if (isSingle) baseSf = Math.round(baseSf * 0.1);
            }

            let sfNode = tr.querySelector('.adv-input[data-col="SF船費"]');
            if(sfNode) sfNode.value = fmtNum(baseSf); 

            let voyageDefs = window.voyageDefaults[groupCode];
            let taxNode = tr.querySelector('.adv-input[data-col="港務費"]'); 
            if(taxNode) {
                if (voyageDefs && voyageDefs.portFee !== undefined && voyageDefs.portFee !== "") {
                    taxNode.value = fmtNum(voyageDefs.portFee);
                } else {
                    taxNode.value = fmtNum(pd.portTax);
                }
            }
        } 
        calcGridRow(no);
    }

    function getCleanGroup(groupStr) {
        if (!groupStr) return "";
        let firstTag = String(groupStr).split(',')[0].trim();
        return firstTag.replace(/\(L\)$/, '');
    }
    
    async function promptBatchUpdate(colName) {
        if (colName !== '港務費' && colName !== '小費') return;
        let val = await customPrompt(`批次修改 ${colName}`, `請輸入${colName}數值<br>(註：<span style="color:var(--danger)">自動排除「區段」的旅客</span>)：`);
        if (val === null || val === '') return;
        let numVal = pNum(val);
        document.querySelectorAll('#list-body tr[id^="row-"]').forEach(tr => {
            let seg = tr.querySelector('.edit-segment')?.value;
            if (seg !== '區段') {
                let input = tr.querySelector(`.adv-input[data-col="${colName}"]`);
                if (input) {
                    input.value = fmtNum(numVal);
                    calcGridRow(tr.id.replace('row-', ''));
                }
            }
        });
        customAlert(`已套用「${colName}」！\n需點擊右上角【修改儲存】更新。`, 'success');
    }

    function renderList() {
        const listBody = document.getElementById('list-body');
        const filterStatus = document.getElementById('status-filter').value; const filterName = document.getElementById('search-name').value.trim().toLowerCase();
        const currentGroupCode = document.getElementById('search-groupCode').value || "未知";
        let advCols = ["港務費", "小費", "SF船費", "JGD", "AGTD", "下鋪指定A", "下鋪指定B", "免治馬桶", "國際旅客稅", "阿拉斯加稅", "無障礙房型", "房型升等", "其他追加費用", "海報志工優惠折扣金"];
        
        let targetCols = ["NO","備註或需求","旅客姓名","NAME","Status","ID","生日","報名來源","老客","區段","當月優惠價","各種優惠價/船內特典","Coupon船內預存金","Coupon船內優惠券","房型","登船港","離船港","基本旅費總價","佣金%","佣金","名義變更金額","SET應付","業務","訂編"];
        
        let customFilterCols = ["當月優惠價", "各種優惠價/船內特典", "報名來源", "旅客姓名", "NAME", "ID", "備註或需求", "房型", "業務", "區段"];
        
        let activeClsNo = activeColFilters['NO'] ? 'active' : '';
        let headHtml = `<tr>
            <th class="sticky-1" style="z-index: 40;">NO. <span class="filter-icon ${activeClsNo}" onclick="openColumnFilter(event, 'NO')">▼</span></th>
            <th style="width:240px;">備註或需求 <span class="filter-icon" onclick="openColumnFilter(event, '備註或需求')">▼</span></th>
            <th class="sticky-2">旅客姓名 <span class="filter-icon" onclick="openColumnFilter(event, '旅客姓名')">▼</span></th>
            <th class="sticky-3">NAME <span class="filter-icon" onclick="openColumnFilter(event, 'NAME')">▼</span></th>`;
        targetCols.forEach(c => { 
            if(!["NO","備註或需求","旅客姓名","NAME","Status"].includes(c)) {
                let w = "75px";
                if(c === "房型") w = "270px";
                if(c === "登船港" || c === "離船港" || c === "ID" || c === "訂編" || c === "業務") w = "105px";
                if(c === "生日") w = "110px"; 
                if(c === "報名來源") w = "150px";
                if(c === "各種優惠價/船內特典") w = "200px";
                if(c === "基本旅費總價" || c === "SET應付" || c === "名義變更金額") w = "95px";
                if(c === "佣金" || c === "區段") w = "80px";
                
                let displayC = c;
                if (customFilterCols.includes(c)) {
                    let activeCls = activeColFilters[c] ? 'active' : '';
                    displayC = `${c} <span class="filter-icon ${activeCls}" onclick="openColumnFilter(event, '${c}')">▼</span>`;
                }
                headHtml += `<th style="width:${w};">${displayC}</th>`;
            }
        });
        
        advCols.forEach(c => { 
            let advWidth = "90px";
            if (c === "SF船費" || c === "JGD") { advWidth = "120px"; }
            let clickAttr = (c === '港務費' || c === '小費') ? 'cursor:pointer;' : '';
            let clickFunc = (c === '港務費' || c === '小費') ? `onclick="promptBatchUpdate('${c}')" title="點擊進行批次修改"` : '';
            headHtml += `<th class="adv-col" style="width:${advWidth}; color:#EAD6A3; font-weight:500; letter-spacing:0.05em; border-bottom: 2px solid #C4A767; ${clickAttr}" ${clickFunc}>${c} ${(c === '港務費' || c === '小費') ? '✎' : ''}</th>`;
        });

        headHtml += `<th style="width:160px;">取消理由</th>`;
        headHtml += `<th style="width:95px;">取消結果</th>`;
        headHtml += `<th style="width:150px;">取消備註</th>`; 

        headHtml += '<th style="width:75px; border-left:1px solid rgba(255,255,255,0.1); text-align:center;">同房管理</th>';
        headHtml += '<th style="width:105px; text-align:center;">操作 <button class="btn-batch" onclick="batchUpdateRows()" style="margin-top:4px;">修改儲存</button></th></tr>';
        document.getElementById('list-head').innerHTML = headHtml;
        listBody.innerHTML = "";

        if(!window.currentGroupData || window.currentGroupData.length === 0) { 
            listBody.innerHTML = '<tr><td colspan="50" style="text-align:center; padding:50px;">此航程無資料</td></tr>';
            document.getElementById('list-stats').innerText = "請先搜尋航程以載入名單統計";
            return; 
        }

        const roomCounts = {};
        window.currentGroupData.forEach(item => { 
            if (item.status !== "已取消") {
                const rg = String(item.roomGroup || "").trim(); 
                if (rg !== "") roomCounts[rg] = (roomCounts[rg] || 0) + 1; 
            }
        });

        let filteredData = window.currentGroupData.filter(item => {
            let s = item.status || "";
            if (filterStatus === "正常") { if (s !== "正常" && s !== "") return false; } 
            else if (filterStatus === "已取消" && s !== "已取消") { return false; } 
            else if (filterStatus === "候補" && s !== "候補") { return false; }
            else if (filterStatus === "無ID") { if (String(item.id || "").trim() !== "") return false; }

            if (filterStatus === "群組" && !item.groupNote) return false;
            
            if (filterStatus === "同房") {
                const rg = String(item.roomGroup || "").trim();
                if (!rg || (roomCounts[rg] || 0) < 2) return false;
            }
            
            if (filterStatus === "孩童") {
                let childVal = getVal(item, "孩童備註");
                if (!childVal || childVal === "無" || childVal.trim() === "") return false;
            }
            
            if (filterStatus === "備註或需求") {
                let specReq = getVal(item, "備註或需求");
                if (!specReq || String(specReq).trim() === "") return false;
            }
            
            if (filterName) {
                let matchName = item.name && String(item.name).toLowerCase().includes(filterName);
                let matchEname = item.ename && String(item.ename).toLowerCase().includes(filterName);
                let matchId = item.id && String(item.id).toLowerCase().includes(filterName);
                if (!matchName && !matchEname && !matchId) return false;
            }

            for (let col in activeColFilters) {
                let val = String(getFilterVal(item, col) || "").trim();
                if (!activeColFilters[col].has(val)) return false;
            }
            return true;
        });

        let statsText = `航程-${currentGroupCode}：${window.currentGroupData.length}人 ｜ 篩選結果：${filteredData.length}人`;
        if (filterStatus !== "全部") statsText += ` (${filterStatus})`;
        if (Object.keys(activeColFilters).length > 0) statsText += ` `;
        document.getElementById('list-stats').innerText = statsText;
        if(filteredData.length === 0) { listBody.innerHTML = `<tr><td colspan="50" style="text-align:center; padding:50px; color:var(--text-light);">沒有符合條件的名單</td></tr>`; return; }

        let grpMinNo = {}; let roomMinNo = {};
        filteredData.forEach(d => {
            let grp = getCleanGroup(d.groupNote); let rm = String(d.roomGroup || "").trim(); let cNo = String(d.no || "");
            if (grp) { if (!grpMinNo[grp] || cNo.localeCompare(grpMinNo[grp], undefined, {numeric: true}) < 0) grpMinNo[grp] = cNo; }
            if (rm && roomCounts[rm] > 1) { if (!roomMinNo[rm] || cNo.localeCompare(roomMinNo[rm], undefined, {numeric: true}) < 0) roomMinNo[rm] = cNo; }
        });

        filteredData.sort((a, b) => {
            const cmpNo = (no1, no2) => String(no1 || "").localeCompare(String(no2 || ""), undefined, {numeric: true});
            if (forceNoSort) return cmpNo(a.no, b.no);

            if (activeColSort) {
                let vA = String(getFilterVal(a, activeColSort.col) || "").trim();
                let vB = String(getFilterVal(b, activeColSort.col) || "").trim();
                let res = vA.localeCompare(vB, 'zh-TW', {numeric: true});
                return activeColSort.dir === 'asc' ? res : -res;
            }

            let gA = getCleanGroup(a.groupNote); let gB = getCleanGroup(b.groupNote);
            let rA = String(a.roomGroup || '').trim(); let rB = String(b.roomGroup || '').trim();
            let sA = String(getVal(a, '備註或需求') || '').trim(); let sB = String(getVal(b, '備註或需求') || '').trim();
            let hasGrpA = gA !== ''; let hasGrpB = gB !== '';
            let hasRoomA = (rA !== '' && roomCounts[rA] > 1); let hasRoomB = (rB !== '' && roomCounts[rB] > 1);
            let hasSpecA = sA !== ''; let hasSpecB = sB !== '';

            if (filterStatus === "同房") {
                if (hasRoomA !== hasRoomB) return hasRoomA ? -1 : 1;
                if (hasRoomA && hasRoomB && rA !== rB) {
                    let minCmp = cmpNo(roomMinNo[rA], roomMinNo[rB]);
                    return minCmp !== 0 ? minCmp : rA.localeCompare(rB);
                }
                return cmpNo(a.no, b.no);
            } else {
                if (hasGrpA !== hasGrpB) return hasGrpA ? -1 : 1;
                if (hasGrpA && hasGrpB) {
                    if (gA !== gB) {
                        let minCmp = cmpNo(grpMinNo[gA], grpMinNo[gB]);
                        return minCmp !== 0 ? minCmp : gA.localeCompare(gB);
                    }
                    if (hasRoomA !== hasRoomB) return hasRoomA ? -1 : 1;
                    if (hasRoomA && hasRoomB && rA !== rB) {
                        let minCmp = cmpNo(roomMinNo[rA], roomMinNo[rB]);
                        return minCmp !== 0 ? minCmp : rA.localeCompare(rB);
                    }
                    if (hasSpecA !== hasSpecB) return hasSpecA ? -1 : 1;
                    return cmpNo(a.no, b.no);
                } else {
                    if (hasRoomA !== hasRoomB) return hasRoomA ? -1 : 1;
                    if (hasRoomA && hasRoomB && rA !== rB) {
                        let minCmp = cmpNo(roomMinNo[rA], roomMinNo[rB]);
                        return minCmp !== 0 ? minCmp : rA.localeCompare(rB);
                    }
                    if (hasSpecA !== hasSpecB) return hasSpecA ? -1 : 1;
                    return cmpNo(a.no, b.no);
                }
            }
        });

        let groupMap = {}; let roomMap = {};
        window.currentGroupData.forEach(d => { 
            let gTags = String(d.groupNote||"").split(',').map(t=>t.trim()).filter(t=>t);
            gTags.forEach(gt => { 
                let isL = gt.endsWith('(L)'); let realTag = gt.replace(/\(L\)$/, '');
                groupMap[realTag] = groupMap[realTag] || []; groupMap[realTag].push(d); 
                if(isL) { d.isLeader = d.isLeader || {}; d.isLeader[realTag] = true; }
            });
            if(d.roomGroup) { roomMap[d.roomGroup] = roomMap[d.roomGroup] || []; roomMap[d.roomGroup].push(d); } 
        });
        Object.keys(groupMap).forEach(k => { 
            groupMap[k].sort((a,b) => { 
                let aL = (a.isLeader && a.isLeader[k]) ? 1 : 0; 
                let bL = (b.isLeader && b.isLeader[k]) ? 1 : 0; 
                if (aL !== bL) return bL - aL; 
                return String(a.no || "").localeCompare(String(b.no || ""), undefined, {numeric: true}); 
            }); 
        });
        const groupColors = ["#0B2038", "#0D9488"]; let currentGrpColorIdx = 0; let currentRoomBgIdx = 0; let lastGrp = null; let lastRoom = null;

        filteredData.forEach((item, index) => {
            let tr = document.createElement('tr'); tr.id = `row-${item.no}`;
            let isGroup = getCleanGroup(item.groupNote) !== "" && filterStatus !== "同房"; 
            let isRoom = item.roomGroup && roomCounts[item.roomGroup] > 1;
            let borderClass = ""; let bgClass = "normal-bg";

            if (isRoom) { 
                if (item.roomGroup !== lastRoom) { if (lastRoom !== null) currentRoomBgIdx = 1 - currentRoomBgIdx; lastRoom = item.roomGroup; } bgClass = currentRoomBgIdx === 0 ? "room-bg-1" : "room-bg-2"; }
            if (isGroup) {
                let curGrp = getCleanGroup(item.groupNote);
                if (curGrp !== lastGrp) { if (lastGrp !== null) currentGrpColorIdx = 1 - currentGrpColorIdx; borderClass += "group-border-top "; lastGrp = curGrp; }
                borderClass += "group-border-left "; tr.style.setProperty('--grp-color', groupColors[currentGrpColorIdx]);
                let nextItem = filteredData[index+1];
                if (!nextItem || getCleanGroup(nextItem.groupNote) !== curGrp) { borderClass += "group-border-bottom "; }
            } else { lastGrp = null; } 

            tr.className = `${bgClass} ${borderClass}`;
            if(item.status === "已取消") tr.style.color = "var(--text-light)"; 
            const dotClass = item.status === "已取消" ? "dot-cancel" : (item.status === "候補" ? "dot-waitlist" : "dot-normal");
            
            let tagHTML = '';
            if (item.groupNote && item.groupNote !== "") { 
                let gTags = String(item.groupNote).split(',').map(t=>t.trim()).filter(t=>t);
                gTags.forEach(gt => {
                    let realTag = gt.replace(/\(L\)$/, ''); if(!groupMap[realTag] || groupMap[realTag].length===0) return;
                    let leaderNO = groupMap[realTag][0].no; 
                    let membersStr = `【群組代號: ${realTag}】<br>成員清單：<br>` + groupMap[realTag].map(m => `${m.no===leaderNO?'👑 ':''}${m.name} (ID: ${m.id||'--'})`).join('<br>'); 
                    tagHTML += `<span class="tag tag-group" onmouseenter="showTagTooltip(event, '${membersStr}')" onmousemove="moveTagTooltip(event)" onmouseleave="hideTagTooltip()">群</span>`; 
                });
            }
            if (isRoom) { let membersStr = `【同房代號: ${item.roomGroup}】<br>室友清單：<br>` + roomMap[item.roomGroup].map(m => `🛌 ${m.name} (ID: ${m.id||'--'})`).join('<br>');
            tagHTML += `<span class="tag tag-room" onmouseenter="showTagTooltip(event, '${membersStr}')" onmousemove="moveTagTooltip(event)" onmouseleave="hideTagTooltip()">房</span>`; }

            let specialReq = getVal(item, '備註或需求'); let specialReqHtml = '';
            if (specialReq.trim() !== '') {
                let escapedReq = specialReq.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, '<br>');
                specialReqHtml = `<span class="tag tag-special" style="margin-right:5px; flex:none; padding:2px 5px;" onmouseenter="showTagTooltip(event, '【備註或需求】<br>${escapedReq}')" onmousemove="moveTagTooltip(event)" onmouseleave="hideTagTooltip()">備</span>`;
            }
            let childVal = getVal(item, "孩童備註");
            if (childVal && (childVal.includes("2-6歲") || childVal.includes("7-12歲"))) {
                tagHTML += `<span class="tag" style="background-color:#D97978; color:white; padding:2px 5px;" onmouseenter="showTagTooltip(event, '孩童備註: ${childVal}')" onmousemove="moveTagTooltip(event)" onmouseleave="hideTagTooltip()">童</span>`;
            }

            let roomCancelBtn = item.roomGroup ? `<button class="btn-outline-warning" style="width:100%; justify-content:center;" onclick="cancelRoomingLocally('${item.no}', this)">取消同房</button>` : '';
            const lockAttr = `readonly ondblclick="this.removeAttribute('readonly'); this.focus();" onblur="this.setAttribute('readonly', true);" title="雙擊以編輯"`;

            let segVal = getVal(item, "區段");
            let cancelResVal = getVal(item, "取消結果");

            let html = `
                <td class="sticky-1" style="background-color: inherit;">${item.no}</td>
                <td><div style="display:flex; align-items:center;">${specialReqHtml}<input class="td-input req-val" style="flex:1; min-width:0;" value="${specialReq}" ${lockAttr}></div></td>
                <td class="sticky-2" style="background-color: inherit; overflow:visible;"><div style="display:flex; align-items:center; width:100%;"><span class="status-dot ${dotClass}"></span><input type="text" class="td-input edit-name" value="${item.name}" style="flex:1; min-width:60px; font-weight:600; color:inherit;" ${lockAttr}>${tagHTML}</div></td>
                <td class="sticky-3" style="background-color: inherit;"><input type="text" class="td-input edit-ename" value="${item.ename}" style="text-transform:uppercase;" ${lockAttr}></td>
                <td><input type="text" class="td-input edit-id" value="${item.id || ''}" ${lockAttr}></td>
                <td><input type="text" class="td-input edit-birth" value="${fmtDate(getVal(item, "生日"))}" ${lockAttr}></td>
                <td><input type="text" class="td-input edit-source" value="${getVal(item, "報名來源")}" ${lockAttr}></td>
                <td><input type="text" class="td-input edit-oldCustomer" value="${getVal(item, "老客")}" ${lockAttr}></td>
                
                <td><select class="td-input edit-segment"><option value="" ${!segVal?'selected':''}></option><option value="全程" ${segVal==='全程'?'selected':''}>全程</option><option value="區段" ${segVal==='區段'?'selected':''}>區段</option></select></td>
                
                <td><input type="text" class="td-input edit-promo" value="${getVal(item, "當月優惠價")}" onchange="fetchDictForGridRow('${item.no}')" ${lockAttr}></td>
                <td><input type="text" class="td-input edit-promoExtras" value="${getVal(item, "各種優惠價/船內特典")}" ${lockAttr}></td>
                <td><input type="text" class="td-input edit-couponDep text-right" value="${getVal(item, "Coupon船內預存金")}" ${lockAttr}></td>
                <td><input type="text" class="td-input edit-couponVou text-right" value="${getVal(item, "Coupon船內優惠券")}" ${lockAttr}></td>
                <td><select class="td-input edit-room" onchange="fetchDictForGridRow('${item.no}')"><option value="${item.roomType}" selected>${item.roomType}</option>${roomOptionsHTML.replace(`<option value="">-- 請選擇房型 --</option>`, '')}</select></td>
                <td><input type="text" class="td-input edit-bp" value="${getVal(item, "登船港")}" ${lockAttr}></td>
                <td><input type="text" class="td-input edit-op" value="${getVal(item, "離船港")}" ${lockAttr}></td>
                <td><input type="text" class="td-input td-readonly edit-tot text-right" value="${fmtNum(getVal(item, "基本旅費總價"))}" readonly></td>
                <td><input type="text" class="td-input td-readonly edit-crate" value="${getVal(item, "佣金%")}" readonly style="color:var(--text-light); font-weight:normal;"></td>
                <td><input type="text" class="td-input td-readonly edit-comm text-right" value="${fmtNum(getVal(item, "佣金"))}" readonly style="color:var(--danger);"></td>
                
                <td><input type="text" class="td-input edit-nameChange text-right" value="${fmtNum(getVal(item, "名義變更金額"))}" onfocus="unformatNum(this)" onblur="this.setAttribute('readonly', true); formatNumInput(this); calcGridRow('${item.no}');" readonly ondblclick="this.removeAttribute('readonly'); this.focus();" title="雙擊以編輯"></td>
                <td><input type="text" class="td-input td-readonly edit-set text-right" value="${fmtNum(getVal(item, "SET應付"))}" readonly style="color:var(--accent);"></td>
                <td><input type="text" class="td-input edit-operator" value="${getVal(item, "業務")}" ${lockAttr}></td>
                <td><input type="text" class="td-input edit-orderId" value="${getVal(item, "訂編")}" ${lockAttr}></td>
            `;

            advCols.forEach(c => { 
                let extraAttr = ''; let extraClass = 'text-right'; 
                if (["港務費", "小費", "下鋪指定A", "下鋪指定B", "免治馬桶", "國際旅客稅", "阿拉斯加稅", "無障礙房型", "房型升等", "其他追加費用", "海報志工優惠折扣金", "SF船費", "JGD", "AGTD"].includes(c)) { 
                    extraAttr = `type="text" oninput="calcGridRow('${item.no}')" onfocus="unformatNum(this)" onblur="this.setAttribute('readonly', true); formatNumInput(this); calcGridRow('${item.no}');" readonly ondblclick="this.removeAttribute('readonly'); this.focus();" title="雙擊以編輯"`; 
                }
                else { extraAttr = `type="text" readonly ondblclick="this.removeAttribute('readonly'); this.focus();" onblur="this.setAttribute('readonly', true);" title="雙擊以編輯"`; }
                html += `<td class="adv-col"><input class="td-input adv-input ${extraClass}" data-col="${c}" value="${fmtNum(getVal(item, c))}" ${extraAttr}></td>`;
            });

            html += `<td><input type="text" class="td-input edit-cancelReason" value="${getVal(item, "取消理由")}" ${lockAttr}></td>`;
            html += `<td><select class="td-input edit-cancelResult"><option value="" ${!cancelResVal?'selected':''}></option><option value="不移行" ${cancelResVal==='不移行'?'selected':''}>不移行</option><option value="往後移團" ${cancelResVal==='往後移團'?'selected':''}>往後移團</option><option value="往前移團" ${cancelResVal==='往前移團'?'selected':''}>往前移團</option><option value="名義變更" ${cancelResVal==='名義變更'?'selected':''}>名義變更</option></select></td>`;
            html += `<td><input type="text" class="td-input edit-cancelRemark" value="${getVal(item, "取消備註")}" ${lockAttr}></td>`; 

            html += `
                <td style="border-left: 1px solid var(--border); text-align: center; vertical-align: middle; padding: 0 8px;"><input type="hidden" class="edit-roomGroup" value="${item.roomGroup || ''}">${roomCancelBtn}</td>
                <td style="text-align: center; vertical-align: middle;"><div style="display:flex; justify-content:center; align-items:center; width:100%;">${item.status === "已取消" ? `<button class="btn-remove" style="color:var(--success);" onclick="restoreOrder('${item.no}')">復原訂單</button>` : `<button class="btn-remove" onclick="openCancelModal('${item.no}')">取消訂單</button>`}</div></td>
            `;
            tr.innerHTML = html; listBody.appendChild(tr);
        });
        
        const rows = document.querySelectorAll('#dataTable tr');
        rows.forEach(tr => {
            Array.from(tr.children).forEach((td, idx) => { if(td.tagName === 'TH' || td.tagName === 'TD') td.style.display = hiddenCols.includes(idx) ? 'none' : 'table-cell'; });
        });
    }

    let currentColToggleMode = 'show';
    function switchColModalTab(mode) {
        currentColToggleMode = mode;
        document.getElementById('tab-show-cols').classList.toggle('active', mode === 'show');
        document.getElementById('tab-hide-cols').classList.toggle('active', mode === 'hide');
        document.querySelector('#col-toggle-msg span').innerText = mode === 'show' ? '請勾選欲「顯示」的欄位：' : '請勾選欲「隱藏」的欄位：';
        renderColToggleList();
        let btn = document.getElementById('btn-toggle-all-cols');
        if(btn) { btn.style.background = '#E2E8F0'; btn.style.color = '#64748B'; }
    }

    function renderColToggleList() {
        const list = document.getElementById('col-toggle-list'); list.innerHTML = "";
        document.querySelectorAll('#list-head th:not(.sticky-1):not(.sticky-2):not(.sticky-3)').forEach((th, idx) => {
            let text = th.innerText.replace(' ✎', '').replace(' ▼', '').trim();
            if(text && !text.includes("同房管理") && !text.includes("操作")) {
                let isHidden = hiddenCols.includes(idx + 3);
                let isChecked = (currentColToggleMode === 'show') ? !isHidden : isHidden;
                list.innerHTML += `<label><input type="checkbox" class="col-toggle-cb" data-idx="${idx + 3}" ${isChecked ? "checked" : ""}> ${text}</label>`;
            }
        });
    }

    function openColToggleModal() { switchColModalTab('show'); document.getElementById('col-toggle-modal').classList.add('show'); }

    function toggleAllColCheckboxes() {
        let btn = document.getElementById('btn-toggle-all-cols'); let cbs = document.querySelectorAll('.col-toggle-cb');
        let allChecked = Array.from(cbs).every(cb => cb.checked); let targetState = !allChecked;
        cbs.forEach(cb => cb.checked = targetState);
        if (targetState) { btn.style.background = 'var(--text-main)'; btn.style.color = '#FFFFFF'; } 
        else { btn.style.background = '#E2E8F0'; btn.style.color = '#64748B'; }
    }

    function applyColToggle() {
        if (document.getElementById('col-toggle-modal').classList.contains('show')) {
            let checkedIdxs = Array.from(document.querySelectorAll('.col-toggle-cb:checked')).map(cb => parseInt(cb.getAttribute('data-idx')));
            let allIdxs = Array.from(document.querySelectorAll('.col-toggle-cb')).map(cb => parseInt(cb.getAttribute('data-idx')));
            if (currentColToggleMode === 'show') { hiddenCols = allIdxs.filter(idx => !checkedIdxs.includes(idx)); } 
            else { hiddenCols = checkedIdxs; }
        }
        const rows = document.querySelectorAll('#dataTable tr');
        rows.forEach(tr => { Array.from(tr.children).forEach((td, idx) => { if(td.tagName === 'TH' || td.tagName === 'TD') td.style.display = hiddenCols.includes(idx) ? 'none' : 'table-cell'; }); });
        document.getElementById('col-toggle-modal').classList.remove('show');
    }

    function resetColToggle() { 
        hiddenCols = []; const rows = document.querySelectorAll('#dataTable tr');
        rows.forEach(tr => { Array.from(tr.children).forEach((td, idx) => { if(td.tagName === 'TH' || td.tagName === 'TD') td.style.display = 'table-cell'; }); });
        document.getElementById('col-toggle-modal').classList.remove('show'); 
    }

    function cancelRoomingLocally(no, btn) {
        let tr = document.getElementById('row-' + no);
        if(tr) { tr.querySelector('.edit-roomGroup').value = ""; btn.innerText = "已解除"; btn.disabled = true; btn.style.opacity = "0.5";
        customAlert("已清空此人的同房代號，請點擊右上角【修改儲存更新】以寫入資料庫。", "success"); }
    }

    function batchUpdateRows() {
        const rows = document.querySelectorAll('#list-body tr[id^="row-"]'); 
        let hasInvalidDate = false;
        rows.forEach(tr => { let birthVal = tr.querySelector('.edit-birth').value.trim(); if (birthVal && !isValidDate(birthVal)) { hasInvalidDate = true; } });
        if (hasInvalidDate) return customAlert("列表中有生日日期格式不正確，請確認為有效的 YYYY/MM/DD！", "warning");

        const updates = []; 
        const changesLog = [];   
        const uiChangesLog = []; 

        rows.forEach(tr => {
            const no = tr.id.replace('row-', ''); 
            const orig = window.currentGroupData.find(d => String(d.no) === no); 
            if(!orig) return;
            
            let fields = {}; 
            let uiRowChanges = []; 
            let dbRowChanges = [];
            
            const checkStr = (origVal, newVal, label, fieldKey) => { 
                let oStr = String(origVal || '').trim(); let nStr = String(newVal || '').trim();
                if (oStr !== nStr) { 
                    fields[fieldKey] = newVal; 
                    uiRowChanges.push(`&nbsp;&nbsp;• ${label}: <del style="color:#94A3B8;">${oStr || '(空)'}</del> ➔ <span style="color:var(--danger); font-weight:600;">${nStr || '(空)'}</span>`); 
                    dbRowChanges.push(`  • ${label}: ${oStr || '(空)'} ➔ ${nStr || '(空)'}`);
                } 
            };
            const checkNum = (origVal, newVal, label, fieldKey) => { 
                let o = pNum(origVal); let n = pNum(newVal); 
                if (o !== n) { 
                    fields[fieldKey] = n; 
                    uiRowChanges.push(`&nbsp;&nbsp;• ${label}: <del style="color:#94A3B8;">${fmtNum(o)}</del> ➔ <span style="color:var(--danger); font-weight:600;">${fmtNum(n)}</span>`); 
                    dbRowChanges.push(`  • ${label}: ${fmtNum(o)} ➔ ${fmtNum(n)}`);
                } 
            };

            let reqColKey = window.currentGroupHeaders.includes("備註或需求") ? "備註或需求" : "特殊需求";
            checkStr(getVal(orig, reqColKey), tr.querySelector('.req-val').value, '備註或需求', reqColKey);
            checkStr(getVal(orig, "旅客姓名"), tr.querySelector('.edit-name').value, '旅客姓名', '旅客姓名');
            checkStr(getVal(orig, "NAME"), tr.querySelector('.edit-ename').value.toUpperCase(), 'NAME', 'NAME');
            checkStr(orig.id || '', tr.querySelector('.edit-id').value, 'ID', 'ID');
            checkStr(fmtDate(getVal(orig, "生日")), tr.querySelector('.edit-birth').value, '生日', '生日');
            checkStr(getVal(orig, "報名來源"), tr.querySelector('.edit-source').value, '報名來源', '報名來源');
            checkStr(getVal(orig, "老客"), tr.querySelector('.edit-oldCustomer').value, '老客', '老客');
            checkStr(getVal(orig, "區段"), tr.querySelector('.edit-segment').value, '區段', '區段');
            checkStr(getVal(orig, "當月優惠價"), tr.querySelector('.edit-promo').value, '當月優惠價', '當月優惠價');
            checkStr(getVal(orig, "各種優惠價/船內特典"), tr.querySelector('.edit-promoExtras').value, '各種優惠價/船內特典', '各種優惠價/船內特典');
            checkStr(getVal(orig, "Coupon船內預存金"), tr.querySelector('.edit-couponDep').value, '預存金', 'Coupon船內預存金');
            checkStr(getVal(orig, "Coupon船內優惠券"), tr.querySelector('.edit-couponVou').value, '優惠券', 'Coupon船內優惠券');
            checkStr(orig.roomType || '', tr.querySelector('.edit-room').value, '房型', '房型');
            checkStr(getVal(orig, "登船港"), tr.querySelector('.edit-bp').value, '登船港', '登船港');
            checkStr(getVal(orig, "離船港"), tr.querySelector('.edit-op').value, '離船港', '離船港');
            
            checkNum(getVal(orig, "基本旅費總價"), tr.querySelector('.edit-tot').value, '基本旅費總價', '基本旅費總價');
            checkNum(getVal(orig, "佣金"), tr.querySelector('.edit-comm').value, '佣金', '佣金');
            
            checkStr(getVal(orig, "取消理由"), tr.querySelector('.edit-cancelReason').value, '取消理由', '取消理由');
            checkStr(getVal(orig, "取消結果"), tr.querySelector('.edit-cancelResult').value, '取消結果', '取消結果');
            checkStr(getVal(orig, "取消備註"), tr.querySelector('.edit-cancelRemark').value, '取消備註', '取消備註'); 
            
            checkNum(getVal(orig, "名義變更金額"), tr.querySelector('.edit-nameChange').value, '名義變更金', '名義變更金額');
            checkNum(getVal(orig, "SET應付"), tr.querySelector('.edit-set').value, 'SET應付', 'SET應付');
            
            checkStr(getVal(orig, "佣金%"), tr.querySelector('.edit-crate').value, '佣金%', '佣金%');
            checkStr(getVal(orig, "業務"), tr.querySelector('.edit-operator').value, '業務', '業務');
            checkStr(getVal(orig, "訂編"), tr.querySelector('.edit-orderId').value, '訂編', '訂編');
            checkStr(orig.roomGroup || '', tr.querySelector('.edit-roomGroup').value, '同房註記', '同房註記');

            tr.querySelectorAll('.adv-input').forEach(input => { let c = input.getAttribute('data-col'); checkNum(getVal(orig, c), input.value, c, c); });

            // 若有異動，推入雙軌陣列 (UI 用於確認視窗，Text 用於 GAS 資料庫)
            if (uiRowChanges.length > 0) { 
                updates.push({no: no, fields: fields}); 
                uiChangesLog.push(`<div style="margin-bottom: 4px; font-weight: 700; color: var(--primary);">NO.${no} ${orig.name} (ID: ${orig.id||'--'})</div>${uiRowChanges.join('<br>')}`); 
                
                // 確保完整收集數值，送到我們自訂的 Log 中
                changesLog.push(`[資料變更明細] NO.${no} ${orig.name} (ID: ${orig.id||'--'})\n${dbRowChanges.join('\n')}`);
            }
        });

        if (updates.length === 0) return customAlert("無資料可更新！", "warning"); 

        let confirmHtml = `<div style="text-align:left; max-height: 60vh; overflow-y:auto;">`;
        confirmHtml += `<div style="margin-bottom:15px; color:var(--text-main); font-weight:600; font-size:13px;">以下 ${updates.length} 筆資料將被修改，請確認內容無誤：</div>`;
        uiChangesLog.forEach(line => {
            let escapedLine = String(line).replace(/'/g, "\\'");
            confirmHtml += `<div style="padding:10px 12px; margin-bottom:8px; background:var(--sys-bg); border-radius:6px; font-size:12px; line-height:1.6; border-left:3px solid var(--gold); color:var(--text-main); word-break:break-word;">${escapedLine}</div>`;
        });
        confirmHtml += `</div>`;

        document.querySelector('#custom-modal .modal-box').style.width = '800px';
        document.querySelector('#custom-modal .modal-box').style.maxWidth = '95vw';

        const executeBatchUpdate = async () => {
            showLoading();
            try {
                let res = await gasPost('batchUpdateRows', {
                    updates: updates,
                    changesLog: changesLog,
                    operator: currentUser()
                });
                let json = await res.json();
                
                if(json.status === 'success') { 
                    isLogsDirty = true; 
                    await refreshCurrentList();
                    hideLoading();
                    customAlert(`整批寫入成功！`, "success"); 
                } else { 
                    hideLoading();
                    customAlert("更新失敗：" + json.message, "error"); 
                } 
            } catch(err) {
                hideLoading();
                customAlert("網路錯誤，請稍後再試。", "error");
            }
        };

        customConfirm(confirmHtml, executeBatchUpdate);
    }

    async function runValidation() {
        if(!window.currentGroupData || window.currentGroupData.length === 0) return customAlert("請先搜尋航程名單！", "warning");
        
        showLoading();
        
        let groupCode = document.getElementById('search-groupCode').value;
        let defs = window.voyageDefaults[groupCode] || {};
        let defBoard = defs.boardPort || "Yokohama";
        let defOff = defs.offPort || "Keelung";
        let defTips = pNum(defs.tips);
        let defPortFee = pNum(defs.portFee);
        let defIntlTax = pNum(defs.intlTax);
        let defAlaskaTax = pNum(defs.alaskaTax);
        
        let errors = [];
        
        window.currentGroupData.forEach(item => {
            if(item.status === '已取消') return;
            
            let issues = [];
            let bp = getVal(item, "登船港");
            let op = getVal(item, "離船港");
            let seg = getVal(item, "區段");
            let tips = pNum(getVal(item, "小費"));
            let portFee = pNum(getVal(item, "港務費"));
            let intlTax = pNum(getVal(item, "國際旅客稅"));
            let alaskaTax = pNum(getVal(item, "阿拉斯加稅"));
            let sf = pNum(getVal(item, "SF船費"));
            
            let suffix = (seg === "區段") ? " (區段)" : "";
            
            if (bp !== defBoard) issues.push({ col: '登船港', actual: '登船港 ' + (bp || '(空)') + suffix, expected: '登船港 ' + defBoard });
            if (op !== defOff) issues.push({ col: '離船港', actual: '離船港 ' + (op || '(空)') + suffix, expected: '離船港 ' + defOff });
            if (tips !== defTips) issues.push({ col: '小費', actual: '小費 ' + fmtNum(tips) + suffix, expected: '小費 ' + fmtNum(defTips) });
            if (portFee !== defPortFee) issues.push({ col: '港務費', actual: '港務費 ' + fmtNum(portFee) + suffix, expected: '港務費 ' + fmtNum(defPortFee) });
            if (intlTax !== defIntlTax) issues.push({ col: '國際旅客稅', actual: '國際旅客稅 ' + fmtNum(intlTax) + suffix, expected: '國際旅客稅 ' + fmtNum(defIntlTax) });
            if (alaskaTax !== defAlaskaTax) issues.push({ col: '阿拉斯加稅', actual: '阿拉斯加稅 ' + fmtNum(alaskaTax) + suffix, expected: '阿拉斯加稅 ' + fmtNum(defAlaskaTax) });
            
            let promo = getVal(item, "當月優惠價");
            let roomFull = item.roomType || "";
            let roomCode = roomFull;
            let parts = roomFull.split('-'); if(parts.length >= 3) roomCode = parts[parts.length-2].trim(); else if(parts.length === 2) roomCode = parts[1].trim();
            let lookupKey = promo + "-" + groupCode + "-" + roomCode; 
            let pd = priceDict[lookupKey];
            
            if (pd) {
                let expectedSF = pNum(pd.sfPrice);
                let childVal = getVal(item, "孩童備註");
                let isSingle = roomFull.includes("(單人)");
                let isDouble = roomFull.includes("(雙人)");

                if (childVal === "2-6歲") { expectedSF = 0; }
                else if (childVal === "7-12歲") {
                    if (isDouble) expectedSF = Math.round(expectedSF * 0.2);
                    else if (isSingle) expectedSF = Math.round(expectedSF * 0.1);
                }
                
                if (sf !== expectedSF) {
                    issues.push({ col: 'SF船費', actual: `SF船費 ${fmtNum(sf)}`, expected: `SF船費 ${fmtNum(expectedSF)}` });
                }
            } else {
                issues.push({ col: '價格方案', actual: `無對應方案`, expected: `應有對應方案` });
            }
            
            if (issues.length > 0) {
                errors.push({ no: item.no, name: item.name, id: item.id, issues: issues });
            }
        });
        
        if (errors.length === 0) {
            hideLoading();
            customAlert("檢核完成，目前名單無任何異常項目！", "success");
        } else {
            try {
                let logRes = await fetch(gasURL + "?action=getLogs&t=" + new Date().getTime());
                let logData = await logRes.json();
                let logs = logData.data || [];
                
                errors.forEach(e => {
                    e.issues.forEach(issue => {
                        let targetStr = `NO.${e.no} ${e.name} [${issue.col}]`;
                        let matchLogs = logs.filter(l => l.target === targetStr && (l.action === '排除異常' || l.action === '列為問題'));
                        if (matchLogs.length > 0) {
                            matchLogs.sort((a,b) => new Date(b.time.replace(/-/g, '/')).getTime() - new Date(a.time.replace(/-/g, '/')).getTime());
                            let latest = matchLogs[0];
                            if (latest.action === '排除異常') issue.status = 'pass';
                            else if (latest.action === '列為問題') issue.status = 'issue';
                            issue.note = latest.details;
                        }
                    });
                });
            } catch(err) {
                console.error("同步歷史排除紀錄失敗", err);
            }

            hideLoading();

            let html = `<div style="max-height:500px; overflow-y:auto; margin-bottom:15px; border:1px solid var(--border); border-radius:8px;">
                <table style="width:100%; border-collapse:collapse; table-layout:fixed; font-size:12px; text-align:left;">
                    <colgroup>
                        <col style="width: 80px;">
                        <col style="width: 80px;">
                        <col style="width: 90px;">
                        <col style="width: 15%;">
                        <col style="width: 15%;">
                        <col style="width: 130px;">
                        <col style="width: 130px;">
                        <col style="width: auto;">
                    </colgroup>
                    <thead style="position:sticky; top:0; background:var(--primary-light); color:var(--white); z-index:10;">
                        <tr>
                            <th style="padding:10px;">NO</th>
                            <th style="padding:10px;">姓名</th>
                            <th style="padding:10px;">ID</th>
                            <th style="padding:10px;">異常</th>
                            <th style="padding:10px;">正常</th>
                            <th style="padding:10px; text-align:center;">排除異常</th>
                            <th style="padding:10px; text-align:center;">列為問題</th>
                            <th style="padding:10px;">說明</th>
                        </tr>
                    </thead>
                    <tbody>`;
            errors.forEach(e => { 
                e.issues.forEach((issue, j) => {
                    let issueId = `issue-${e.no}-${j}`;
                    let bg = 'var(--white)';
                    if (issue.status === 'pass') bg = '#ECFDF5';
                    else if (issue.status === 'issue') bg = '#FEF2F2';

                    html += `<tr id="${issueId}" style="border-bottom:1px solid var(--border); transition:background-color 0.3s; background:${bg};">
                        <td style="padding:8px 10px; font-weight:600; color:var(--primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${e.no}">${e.no}</td>
                        <td style="padding:8px 10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${e.name}">${e.name}</td>
                        <td style="padding:8px 10px; color:var(--text-light); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${e.id||'--'}">${e.id||'--'}</td>
                        <td style="padding:8px 10px; color:var(--danger); font-weight:600; word-break:break-word;">${issue.actual}</td>
                        <td style="padding:8px 10px; color:var(--success); font-weight:600; word-break:break-word;">${issue.expected}</td>
                        <td style="padding:8px 10px; text-align:center;">
                            <button onclick="markIssueStatus('${issueId}', 'pass', '${e.no}', '${e.name}', '${issue.col}')" style="background:#065F46; color:white; border:none; border-radius:4px; padding:6px 12px; font-size:11px; cursor:pointer; font-weight:600;">✅ 排除異常</button>
                        </td>
                        <td style="padding:8px 10px; text-align:center;">
                            <button onclick="markIssueStatus('${issueId}', 'issue', '${e.no}', '${e.name}', '${issue.col}')" style="background:#9F1239; color:white; border:none; border-radius:4px; padding:6px 12px; font-size:11px; cursor:pointer; font-weight:600;">❌ 列為問題</button>
                        </td>
                        <td id="note-${issueId}" style="padding:8px 10px; color:var(--text-light); font-size:11px; word-break:break-word;">${issue.note || ''}</td>
                    </tr>`;
                });
            });
            html += `</tbody></table></div>`;
            
            window._currentValidationErrors = errors; 
            
            document.getElementById('modal-title').innerText = '檢核結果：發現異常問題件';
            document.getElementById('modal-msg').innerHTML = html;
            
            document.querySelector('#custom-modal .modal-box').style.width = '90vw';
            document.querySelector('#custom-modal .modal-box').style.maxWidth = '1400px';

            let btnCancel = document.getElementById('modal-btn-cancel'); 
            let btnConfirm = document.getElementById('modal-btn-confirm');
            btnCancel.style.display = 'block'; 
            btnCancel.innerText = '匯出異常清單 (EXCEL)';
            btnCancel.onclick = exportValidationErrors;
            btnConfirm.innerText = '關閉視窗';
            btnConfirm.onclick = function() { closeModal(true); };
            
            document.getElementById('custom-modal').classList.add('show');
        }
    }

    window.markIssueStatus = function(issueId, status, no, name, col) {
        let tr = document.getElementById(issueId);
        let noteTd = document.getElementById(`note-${issueId}`);
        let operator = document.getElementById('current-username').innerText;
        let dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '/');
        
        let note = "";
        let actionType = "";
        if(status === 'pass') {
            tr.style.backgroundColor = '#ECFDF5'; 
            note = `${operator}排除異常 ${dateStr}`;
            actionType = '排除異常';
        } else {
            tr.style.backgroundColor = '#FEF2F2'; 
            note = `${operator}列為問題 ${dateStr}`;
            actionType = '列為問題';
        }
        
        noteTd.innerText = note;
        
        let parts = issueId.split('-');
        let trNo = parts.slice(1, parts.length-1).join('-'); 
        let j = parseInt(parts[parts.length-1]);
        let errObj = window._currentValidationErrors.find(e => e.no === trNo);
        if(errObj && errObj.issues[j]) {
            errObj.issues[j].status = status;
            errObj.issues[j].note = note;
        }

        let targetStr = `NO.${no} ${name} [${col}]`;
        gasPost('addCustomLog', { operator: operator, target: targetStr, actionName: actionType, details: note })
        .then(() => { isLogsDirty = true; });
    };

    function exportValidationErrors() {
        let errors = window._currentValidationErrors;
        if(!errors || errors.length === 0) return;
        
        let exportData = [["NO", "姓名", "ID", "錯誤數值", "正常數值", "處理狀態", "說明"]];
        
        errors.forEach(e => {
            e.issues.forEach(issue => {
                let statusStr = "未處理";
                if(issue.status === 'pass') statusStr = "已排除";
                else if (issue.status === 'issue') statusStr = "列為問題";
                
                exportData.push([
                    e.no, e.name, e.id || '--',
                    issue.actual, issue.expected,
                    statusStr, issue.note || ''
                ]);
            });
        });
        
        let wb = XLSX.utils.book_new(); let ws = XLSX.utils.aoa_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "異常檢核名單");
        let groupCode = document.getElementById('search-groupCode').value || "未知";
        let dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '.');
        XLSX.writeFile(wb, `(${groupCode}) 異常檢核清單 (${dateStr}).xlsx`);
    }

    function exportExcel() {
        if(!window.currentGroupData || window.currentGroupData.length === 0) return customAlert("無資料可匯出！", "warning");
        let exportData = []; exportData.push(window.currentGroupHeaders);
        let bIdx = window.currentGroupHeaders.indexOf("生日");

        window.currentGroupData.forEach(item => { 
            let r = [...item.raw];
            if(bIdx > -1) r[bIdx] = fmtDate(r[bIdx]);
            exportData.push(r); 
        });
        let wb = XLSX.utils.book_new(); let ws = XLSX.utils.aoa_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "航程名單");
        let groupCode = document.getElementById('search-groupCode').value || "未知";
        let dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '.');
        XLSX.writeFile(wb, `(${groupCode}) 航程名單 (${dateStr}).xlsx`);
    }

    function generateTagIdStr() { return (managerType === "群組備註" ? "GRP-" : "RM-") + Date.now().toString().slice(-5); }
    
    function openManagerModal(type) {
        if(!window.currentGroupData || window.currentGroupData.length === 0) return customAlert("請先搜尋並載入航程名單！", "warning");
        managerType = type;
        document.getElementById('manager-title').innerText = type === "群組備註" ? "👑 群組與成員管理" : "🛌 同房名單管理";
        document.getElementById('manager-section-1-title').innerText = type === "群組備註" ? "1. 既有群組或新增群組" : "1. 既有同房或新增同房";
        document.getElementById('manager-input-label').innerText = type === "群組備註" ? "群組名稱" : "同房名稱";
        document.getElementById('manager-search-input').value = "";
        let tags = new Set();
        window.currentGroupData.forEach(d => { 
            let gTags = String(getVal(d, type)).split(',').map(t=>t.trim().replace(/\(L\)$/, '')).filter(t=>t);
            gTags.forEach(t => tags.add(t));
        });
        let existingSelect = document.getElementById('manager-select-existing');
        let defaultOptText = type === "群組備註" ? "-- [新增群組] --" : "-- [新增同房] --";
        existingSelect.innerHTML = `<option value="">${defaultOptText}</option>`; 
        tags.forEach(t => { existingSelect.innerHTML += `<option value="${t}">${t}</option>`; });
        
        loadManagerTag(""); document.getElementById('manager-modal').classList.add('show');
    }

    function loadManagerTag(tagId) {
        currentManagerOldTag = tagId; document.getElementById('manager-tag-id').value = tagId;
        if(!tagId) document.getElementById('manager-tag-id').value = generateTagIdStr();
        managerLeaderNo = null; tempSelectedNos.clear();
        if (tagId && managerType === "群組備註") {
            let leaderObj = window.currentGroupData.find(d => { let tags = String(getVal(d, managerType)).split(',').map(t=>t.trim()); return tags.includes(tagId + "(L)"); });
            if (leaderObj) managerLeaderNo = leaderObj.no;
        }
        window.currentGroupData.forEach(d => {
            if(d.status === "已取消") return;
            let currentTags = String(getVal(d, managerType)).split(',').map(t => t.trim().replace(/\(L\)$/, ''));
            if(tagId && currentTags.includes(tagId)) { tempSelectedNos.add(String(d.no)); }
        });
        document.getElementById('manager-search-input').value = ""; renderManagerLeftList(); renderManagerRightList();
    }

    function addMemberToTemp(no) { tempSelectedNos.add(String(no)); renderManagerLeftList(); renderManagerRightList(); }
    function removeMemberFromTemp(no) { tempSelectedNos.delete(String(no)); if (managerLeaderNo == no) managerLeaderNo = null; renderManagerLeftList(); renderManagerRightList(); }
    function setManagerLeader(e, no) { if(e) { e.preventDefault(); e.stopPropagation(); } managerLeaderNo = (managerLeaderNo == no) ? null : no; renderManagerLeftList(); }

    function renderManagerLeftList() {
        let container = document.getElementById('selected-chips-container');
        if (tempSelectedNos.size === 0) { container.innerHTML = '<div style="font-size:12px; color:#94A3B8; text-align:center; padding:30px 0;">尚無成員<br><br>請從右側清單點擊加入 ➔</div>'; return; }
        let selectedData = Array.from(tempSelectedNos).map(no => window.currentGroupData.find(d => String(d.no) === no)).filter(Boolean);
        selectedData.sort((a,b) => String(a.no || "").localeCompare(String(b.no || ""), undefined, {numeric: true}));

        let html = "";
        selectedData.forEach(d => {
            let isL = (managerLeaderNo == d.no);
            let crown = (managerType === "群組備註") ? `<span onclick="setManagerLeader(event, '${d.no}')" title="點擊設為群主" style="cursor:pointer; font-size:16px; margin-right:8px; filter:${isL?'grayscale(0)':'grayscale(1)'}; opacity:${isL?'1':'0.3'}; transition:0.2s;">👑</span>` : '';
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--white); border:1px solid ${isL?'var(--success)':'var(--border)'}; padding:8px 12px; margin-bottom:6px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                    <div style="display:flex; align-items:center;">
                        ${crown}
                        <div style="display:flex; flex-direction:column; line-height:1.2;">
                            <span style="font-weight:600; color:var(--primary); font-size:13px;">${d.name}</span>
                            <span style="font-size:10px; color:var(--text-light); margin-top:2px;">NO.${d.no} | ID: ${d.id||'--'}</span>
                        </div>
                    </div>
                    <span style="color:var(--danger); cursor:pointer; font-size:20px; line-height:1; font-weight:bold; padding:0 5px;" onclick="removeMemberFromTemp('${d.no}')" title="移除此成員">&times;</span>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    function renderManagerRightList() {
        let container = document.getElementById('manager-available-list'); let kw = document.getElementById('manager-search-input').value.toLowerCase().trim();
        let matches = window.currentGroupData.filter(d => {
            if (d.status === "已取消" || tempSelectedNos.has(String(d.no))) return false;
            if (kw) { return String(d.name || "").toLowerCase().includes(kw) || String(d.id || "").toLowerCase().includes(kw); }
            return true;
        });

        if (matches.length > 0) {
            container.innerHTML = matches.map(d => {
                let curTags = String(getVal(d, managerType)).split(',').map(t=>t.trim().replace(/\(L\)$/, '')).filter(Boolean);
                let tagHint = curTags.length > 0 ? `<span style="font-size:10px; color:var(--special); background:#F4F4F5; padding:2px 6px; border-radius:4px; margin-left:8px;">已於: ${curTags.join(', ')}</span>` : '';
                return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px; border-bottom:1px solid #F1F5F9; cursor:pointer; transition:0.2s;" onclick="addMemberToTemp('${d.no}')" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
                    <div style="display:flex; flex-direction:column; line-height:1.2;">
                        <div style="display:flex; align-items:center;">
                            <span style="font-weight:600; color:var(--text-main); font-size:13px;">${d.name}</span>
                            ${tagHint}
                        </div>
                        <span style="font-size:10px; color:var(--text-light); margin-top:4px;">NO.${d.no} | ID: ${d.id||'--'}</span>
                    </div>
                    <span style="color:var(--accent); font-weight:700; font-size:18px;">+</span>
                </div>`;
            }).join('');
        } else { container.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-light); font-size:12px;">無符合的旅客</div>'; }
    }

    function deleteCurrentGroup() {
        if(!currentManagerOldTag) return customAlert("這是尚未建立的新代號，無法刪除。", "warning");
        customConfirm(`確定要徹底刪除代號「${currentManagerOldTag}」嗎？\n所有成員的此標籤都會被清除！`, () => {
            document.getElementById('manager-tag-id').value = ""; tempSelectedNos.clear(); submitManagerModal();
        }, true);
    }

    function closeManagerModal() { document.getElementById('manager-modal').classList.remove('show'); }

    function submitManagerModal() {
        let newTagId = document.getElementById('manager-tag-id').value.trim();
        let selectedNOs = []; let hasConflict = false;

        if (managerType === "同房註記") {
            tempSelectedNos.forEach(no => {
                selectedNOs.push(no);
                let curTags = window.currentGroupData.find(d => String(d.no) === no)?.roomGroup || "";
                if (curTags && curTags !== newTagId && newTagId !== "") hasConflict = true; 
            });
            if (newTagId === "" && selectedNOs.length === 0) { } 
            else {
                if (selectedNOs.length > 4) return customAlert("同房人數最多 2~4 人！", "warning");
                let originalMembers = window.currentGroupData.filter(d => getVal(d, '同房註記') === currentManagerOldTag).map(d => String(d.no));
                let isDecrease = false;
                if (currentManagerOldTag !== "") { for(let o of originalMembers) { if(!selectedNOs.includes(o)) { isDecrease = true; break; } } }

                if (isDecrease) {
                    customConfirm("同房人數減少，系統將自動解除該房所有旅客的同房關係！", async () => {
                        showLoading();
                        await gasPost('updateTags', { type: managerType, oldTagId: currentManagerOldTag, newTagId: "", selectedNOs: [], voyage: document.getElementById('search-groupCode').value, operator: currentUser(), memberDetails: "因同房人數減少，已自動解除所有人的同房關係" }).then(r=>r.json());
                        closeManagerModal();
                        await refreshCurrentList();
                        hideLoading();
                    }, true);
                    return; 
                }
                if (selectedNOs.length === 1) return customAlert("同房人數不可只有 1 人，請選擇 2~4 人，或清空代號以徹底解除同房。", "warning");
                if (selectedNOs.length > 1) {
                    let roomTypes = new Set();
                    selectedNOs.forEach(no => { let p = window.currentGroupData.find(d => String(d.no) === no); if(p && p.roomType) roomTypes.add(p.roomType); });
                    if (roomTypes.size > 1) return customAlert("同房的旅客必須為「相同房型」！", "warning");
                }
            }
        } else { tempSelectedNos.forEach(no => selectedNOs.push(no)); }

        if(!newTagId && selectedNOs.length > 0) return customAlert("您已選擇成員，請為他們輸入一組代號！\n若欲解除他們的狀態，請徹底刪除代號或清空代號欄位。", "warning");
        
        let logs = [];
        selectedNOs.forEach(no => {
            let p = window.currentGroupData.find(d => String(d.no) === no);
            if(p) logs.push(`- NO.${p.no} 姓名: ${p.name} (ID: ${p.id||'--'})`);
        });
        let memberDetails = "成員異動名單如下:\n" + logs.join('\n');
        if (managerType === "群組備註" && managerLeaderNo && newTagId) {
            let leader = window.currentGroupData.find(d => String(d.no) === String(managerLeaderNo));
            if(leader) memberDetails += `\n\n👑 指定群主: NO.${leader.no} ${leader.name}`;
        }

        let executeAction = async () => {
            showLoading();
            await gasPost('updateTags', { type: managerType, oldTagId: currentManagerOldTag, newTagId: newTagId, selectedNOs: selectedNOs, leaderNo: managerLeaderNo, voyage: document.getElementById('search-groupCode').value, operator: currentUser(), memberDetails: memberDetails }).then(r=>r.json());
            closeManagerModal();
            await refreshCurrentList();
            hideLoading();
        };
        
        if (hasConflict) customConfirm("選擇的名單中，有人已經具備其他的同房代號。\n確定要覆蓋並修改為新的同房代號嗎？", executeAction, true);
        else executeAction();
    }

    function openCancelModal(no) { 
        cancelTargetNo = no; document.getElementById('cancel-reason').value = ""; document.getElementById('cancel-result').value = "";
        document.getElementById('cancel-amount').value = ""; document.getElementById('cancel-remark').value = "";
        document.getElementById('cancel-amt-box').style.display = "none"; document.getElementById('cancel-modal').classList.add('show');
    }
    
    function closeCancelModal() { document.getElementById('cancel-modal').classList.remove('show'); }

    function confirmCancelOrder() {
        let reason = document.getElementById('cancel-reason').value; let resVal = document.getElementById('cancel-result').value;
        let amt = document.getElementById('cancel-amount').value; let remark = document.getElementById('cancel-remark').value;
        
        if(!reason || !resVal) return customAlert("【取消理由】與【取消結果】皆為必填！", "warning");
        if(resVal === '名義變更' && !amt) return customAlert("選擇【名義變更】時，請務必輸入變更金額！", "warning");
        
        showLoading();
        gasPost('cancelOrder', { no: cancelTargetNo, operator: currentUser(), reason: reason, result: resVal, amount: pNum(amt), remark: remark })
        .then(res => res.json()).then(async res => {
            if(res.status === 'success') {
                isLogsDirty = true; closeCancelModal();
                await refreshCurrentList();
                hideLoading();
            } else {
                hideLoading();
                customAlert("取消失敗：" + res.message, "error");
            }
        });
    }

    function restoreOrder(no) { customConfirm(`確定要復原 NO.${no} 的訂單嗎？`, () => { showLoading(); gasPost('restoreOrder', { no: no, operator: currentUser() }).then(res => res.json()).then(async res => { if(res.status === 'success') { isLogsDirty = true; await refreshCurrentList(); } hideLoading(); }); }); }

    // 帳款查詢系統功能實作
    function parseDateSafely(dStr) {
        if (!dStr) return 0;
        let clean = String(dStr).split('T')[0].split(' ')[0].replace(/\//g, '-');
        let t = new Date(clean).getTime();
        return isNaN(t) ? 0 : t;
    }

    function getAccVal(item, headers, colName) {
        let map = {
            "NO.": "NO",
            "名義變更金額": "名義變更金額",
            "佣金%": "佣金%"
        };
        let target = map[colName] || colName;
        let idx = headers.indexOf(target);
        if (idx === -1 && target === "佣金%") idx = headers.indexOf("傭金%"); // 兼容寫法
        if (idx === -1 && target === "名義變更金額") idx = headers.indexOf("名義變更");
        return idx > -1 ? (item.raw[idx] !== undefined ? item.raw[idx] : "") : (item[target.toLowerCase()] || "");
    }

    async function generateAccountingReport() {
        let sDate = document.getElementById('acc-start-date').value;
        let eDate = document.getElementById('acc-end-date').value;
        if (!sDate || !eDate) return customAlert("請選擇完整日期區間", "warning");

        let sTime = new Date(sDate + " 00:00:00").getTime();
        let eTime = new Date(eDate + " 23:59:59").getTime();

        showLoading();
        accReportData = {};
        accAllPossibleCols = new Set();

        let groupList = Array.from(document.getElementById('groupOptions').options).map(o => o.value);
        const chunkSize = 5; // 分批非同步抓取
        for (let i = 0; i < groupList.length; i += chunkSize) {
            let chunk = groupList.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async g => {
                try {
                    let res = await fetch(gasURL + "?action=searchOrders&groupCode=" + encodeURIComponent(g) + "&t=" + Date.now());
                    let json = await res.json();
                    if (json.status === 'success' && json.data.length > 0) {
                        json.headers.forEach(h => accAllPossibleCols.add(h));
                        // 找尋常見的日期欄位
                        let caIdx = json.headers.findIndex(h => {
                            let lc = h.toLowerCase();
                            return lc === 'created_at' || lc.includes('建立日期') || lc.includes('建立時間') || lc.includes('報名日期') || lc.includes('訂單日期');
                        });

                        let filtered = json.data.filter(item => {
                            if (caIdx === -1) return false;
                            let t = parseDateSafely(item.raw[caIdx]);
                            return t >= sTime && t <= eTime;
                        });

                        if (filtered.length > 0) {
                            accReportData[g] = { headers: json.headers, data: filtered };
                        }
                    }
                } catch(e) { console.error("Fetch error for " + g, e); }
            }));
        }
        hideLoading();
        renderAccountingTable();
    }
    
    // 開啟手動加入名單介面
    function openAccAddModal() {
        document.getElementById('acc-add-voyage').value = "";
        document.getElementById('acc-add-search').value = "";
        accManualAvailable = [];
        accManualSelected = [];
        currentAccAddVoyage = "";
        renderAccAddLists();
        document.getElementById('acc-add-modal').classList.add('show');
    }

    function closeAccAddModal() {
        document.getElementById('acc-add-modal').classList.remove('show');
    }

    async function fetchAccAddVoyage() {
        let g = document.getElementById('acc-add-voyage').value.trim();
        if(!g) return customAlert("請先輸入航程代碼", "warning");
        showLoading();
        try {
            let res = await fetch(gasURL + "?action=searchOrders&groupCode=" + encodeURIComponent(g) + "&t=" + Date.now());
            let json = await res.json();
            hideLoading();
            if(json.status === 'success' && json.data.length > 0) {
                currentAccAddVoyage = g;
                json.headers.forEach(h => accAllPossibleCols.add(h));
                accHeadersCache = json.headers;
                accManualAvailable = json.data;
                renderAccAddLists();
            } else {
                customAlert("查無資料", "warning");
            }
        } catch(e) {
            hideLoading();
            customAlert("網路連線異常，請稍後再試", "error");
        }
    }

    function renderAccAddLists() {
        let kw = document.getElementById('acc-add-search').value.toLowerCase().trim();
        let availableHtml = '';

        if (accManualAvailable.length === 0 && !currentAccAddVoyage) {
            availableHtml = '<div style="text-align:center; color:var(--text-light); padding:20px 0;">請先指定航程並載入</div>';
        } else {
            accManualAvailable.forEach(d => {
                let isSelected = accManualSelected.find(s => s.no === d.no && s._voyage === currentAccAddVoyage);
                if(!isSelected && d.status !== "已取消") {
                    if(!kw || String(d.name||'').toLowerCase().includes(kw) || String(d.id||'').toLowerCase().includes(kw) || String(d.no).includes(kw)) {
                        availableHtml += `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 15px; border-bottom:1px solid var(--sys-bg); cursor:pointer; transition:0.2s;" onclick="selectAccItem('${d.no}')" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
                            <div style="display:flex; flex-direction:column;">
                                <span style="font-weight:600; font-size:13px; color:var(--text-main);">${d.name}</span>
                                <span style="font-size:11px; color:var(--text-light); margin-top:2px;">NO.${d.no} | ID: ${d.id||'--'}</span>
                            </div>
                            <span style="color:var(--success); font-weight:600; font-size:12px;">+ 加入</span>
                        </div>`;
                    }
                }
            });
            if(availableHtml === '') availableHtml = '<div style="text-align:center; color:var(--text-light); padding:20px 0;">無符合的名單</div>';
        }
        document.getElementById('acc-add-available').innerHTML = availableHtml;

        let selectedHtml = '';
        if (accManualSelected.length === 0) {
            selectedHtml = '<div style="text-align:center; color:var(--text-light); width:100%; padding:20px 0;">尚未選擇</div>';
        } else {
            accManualSelected.forEach(d => {
                selectedHtml += `
                <div style="display:flex; align-items:center; background:var(--sys-bg); border:1px solid var(--border); padding:8px 12px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.02); gap:10px;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:600; color:var(--primary); font-size:12px;">[${d._voyage}] ${d.name}</span>
                        <span style="font-size:10px; color:var(--text-light);">NO.${d.no}</span>
                    </div>
                    <span style="color:var(--danger); cursor:pointer; font-size:18px; font-weight:bold; line-height:1; margin-left:auto; padding-left:5px;" onclick="deselectAccItem('${d.no}', '${d._voyage}')" title="移除">&times;</span>
                </div>`;
            });
        }
        document.getElementById('acc-add-selected').innerHTML = selectedHtml;
    }

    function selectAccItem(no) {
        let item = accManualAvailable.find(d => String(d.no) === String(no));
        if(item) {
            let clone = {...item, _voyage: currentAccAddVoyage, _headers: accHeadersCache};
            accManualSelected.push(clone);
            renderAccAddLists();
        }
    }

    function deselectAccItem(no, voyage) {
        accManualSelected = accManualSelected.filter(s => !(String(s.no) === String(no) && s._voyage === voyage));
        renderAccAddLists();
    }

    function confirmAccAdd() {
        if(accManualSelected.length === 0) return customAlert("未選擇任何名單", "warning");

        let addedCount = 0;
        accManualSelected.forEach(item => {
            let g = item._voyage;
            if(!accReportData[g]) {
                accReportData[g] = { headers: item._headers, data: [] };
            }
            if(!accReportData[g].data.find(existing => String(existing.no) === String(item.no))) {
                accReportData[g].data.push(item);
                addedCount++;
            }
        });

        closeAccAddModal();
        if(addedCount > 0) {
            customAlert(`SUCCESS: ADDED ${addedCount} ITEMS`, "success");
            renderAccountingTable();
        } else {
            customAlert("所選名單皆已存在", "info");
        }
    }

    function renderAccountingTable() {
        const thead = document.getElementById('acc-list-head');
        const tbody = document.getElementById('acc-list-body');
        
        let colsToRender = [...accDefaultCols, ...accExtraCols];
        
        // 渲染表頭
        let headHtml = "<tr>";
        colsToRender.forEach(c => {
            let widthStr = "";
            if (c === "NO.") widthStr = "width: 65px; position: sticky; left: 0; z-index: 20;";
            else if (c === "旅客姓名") widthStr = "width: 120px;";
            else if (c === "房型") widthStr = "width: 250px;";
            else widthStr = "min-width: 90px;";
            headHtml += `<th style="${widthStr}">${c}</th>`;
        });
        headHtml += "</tr>";
        thead.innerHTML = headHtml;

        tbody.innerHTML = "";
        let groups = Object.keys(accReportData).sort();
        
        if (groups.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${colsToRender.length}" style="text-align:center; padding: 50px; color:var(--text-light);">查無資料</td></tr>`;
            return;
        }

        groups.forEach(g => {
            let groupObj = accReportData[g];
            // 確保資料以 NO 排序
            groupObj.data.sort((a,b) => String(a.no||"").localeCompare(String(b.no||""), undefined, {numeric: true}));
            
            // 航程分界標題行 (群組管理的藍色 #1E3A8A)
            tbody.innerHTML += `<tr><td colspan="${colsToRender.length}" style="background:#1E3A8A; color:var(--white); font-weight:600; font-size:14px; padding:10px 15px; letter-spacing:0.1em;">航程代碼：${g}</td></tr>`;
            
            let groupTotalSetPay = 0;

            groupObj.data.forEach(item => {
                let trHtml = "<tr>";
                colsToRender.forEach((c, idx) => {
                    let val = getAccVal(item, groupObj.headers, c);
                    let displayVal = val;
                    // 針對數字金額欄位給予正確樣式
                    if (["SF船費", "JGD", "AGTD", "佣金", "港務費", "小費", "國際旅客稅", "下鋪指定A", "下鋪指定B", "免治馬桶", "房型升等", "SET應付", "名義變更金額"].includes(c)) {
                        displayVal = fmtNum(val);
                        if (c === "SET應付") {
                            groupTotalSetPay += pNum(val);
                            trHtml += `<td style="text-align: right; color:var(--danger); font-weight:700;">${displayVal}</td>`;
                        } else {
                            trHtml += `<td style="text-align: right;">${displayVal}</td>`;
                        }
                    } else if (c === "NO.") {
                        trHtml += `<td style="position: sticky; left: 0; background: var(--white); z-index: 10; text-align: center; font-weight: 600;">${displayVal}</td>`;
                    } else {
                        trHtml += `<td>${displayVal}</td>`;
                    }
                });
                trHtml += "</tr>";
                tbody.innerHTML += trHtml;
            });

            // 總計行
            let subtotalHtml = `<tr style="background:#FDF8EE;">`;
            colsToRender.forEach(c => {
                if (c === "NO.") {
                    subtotalHtml += `<td style="position: sticky; left: 0; background: #FDF8EE; z-index: 10; text-align: center; font-weight: 700; color:var(--primary);">小計</td>`;
                } else if (c === "SET應付") {
                    subtotalHtml += `<td style="text-align: right; font-weight: 700; font-size:14px; color:var(--danger); border-top: 2px solid var(--gold);">${fmtNum(groupTotalSetPay)}</td>`;
                } else {
                    subtotalHtml += `<td></td>`;
                }
            });
            subtotalHtml += `</tr>`;
            tbody.innerHTML += subtotalHtml;
        });
    }

    function openAccExportModal() {
        const list = document.getElementById('acc-export-col-list');
        list.innerHTML = "";
        
        let sortedCols = Array.from(accAllPossibleCols).sort();
        if (sortedCols.length === 0) {
            list.innerHTML = '<div style="grid-column: span 3; text-align:center; color:var(--text-light);">請先產生報表或載入名單後再設定。</div>';
        } else {
            sortedCols.forEach(col => {
                if (!accDefaultCols.includes(col)) {
                    let isChecked = accExtraCols.includes(col) ? "checked" : "";
                    list.innerHTML += `<label><input type="checkbox" class="acc-extra-cb" value="${col}" ${isChecked}> ${col}</label>`;
                }
            });
        }
        document.getElementById('acc-export-modal').classList.add('show');
    }

    function applyAccExportCols() {
        accExtraCols = [];
        document.querySelectorAll('.acc-extra-cb:checked').forEach(cb => {
            accExtraCols.push(cb.value);
        });
        document.getElementById('acc-export-modal').classList.remove('show');
        renderAccountingTable(); // 更新畫面上的表頭
    }

    function exportAccountingExcel() {
        let groups = Object.keys(accReportData);
        if (groups.length === 0) return customAlert("查無資料", "warning");
        
        let colsToExport = [...accDefaultCols, ...accExtraCols];
        let exportData = [];
        
        let sDate = document.getElementById('acc-start-date').value || "未指定";
        let eDate = document.getElementById('acc-end-date').value || "未指定";
        
        // 0. 計算全域「總計應付金額」(加總所有航程的小計)
        let grandTotalSetPay = 0;
        groups.forEach(g => {
            accReportData[g].data.forEach(item => {
                grandTotalSetPay += pNum(getAccVal(item, accReportData[g].headers, "SET應付"));
            });
        });

        // 1. 報表日期區間
        exportData.push([{ v: `報表日期區間：${sDate} ~ ${eDate}`, s: { font: { bold: true, sz: 14, name: "微軟正黑體" } } }]);
        
        // 2. 總計應付金額 (新增於日期下方)
        exportData.push([{ v: `總計應付金額：${fmtNum(grandTotalSetPay)}`, s: { font: { bold: true, sz: 14, name: "微軟正黑體", color: { rgb: "9F1239" } } } }]);
        
        exportData.push([]); // 空行
        
        let colWidths = new Array(colsToExport.length).fill(10);
        
        // 輔助函式：建立帶樣式的儲存格
        const createCell = (val, isHeader = false, isMoney = false, bg = null, align = "left") => {
            let cell = { v: val !== undefined && val !== null ? val : "" };
            if (typeof val === 'number') cell.t = 'n';
            else cell.t = 's';
            
            let style = { 
                font: { name: "微軟正黑體", sz: 11 },
                border: { 
                    top: {style:'thin', color:{auto:1}}, 
                    bottom: {style:'thin', color:{auto:1}}, 
                    left: {style:'thin', color:{auto:1}}, 
                    right: {style:'thin', color:{auto:1}} 
                },
                alignment: { vertical: "center", horizontal: align }
            };
            if (isHeader) {
                style.font.bold = true;
                style.fill = { fgColor: { rgb: bg || "E2E8F0" } };
                style.alignment.horizontal = "center";
            }
            if (bg && !isHeader) {
                style.fill = { fgColor: { rgb: bg } };
            }
            if (isMoney) {
                style.numFmt = "#,##0";
                style.alignment.horizontal = "right";
            }
            cell.s = style;
            return cell;
        };

        // 追蹤目前的行數以設定合併儲存格
        let currentRowIndex = 3; // Date, Grand Total, Empty Line = 3 rows
        let merges = [];
        let maxColIdx = colsToExport.length > 0 ? colsToExport.length - 1 : 10;
        
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: maxColIdx } }); // 日期區間合併
        merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: maxColIdx } }); // 總計金額合併

        groups.sort().forEach(g => {
            let groupObj = accReportData[g];
            
            // 計算此航程總計
            let groupTotalSetPay = 0;
            groupObj.data.forEach(item => {
                groupTotalSetPay += pNum(getAccVal(item, groupObj.headers, "SET應付"));
            });

            // 行 A: 航程代碼
            let titleRow = new Array(colsToExport.length).fill(createCell("", true, false, "1E3A8A"));
            titleRow[0] = createCell(`航程代碼：${g}`, true, false, "1E3A8A", "left");
            titleRow[0].s.font.color = { rgb: "FFFFFF" };
            exportData.push(titleRow);
            merges.push({ s: { r: currentRowIndex, c: 0 }, e: { r: currentRowIndex, c: maxColIdx } });
            currentRowIndex++;

            // 行 B: 航程小計 (新增一列置於航程代碼正下方)
            let subTitleRow = new Array(colsToExport.length).fill(createCell("", true, false, "1E3A8A"));
            subTitleRow[0] = createCell(`航程小計：${fmtNum(groupTotalSetPay)}`, true, false, "1E3A8A", "left");
            subTitleRow[0].s.font.color = { rgb: "FFFFFF" };
            exportData.push(subTitleRow);
            merges.push({ s: { r: currentRowIndex, c: 0 }, e: { r: currentRowIndex, c: maxColIdx } });
            currentRowIndex++;

            // 行 C: 每一個航程獨立表頭
            let headerRow = colsToExport.map(c => createCell(c, true, false, "1C3A5A"));
            headerRow.forEach(c => c.s.font.color = { rgb: "FFFFFF" });
            exportData.push(headerRow);
            currentRowIndex++;
            
            // 更新欄寬計算基準
            colsToExport.forEach((c, i) => { 
                colWidths[i] = Math.max(colWidths[i], c.length * 2 + 2); 
            });

            // 資料列
            groupObj.data.forEach(item => {
                let row = colsToExport.map((c, i) => {
                    let val = getAccVal(item, groupObj.headers, c);
                    let isMoney = ["SF船費", "JGD", "AGTD", "佣金", "港務費", "小費", "國際旅客稅", "下鋪指定A", "下鋪指定B", "免治馬桶", "房型升等", "SET應付", "名義變更金額"].includes(c);
                    let strVal = val === null || val === undefined ? "" : String(val);
                    if(isMoney) val = pNum(val);
                    
                    colWidths[i] = Math.max(colWidths[i], strVal.length * 2 + 2);
                    let bg = c === "NO." ? "F8FAFC" : null;
                    return createCell(val, false, isMoney, bg, isMoney ? "right" : (c === "NO." ? "center" : "left"));
                });
                exportData.push(row);
                currentRowIndex++;
            });

            // 表尾的單團小計列 (保留對齊明細的作用)
            let subtotalRow = new Array(colsToExport.length).fill(createCell("", true, false, "FDF8EE"));
            let idxNo = colsToExport.indexOf("NO.");
            if(idxNo > -1) {
                subtotalRow[idxNo] = createCell("小計", true, false, "FDF8EE", "center");
                subtotalRow[idxNo].s.font.color = { rgb: "0B2038" };
            }
            let idxSetPay = colsToExport.indexOf("SET應付");
            if(idxSetPay > -1) {
                subtotalRow[idxSetPay] = createCell(groupTotalSetPay, true, true, "FDF8EE", "right");
                subtotalRow[idxSetPay].s.font.color = { rgb: "9F1239" };
            }
            exportData.push(subtotalRow);
            currentRowIndex++;
            
            // 區隔空白行
            exportData.push([]); 
            currentRowIndex++;
        });

        let wb = XLSX.utils.book_new();
        let ws = XLSX.utils.aoa_to_sheet(exportData);
        
        // 限制最大寬度避免過度延展
        ws['!cols'] = colWidths.map(w => ({ wch: Math.min(w, 50) })); 
        // 寫入合併設定
        ws['!merges'] = merges;

        XLSX.utils.book_append_sheet(wb, ws, "帳款查詢報表");
        
        let dateSuffix = sDate === "未指定" && eDate === "未指定" ? "手動加入清單" : `${sDate.replace(/-/g, '')}-${eDate.replace(/-/g, '')}`;
        XLSX.writeFile(wb, `帳款查詢報表_${dateSuffix}.xlsx`);
    }

    function renderLogsUI(data) {
        if (!data) data = window.globalLogCache || [];
        window.globalLogCache = data; 
        
        let kw = document.getElementById('log-search-kw').value.trim().toLowerCase();
        let startDateVal = document.getElementById('log-start-date').value;
        let endDateVal = document.getElementById('log-end-date').value;
        
        let startTimestamp = startDateVal ? new Date(startDateVal.replace(/-/g, '/') + " 00:00:00").getTime() : 0;
        let endTimestamp = endDateVal ? new Date(endDateVal.replace(/-/g, '/') + " 23:59:59").getTime() : Infinity;

        let filteredData = data.filter(log => {
            let logTimeStr = String(log.time); let logTimestamp = new Date(logTimeStr.replace(/-/g, '/')).getTime();
            if (isNaN(logTimestamp)) { let m = logTimeStr.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/); if (m) logTimestamp = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])).getTime(); }
            
            let timeOk = (isNaN(logTimestamp) ? true : (logTimestamp >= startTimestamp && logTimestamp <= endTimestamp));
            let kwOk = true;
            if (kw) {
                let target = String(log.target || "").toLowerCase();
                let details = String(log.details || "").toLowerCase();
                kwOk = target.includes(kw) || details.includes(kw);
            }
            return timeOk && kwOk;
        });

        const container = document.getElementById('logs-view-container');
        container.innerHTML = "";

        if(filteredData.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:80px; color:var(--text-light); font-weight:500;">查無資料</div>';
            return;
        }

        if (kw) {
            let html = '<div class="timeline-wrapper">';
            filteredData.forEach((log) => {
                let dStr = log.time.split(' ')[0] || log.time;
                let tStr = log.time.split(' ')[1] || '';
                
                let displayDetails = formatLogContentForDisplay(log.details);
                let safeDetails = displayDetails.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                
                html += `
                <div class="timeline-item">
                    <div class="timeline-time">${dStr}<br><span style="font-weight:600; color:var(--primary); font-size:14px;">${tStr}</span></div>
                    <div class="timeline-node"><div class="timeline-dot"></div></div>
                    <div class="timeline-content">
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                            <span style="font-weight:700; color:var(--primary); font-size:14px; border-left:4px solid var(--gold); padding-left:8px;">${log.action}</span>
                            <span style="font-size:11px; color:var(--text-light); background:var(--sys-bg); padding:4px 10px; border-radius:12px;">操作員: ${log.operator}</span>
                        </div>
                        <div style="font-size:13px; color:var(--accent); font-weight:600; margin-bottom:12px; display:inline-block; padding: 4px 8px; background: rgba(13, 148, 136, 0.05); border-radius: 4px;">影響對象：${log.target || '-'}</div>
                        <pre style="margin:0; font-family:inherit; font-size:12px; color:var(--text-main); white-space:pre-wrap; line-height:1.6; background:#F8FAFC; padding:15px; border-radius:6px; border:1px solid #E2E8F0;">${safeDetails}</pre>
                    </div>
                </div>`;
            });
            html += '</div>';
            container.innerHTML = html;
        } 
        else {
            let html = `<div class="table-wrapper" style="box-shadow:none;">
                <table>
                    <thead>
                        <tr>
                            <th class="log-time">時間</th>
                            <th class="log-op">操作人</th>
                            <th class="log-target">影響對象 (NO/ID/代號)</th>
                            <th class="log-action">動作類型</th>
                            <th>詳細內容</th>
                        </tr>
                    </thead>
                    <tbody>`;
            filteredData.forEach((log) => {
                let cleanText = formatLogContentForDisplay(log.details);
                let summary = cleanText.replace(/\n/g, ' ｜ ');
                let idx = data.indexOf(log);
                let detailHTML = `<td class="log-detail"><div class="log-row-container"><div class="log-summary" title="${summary.replace(/"/g, '&quot;')}">${summary}</div><div class="log-detail-link" onclick="showLogDetailsCache(${idx})">[查看明細]</div></div></td>`;
                html += `<tr><td class="log-time">${log.time}</td><td class="log-op">${log.operator}</td><td class="log-target">${log.target || '-'}</td><td class="log-action">${log.action}</td>${detailHTML}</tr>`;
            });
            html += `</tbody></table></div>`;
            container.innerHTML = html;
        }
    }

    function showLogDetailsCache(index) { 
        if(window.globalLogCache[index]) showLogDetails(window.globalLogCache[index].details); 
    }

    function loadLogs(forceRefresh = false) {
        if (!forceRefresh && !isLogsDirty && cachedLogs) { renderLogsUI(cachedLogs); return; }
        document.getElementById('logs-view-container').innerHTML = '<div style="text-align:center; padding:80px; font-weight:600; letter-spacing:0.2em; color:var(--primary);">LOADING...</div>';
        fetch(gasURL + "?action=getLogs&t=" + new Date().getTime()).then(res => res.json()).then(res => { 
            if(res.status === 'success') { 
                cachedLogs = res.data; 
                isLogsDirty = false; 
                renderLogsUI(cachedLogs); 
            } 
        });
    }

    function exportLogs() {
        if (!window.globalLogCache || window.globalLogCache.length === 0) return customAlert("查無資料", "warning");
        let startDateVal = document.getElementById('log-start-date').value; let endDateVal = document.getElementById('log-end-date').value;
        let startTimestamp = startDateVal ? new Date(startDateVal.replace(/-/g, '/') + " 00:00:00").getTime() : 0;
        let endTimestamp = endDateVal ? new Date(endDateVal.replace(/-/g, '/') + " 23:59:59").getTime() : Infinity;

        if (startDateVal && endDateVal && startTimestamp > endTimestamp) return customAlert("開始日期不能大於結束日期", "warning");

        let filteredLogs = window.globalLogCache.filter(log => {
            let logTimeStr = String(log.time); let logTimestamp = new Date(logTimeStr).getTime();
            if (isNaN(logTimestamp)) logTimestamp = new Date(logTimeStr.replace(/-/g, '/')).getTime();
            if (isNaN(logTimestamp)) { let m = logTimeStr.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/); if (m) logTimestamp = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])).getTime(); }
            if (isNaN(logTimestamp)) return (!startDateVal && !endDateVal);
            return logTimestamp >= startTimestamp && logTimestamp <= endTimestamp;
        });

        if (filteredLogs.length === 0) return customAlert("查無資料", "warning");
        let exportData = [["時間", "操作人", "影響對象 (NO/ID/代號)", "動作類型", "詳細內容"]];
        filteredLogs.forEach(log => { 
            let cleanDetails = formatLogContentForDisplay(log.details);
            exportData.push([log.time || "", log.operator || "", log.target || "", log.action || "", cleanDetails]); 
        });

        let wb = XLSX.utils.book_new(); let ws = XLSX.utils.aoa_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "歷史紀錄");
        let dateSuffix = (startDateVal && endDateVal) ? `(${startDateVal}至${endDateVal})` : (startDateVal ? `(${startDateVal}起)` : (endDateVal ? `(至${endDateVal})` : "全部"));
        XLSX.writeFile(wb, `系統歷史紀錄_${dateSuffix}.xlsx`);
    }
