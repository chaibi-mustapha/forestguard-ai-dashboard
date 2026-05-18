/* ============================================
   UI Manager — Gauge, Alerts, DOM Updates
   ============================================ */
window.UIManager = {
    /**
     * Draw the risk gauge on canvas
     */
    drawGauge(score, color) {
        const canvas = document.getElementById('risk-gauge');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h - 10;
        const radius = Math.min(cx, cy) - 15;

        ctx.clearRect(0, 0, w, h);

        const startAngle = Math.PI;
        const endAngle = 2 * Math.PI;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.lineWidth = 18;
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineCap = 'round';
        ctx.stroke();

        const segments = [
            { start: 0, end: 0.3, color: '#10B981' },
            { start: 0.3, end: 0.6, color: '#F59E0B' },
            { start: 0.6, end: 0.8, color: '#EF4444' },
            { start: 0.8, end: 1.0, color: '#DC2626' }
        ];

        segments.forEach(seg => {
            const sA = startAngle + seg.start * Math.PI;
            const eA = startAngle + seg.end * Math.PI;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, sA, eA);
            ctx.lineWidth = 18;
            ctx.strokeStyle = seg.color + '30';
            ctx.lineCap = 'butt';
            ctx.stroke();
        });

        const progress = Math.min(1, score / 100);
        const activeEnd = startAngle + progress * Math.PI;

        const gradient = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
        gradient.addColorStop(0, '#10B981');
        gradient.addColorStop(0.4, '#F59E0B');
        gradient.addColorStop(0.7, '#EF4444');
        gradient.addColorStop(1, '#DC2626');

        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, activeEnd);
        ctx.lineWidth = 18;
        ctx.strokeStyle = gradient;
        ctx.lineCap = 'round';
        ctx.stroke();

        const needleAngle = startAngle + progress * Math.PI;
        const nx = cx + radius * Math.cos(needleAngle);
        const ny = cy + radius * Math.sin(needleAngle);

        ctx.beginPath();
        ctx.arc(nx, ny, 6, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        for (let i = 0; i <= 10; i++) {
            const angle = startAngle + (i / 10) * Math.PI;
            const innerR = radius - 26;
            const outerR = radius - 22;
            ctx.beginPath();
            ctx.moveTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
            ctx.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.font = '9px Inter';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'center';
        ctx.fillText('0', cx - radius + 5, cy + 15);
        ctx.fillText('50', cx, cy - radius + 30);
        ctx.fillText('100', cx + radius - 5, cy + 15);
    },

    updateRiskDisplay(result) {
        const scoreEl = document.getElementById('risk-score-value');
        const labelEl = document.getElementById('risk-score-label');
        if (scoreEl) { scoreEl.textContent = result.score; scoreEl.style.color = result.color; }
        if (labelEl) labelEl.textContent = result.label;
        this.drawGauge(result.score, result.color);
    },

    updateRiskBars(sensorData, aiConfidence) {
        const windPct = Math.min(100, (sensorData.windSpeed / 50) * 100);
        const tempPct = Math.min(100, ((sensorData.temperature - 10) / 35) * 100);
        const humPct = sensorData.humidity;
        const aiPct = aiConfidence || 0;

        const animateBar = (id, pct) => { const el = document.getElementById(id); if (el) el.style.width = pct + '%'; };
        animateBar('ri-wind', windPct); animateBar('ri-temp', tempPct); animateBar('ri-hum', humPct); animateBar('ri-ai', aiPct);

        const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
        setText('ri-wind-val', `${sensorData.windSpeed} km/h ${sensorData.windDir}`);
        setText('ri-temp-val', `${sensorData.temperature}°C`);
        setText('ri-hum-val', `${sensorData.humidity}%`);
        setText('ri-ai-val', aiConfidence > 0 ? `${aiConfidence}%` : '—');
    },

    updateSensors(data) {
        const setText = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
        setText('s-wind', `${data.windSpeed} km/h`);
        setText('s-wind-dir', `Direction : ${data.windDir}`);
        setText('s-temp', `${data.temperature}°C`);
        setText('s-temp-trend', data.tempTrend);
        setText('s-humidity', `${data.humidity}%`);
        setText('s-hum-trend', data.humTrend);
        setText('s-air', data.airQuality);
        setText('s-air-aqi', `AQI: ${data.aqi}`);
        setText('s-battery', `${data.battery}%`);
        setText('s-signal', data.signalStrength);

        // Update the camera view wind overlay to match the active sensor data perfectly!
        setText('cam-wind', `Wind: ${data.windDir} ${data.windSpeed} km/h`);
    },

    setAlertStatus(level, title, description, showAction) {
        const bar = document.getElementById('alert-status-bar');
        const icon = document.getElementById('alert-status-icon');
        const titleEl = document.getElementById('alert-status-title');
        const descEl = document.getElementById('alert-status-desc');
        const actionEl = document.getElementById('alert-status-action');

        if (bar) bar.className = 'alert-status-bar ' + level;
        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = description;
        if (icon) icon.textContent = (level === 'danger' ? '🔥' : (level === 'warning' ? '⚠️' : '✅'));
        if (actionEl) actionEl.style.display = showAction ? 'block' : 'none';
    },

    showAlertBanner(text) {
        const msg = document.getElementById('header-alert-msg');
        const textEl = document.getElementById('header-alert-text');
        const statusInd = document.getElementById('system-status');
        if (msg) { msg.style.display = 'flex'; if (textEl) textEl.textContent = text; }
        if (statusInd) statusInd.style.display = 'none';
    },

    hideAlertBanner() {
        const msg = document.getElementById('header-alert-msg');
        const statusInd = document.getElementById('system-status');
        if (msg) msg.style.display = 'none';
        if (statusInd) statusInd.style.display = 'flex';
    },

    addLogEntry(time, event, location, details, type = 'info') {
        const tbody = document.getElementById('event-log-body');
        if (!tbody) return;
        const row = document.createElement('tr');
        row.className = `log-${type}`;
        row.innerHTML = `<td>${time}</td><td>${event}</td><td>${location}</td><td>${details}</td>`;
        tbody.insertBefore(row, tbody.firstChild);
        while (tbody.children.length > 50) { tbody.removeChild(tbody.lastChild); }
    },

    displayGemmaResult(response) {
        const panel = document.getElementById('gemma-output');
        if (!panel) return;
        panel.innerHTML = '';

        if (!response || !response.success || !response.data) {
            panel.innerHTML = `
                <div class="gemma-empty-state">
                    <div class="gemma-brain-icon error">⚠️</div>
                    <p>Analysis Error</p>
                    <small style="display:block;margin-bottom:12px;max-height:80px;overflow-y:auto;padding:0 5px;">${(response && response.error) || 'Malformed data'}</small>
                    <button class="btn btn-sm" id="btn-retry-analysis" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:5px 12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:var(--text-primary);border-radius:4px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'" onclick="if(window.handleAnalyze){window.handleAnalyze()}">
                        🔄 Retry Analysis
                    </button>
                </div>`;
            return;
        }

        const d = response.data;
        let sourceLabel = '🧠 Gemma 4 (Edge AI)';
        if (response.source === 'huggingface') sourceLabel = '🧠 Gemma 4 (HF)';
        
        const severityMap = { 'none': 'tag-safe', 'low': 'tag-safe', 'medium': 'tag-warning', 'high': 'tag-fire', 'critical': 'tag-fire' };
        const tag = severityMap[d.severity] || 'tag-safe';

        panel.innerHTML = `
            <div class="gemma-result">
                <div class="result-header">
                    <span class="result-tag ${tag}">${d.severity?.toUpperCase() || 'NORMAL'}</span>
                    <span style="font-size:9px;color:var(--text-muted);margin-left:auto">${sourceLabel}</span>
                </div>
                <div class="result-line"><span class="rl-label">Fire Detected</span><span class="rl-value" style="color:${d.fire_detected ? 'var(--accent-danger)' : 'var(--accent-safe)'}">${d.fire_detected ? '🔥 YES' : '✅ NO'}</span></div>
                <div class="result-line"><span class="rl-label">Confidence</span><span class="rl-value">${d.confidence ? (d.confidence * 100).toFixed(1) + '%' : '—'}</span></div>
                <div class="gemma-explanation"><strong>🧠 AI Analysis:</strong><br>${d.explanation || 'No explanation available.'}</div>
                ${d.recommended_action ? `<div class="gemma-explanation" style="border-left-color:var(--accent-fire);margin-top:8px;background:rgba(255,107,53,0.05)"><strong>📋 Recommended Action:</strong><br>${d.recommended_action}</div>` : ''}
            </div>
        `;
    },

    showGemmaLoading() {
        const output = document.getElementById('gemma-output');
        if (!output) return;
        output.innerHTML = `<div class="gemma-placeholder"><div class="gemma-icon-big" style="animation:spin 1.5s linear infinite">🧠</div><p>Analysis in progress by Gemma 4 AI...</p><p class="gemma-sub">Processing image and sensor data</p></div><style>@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }</style>`;
    },

    updateDateTime() {
        const el = document.getElementById('datetime-display');
        if (!el) return;
        const now = new Date();
        el.querySelector('.time').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        el.querySelector('.date').textContent = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    updateCamTimestamp() {
        const el = document.getElementById('cam-timestamp');
        if (el) el.textContent = new Date().toLocaleTimeString('en-US');
    },

    buildNetworkGrid(stations) {
        const grid = document.getElementById('network-grid');
        if (!grid) return;
        grid.innerHTML = '';
        stations.forEach(s => {
            const node = document.createElement('div');
            node.className = `net-node ${s.status}`;
            node.innerHTML = `<div class="net-dot"></div><span class="net-label">${s.id}</span>`;
            node.addEventListener('click', () => { if (typeof window.handleStationClick === 'function') window.handleStationClick(s.id); });
            grid.appendChild(node);
        });
    },

    setCamFireDetection(isVisible) {
        const badge = document.getElementById('cam-detection-badge');
        const camImage = document.getElementById('cam-image');
        const isImageVisible = camImage && camImage.style.display !== 'none' && camImage.src.length > 5;
        if (badge) badge.style.display = (isVisible && isImageVisible) ? 'flex' : 'none';
    },

    setAlertMode(active) {
        ['panel-cam', 'panel-risk'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { if (active) el.classList.add('alert-active'); else el.classList.remove('alert-active'); }
        });
        const statusInd = document.getElementById('system-status');
        const dot = statusInd?.querySelector('.pulse-dot');
        const statusText = statusInd?.querySelector('.status-text');
        if (active) {
            statusInd?.classList.add('danger'); dot?.classList.add('danger');
            if (statusText) { statusText.textContent = '⚠️ ACTIVE ALERT'; statusText.style.color = 'var(--accent-danger)'; }
        } else {
            statusInd?.classList.remove('danger'); dot?.classList.remove('danger');
            if (statusText) { statusText.textContent = 'SYSTEM ACTIVE'; statusText.style.color = ''; }
        }

        // Keep header alert counter perfectly synchronized!
        const alertCountEl = document.getElementById('alerts-count');
        if (alertCountEl) {
            alertCountEl.textContent = active ? '1' : '0';
        }
    },

    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const journalActions = document.getElementById('journal-actions');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const panel = btn.closest('.panel');
                panel.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                const target = document.getElementById(tabId);
                if (target) target.classList.add('active');
                if (journalActions) journalActions.style.display = tabId === 'tab-journal' ? 'flex' : 'none';
            });
        });
    },

    initDemoModal() {
        const demoModal = document.getElementById('demo-modal');
        const btnDemoMode = document.getElementById('btn-demo-mode');
        const demoClose = document.getElementById('demo-close');
        if (btnDemoMode && demoModal) {
            btnDemoMode.addEventListener('click', () => {
                demoModal.style.display = 'flex';
                if (typeof window.refreshDemoGrid === 'function') window.refreshDemoGrid();
            });
        }
        if (demoClose && demoModal) demoClose.addEventListener('click', () => { demoModal.style.display = 'none'; });
        if (demoModal) demoModal.addEventListener('click', (e) => { if (e.target === demoModal) demoModal.style.display = 'none'; });

        document.querySelectorAll('.demo-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-demo-tab');
                btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const modalBody = btn.closest('.modal').querySelector('.modal-body');
                modalBody.querySelectorAll('.demo-tab-content').forEach(content => { content.classList.remove('active'); content.style.display = 'none'; });
                const target = document.getElementById(tabId);
                if (target) { target.classList.add('active'); target.style.display = 'block'; }
            });
        });
        
        ['wind', 'temp', 'hum'].forEach(s => {
            const slider = document.getElementById(`demo-slider-${s}`);
            const valSpan = document.getElementById(`demo-val-${s}`);
            if (slider && valSpan) slider.addEventListener('input', (e) => valSpan.textContent = e.target.value);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UIManager.initTabs();
    UIManager.initDemoModal();
});
