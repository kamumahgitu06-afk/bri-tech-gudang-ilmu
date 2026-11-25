import { initSholat } from "../features/sholat.js";

document.addEventListener("DOMContentLoaded", async () => {

    /* --- 1. UTILITIES & GLOBAL VARS --- */
    const $ = (s, scope = document) => scope.querySelector(s);
    const $$ = (s, scope = document) => scope.querySelectorAll(s);
    
    let allMateri = [];
    let filteredMateri = [];
    let currentPage = 1;
    const itemsPerPage = 5;

    const debounce = (fn, delay = 200) => {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), delay);
        };
    };

    /* --- 2. ENGINE GUDANG ILMU (DENGAN PAGINATION & SKELETON) --- */
    const loadMateri = async () => {
        const container = $("#materiList");
        if (!container) return;

        // Tampilkan Skeleton UI saat loading
        container.innerHTML = `<div class="skeleton"></div><div class="skeleton"></div>`;

        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Animasi biar terasa
            const res = await fetch("assets/data/materi.json");
            allMateri = await res.json();
            filteredMateri = allMateri;
            renderPage();
        } catch (err) {
            container.innerHTML = "<p>Gagal memuat materi.</p>";
            console.error(err);
        }
    };

    window.renderPage = () => {
        const container = $("#materiList");
        if (!container) return;

        container.innerHTML = "";
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = filteredMateri.slice(start, end);

        if (pageItems.length === 0) {
            container.innerHTML = "<p class='muted'>Materi tidak ditemukan...</p>";
        } else {
            container.innerHTML = pageItems.map(item => {
                const levelDot =
                    item.level === "Beginner" ? "🟢" :
                    item.level === "Intermediate" ? "🔵" : "🔴";

                return `
                <div class="card" data-level="${item.level}">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span class="badge-cat">${item.category || 'General'}</span>
                        <span>${levelDot}</span>
                    </div>
                    <h3>${item.title}</h3>
                    <p class="muted">${item.desc || "Klik untuk membaca materi..."}</p>
                    <div class="tag-list" style="margin: 10px 0;">
                        ${item.tags ? item.tags.map(tag => `<span class="tag">#${tag}</span>`).join(" ") : ""}
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="reading-time">⏱️ ${item.reading_time || '0'} min</span>
                        <a href="${item.path}" class="read-more">Baca →</a>
                    </div>
                </div>
                `;
            }).join("");
        }
        renderPagination();
    };

    const renderPagination = () => {
        const nav = $("#paginationNav");
        if (!nav) return;

        const totalPages = Math.ceil(filteredMateri.length / itemsPerPage);
        nav.innerHTML = "";
        
        for (let i = 1; i <= totalPages; i++) {
            nav.innerHTML += `
                <button class="filter-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="changePage(${i})">${i}</button>
            `;
        }
    };

    window.changePage = (page) => {
        currentPage = page;
        renderPage();
        window.scrollTo({ top: $("#materiList").offsetTop - 100, behavior: 'smooth' });
    };

    /* --- 3. COPY FEATURE --- */
    document.addEventListener("click", async (e) => {
        const target = e.target.closest(".cmd-box, code");
        if (!target) return;
        try {
            const text = target.innerText.trim();
            await navigator.clipboard.writeText(text);
            const original = target.innerText;
            target.innerText = "✅ Copied!";
            setTimeout(() => (target.innerText = original), 800);
        } catch (err) { console.error(err); }
    });

    /* --- 4. THEME TOGGLE --- */
    const btnTheme = $("#theme-toggle");
    if (localStorage.getItem("theme") === "light") document.body.classList.add("light-mode");
    if (btnTheme) {
        const updateLabel = () => {
            btnTheme.textContent = document.body.classList.contains("light-mode") ? "☀️ Siang" : "🌙 Malam";
        };
        updateLabel();
        btnTheme.addEventListener("click", () => {
            document.body.classList.toggle("light-mode");
            localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
            updateLabel();
        });
    }

    /* --- 5. SMART SEARCH (UPDATE KE ARRAY) --- */
    const inputSearch = $("#searchInput");
    if (inputSearch) {
        inputSearch.addEventListener("input", debounce((e) => {
            const keyword = e.target.value.toLowerCase().trim();
            filteredMateri = allMateri.filter(item => 
                item.title.toLowerCase().includes(keyword) || 
                (item.desc && item.desc.toLowerCase().includes(keyword))
            );
            currentPage = 1;
            renderPage();
        }));
    }

    /* --- 6. PROGRESS BAR --- */
    const bar = $("#myBar");
    window.addEventListener("scroll", () => {
        const scrollTop = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const percent = height > 0 ? (scrollTop / height) * 100 : 0;
        if (bar) bar.style.width = percent + "%";
    }, { passive: true });

    /* --- 7. INIT MODULES --- */
    initSholat();
    loadMateri();
});

/* --- 8. GLOBAL FILTER LEVEL --- */
window.filterLevel = (level, btn) => {
    // Kita panggil dari data array, bukan sekadar hide DOM biar Pagination tetap sinkron
    // Tapi karena ini fungsi global, kita butuh akses ke variabel di dalam atau buat filter sederhana
    const cards = document.querySelectorAll(".card[data-level]");
    cards.forEach(card => {
        card.style.display = level === "all" || card.dataset.level === level ? "" : "none";
    });
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
};

