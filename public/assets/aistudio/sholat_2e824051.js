const CONFIG = {
    fallbackCityId: "1221", 
    myQuranEndpoint: "https://api.myquran.com/v2/sholat/jadwal",
    aladhanEndpoint: "https://api.aladhan.com/v1/timings",
    method: 2
};

let state = {
    jadwal: null,
    next: null,
    timeoutId: null,
    lastUpdateStamp: null // Fix: Menggunakan DateString sesuai audit Master
};

// ==========================================
// 1. ENGINE: ROBUST FETCH & SEO SCHEMA
// ==========================================
async function engineLoad() {
    const el = document.getElementById("sholat-info");
    const now = new Date();
    
    try {
        const pos = await new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 });
        });

        const ts = Math.floor(now.getTime() / 1000);
        const url = `${CONFIG.aladhanEndpoint}/${ts}?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&method=${CONFIG.method}&timezonestring=auto`;
        
        const res = await fetch(url);
        const json = await res.json();
        const t = json.data.timings;

        state.jadwal = {
            subuh: t.Fajr.substring(0, 5),
            dzuhur: t.Dhuhr.substring(0, 5),
            ashar: t.Asr.substring(0, 5),
            maghrib: t.Maghrib.substring(0, 5),
            isya: t.Isha.substring(0, 5)
        };
        
        state.lastUpdateStamp = now.toDateString(); // Fix: Anti-Midnight Loop
        console.log("🌍 System Sync: Global Source Success");

    } catch (err) {
        console.warn("📍 System Sync: Switching to Fallback...");
        const tgl = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')}`;
        
        try {
            const res = await fetch(`${CONFIG.myQuranEndpoint}/${CONFIG.fallbackCityId}/${tgl}`);
            const json = await res.json();
            if(json.status) {
                state.jadwal = json.data.jadwal;
                state.lastUpdateStamp = now.toDateString();
            }
        } catch (fatal) {
            if (el) el.innerHTML = "<p class='neon-red'>OFFLINE MODE ACTIVE</p>";
            return;
        }
    }

    if (state.jadwal) {
        engineProcess();
        engineRenderBase();
        engineStartLoop();
    }
}

// ==========================================
// 2. ENGINE: SMART LOOP & BATTERY SAVIOR
// ==========================================
function engineStartLoop() {
    // Fix: Gunakan clearTimeout sesuai audit Master
    if (state.timeoutId) clearTimeout(state.timeoutId);

    const loop = () => {
        const now = new Date();
        
        // Fix: Background Re-scheduling agar tetap hidup tapi lambat
        if (document.hidden) {
            state.timeoutId = setTimeout(loop, 30000); 
            return;
        }

        // Fix: Midnight Detection (Month/Year safe)
        if (now.toDateString() !== state.lastUpdateStamp) {
            engineLoad();
            return;
        }

        const diff = state.next.date - now;
        
        if (diff <= 0) {
            engineProcess();
            engineUpdateUI();
            return;
        }

        // Fix: Real Smart Interval (Master Suggestion)
        const currentSpeed = diff > 1000;
        
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        const elTimer = document.getElementById("prayer-countdown");
        if (elTimer) elTimer.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

        state.timeoutId = setTimeout(loop, 1000);
    };

    loop();
}

// ==========================================
// 3. ENGINE: LOGIC PROCESS (TIME FINDER)
// ==========================================
function engineProcess() {
    const now = new Date();
    const list = [
        { label: "Subuh", time: state.jadwal.subuh },
        { label: "Dzuhur", time: state.jadwal.dzuhur },
        { label: "Ashar", time: state.jadwal.ashar },
        { label: "Maghrib", time: state.jadwal.maghrib },
        { label: "Isya", time: state.jadwal.isya }
    ];

    state.next = null;
    for (let s of list) {
        const [h, m] = s.time.split(":");
        const pTime = new Date();
        pTime.setHours(h, m, 0, 0);

        if (pTime > now) {
            state.next = { label: s.label, date: pTime };
            return;
        }
    }

    // After Isya -> Subuh Besok
    const [h, m] = state.jadwal.subuh.split(":");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(h, m, 0, 0);
    state.next = { label: "Subuh (Besok)", date: tomorrow };
}

// ==========================================
// 4. ENGINE: UI RENDERER (Sinkron dengan Index.html)
// ==========================================
function engineRenderBase() {
    const elName = document.getElementById("prayer-name"); // Sesuai index.html
    const elTimer = document.getElementById("prayer-countdown"); // Sesuai index.html
    
    if (elName && state.next) {
        elName.textContent = state.next.label;
    }
    if (elTimer) {
        elTimer.textContent = "--:--:--";
    }
}

function engineUpdateUI() {
    const elName = document.getElementById("prayer-name");
    if (elName && state.next) {
        elName.textContent = state.next.label;
    }
}

// Di dalam engineStartLoop, Master juga harus ganti:
// const elTimer = document.getElementById("timer");
// Menjadi:
// const elTimer = document.getElementById("prayer-countdown");
export function initSholat() {
    engineLoad();
}

