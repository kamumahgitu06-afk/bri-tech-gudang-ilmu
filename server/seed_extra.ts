import type { SeedMateri } from './seed.ts';

export const EXTRA_MATERI: SeedMateri[] = [
  {
    id: 'mat-zsh-ohmyzsh',
    slug: 'zsh-ohmyzsh',
    title: '🎨 Bikin Tampilan Termux Keren & Pintar Pakai Zsh',
    level: 'Beginner',
    category: 'Termux',
    summary:
      'Bosan lihat layar terminal yang kaku dan sepi? Yuk upgrade ke Zsh biar terminal bisa nebak perintah kamu dan tampilannya jauh lebih enak dilihat!',
    reading_time: 6,
    tags: ['zsh', 'ohmyzsh', 'tampilan', 'termux'],
    sections: [
      {
        heading: 'Jujur, Tampilan Itu Ngubah Mood Belajar! ✨',
        paragraphs: [
          'Kadang kita malas buka terminal bukan karena materinya susah, tapi karena tampilannya hitam putih membosankan 😅. Dengan Zsh (Z Shell), terminal kamu jadi jauh lebih hidup: ada warna penanda folder, saran otomatis saat mengetik, dan info cabang Git.',
          'Serius deh, sekali cobain fitur autosuggestions—di mana kamu baru ketik 2 huruf lalu tekan panah kanan langsung lengkap—kamu bakal jatuh cinta dan nggak mau balik lagi!'
        ],
        commands: [
          { label: '📦 Install Zsh di Termux', cmd: 'pkg install zsh git curl -y' },
          { label: '🔄 Jadikan Zsh sebagai shell utama kamu', cmd: 'chsh -s zsh' }
        ]
      },
      {
        heading: 'Pasang Tema & Auto-Saran Biar Ngetik Secepat Kilat ⚡',
        code: {
          language: 'bash',
          caption: 'install-ohmyzsh.sh',
          content: `sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"\ngit clone https://github.com/zsh-users/zsh-autosuggestions \${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions`
        }
      }
    ]
  },
  {
    id: 'mat-termux-api-hw',
    slug: 'termux-api-hardware',
    title: '📸 Termux:API — Akses Baterai, GPS & Notifikasi HP dari Terminal',
    level: 'Intermediate',
    category: 'Termux',
    summary:
      'Ini fitur paling ajaib di HP! Kamu bisa cek persentase baterai, bikin HP bergetar, bahkan memunculkan notifikasi Android langsung lewat skrip Bash.',
    reading_time: 7,
    tags: ['termux-api', 'hardware', 'android', 'notifikasi'],
    sections: [
      {
        heading: 'Saat Kode Kamu Bisa Menyentuh Dunia Nyata 📱',
        paragraphs: [
          'Rasanya puas banget waktu pertama kali lihat HP bergetar atau munculin notifikasi hasil skrip yang kita ketik sendiri 🎉. Untuk melakukannya, pasang aplikasi pendamping Termux:API di HP lalu install paket termux-api di terminal.'
        ],
        table: {
          headers: ['Perintah', 'Apa yang Terjadi?'],
          rows: [
            ['termux-battery-status', '🔋 Membaca level baterai, suhu, dan status charger dalam format JSON'],
            ['termux-vibrate -d 500', '📳 Menggetarkan HP selama setengah detik'],
            ['termux-toast "Halo!"', '💬 Memunculkan pesan singkat melayang di layar Android'],
            ['termux-notification -t "Info" -c "Selesai"', '🔔 Mengirim notifikasi resmi ke bar atas HP kamu']
          ]
        },
        commands: [
          { label: '📦 Install jembatan Termux:API', cmd: 'pkg install termux-api -y' },
          { label: '🔋 Cek kondisi baterai sekarang', cmd: 'termux-battery-status' }
        ]
      }
    ]
  },
  {
    id: 'mat-sqlite-hp',
    slug: 'sqlite-database-hp',
    title: '🗄️ Belajar Database SQLite Langsung dari HP',
    level: 'Intermediate',
    category: 'Termux',
    summary:
      'Nggak perlu server database berat! Kenalan dengan SQLite, database ringan dalam satu file yang dipakai di hampir semua aplikasi smartphone.',
    reading_time: 8,
    tags: ['sqlite', 'database', 'sql', 'data'],
    sections: [
      {
        heading: 'Database Nggak Harus Ribet dan Berat 💡',
        paragraphs: [
          'Dulu banyak pemula menyerah belajar database karena bingung setup servernya. Padahal ada SQLite—seluruh tabel dan datamu disimpan cukup dalam satu file .db biasa! Bahkan aplikasi Bri Tech ini juga memakai SQLite di belakang layar lho 😉.'
        ],
        commands: [
          { label: '📦 Pasang SQLite di Termux', cmd: 'pkg install sqlite -y' },
          { label: '🗄️ Buka atau buat database latihan baru', cmd: 'sqlite3 catatan.db' }
        ]
      },
      {
        heading: 'Contoh Membuat Tabel & Mengisi Data Pertama ✍️',
        code: {
          language: 'sql',
          caption: 'latihan.sql',
          content: `CREATE TABLE tugas (id INTEGER PRIMARY KEY, judul TEXT, selesai INTEGER);\nINSERT INTO tugas (judul, selesai) VALUES ('Belajar Termux', 1), ('Coba API', 0);\nSELECT * FROM tugas;`
        }
      }
    ]
  },
  {
    id: 'mat-zip-tar',
    slug: 'zip-tar-kompresi',
    title: '🗜️ Kompres & Ekstrak File (zip, tar, gzip) Tanpa Aplikasi Lain',
    level: 'Beginner',
    category: 'Termux',
    summary:
      'Sering download file .tar.gz atau mau kirim banyak folder sekaligus biar nggak berat? Kuasai cara membungkus dan membuka arsip langsung di terminal.',
    reading_time: 5,
    tags: ['zip', 'tar', 'kompresi', 'arsip'],
    sections: [
      {
        heading: 'Biar Memori HP Lega & Kirim File Nggak Berantakan 📦',
        paragraphs: [
          'Mengirim 100 file kecil satu per satu itu bikin capek dan sering gagal di tengah jalan 😩. Solusinya bungkus semua jadi satu bundel arsip. Di dunia Linux, selain .zip, kamu bakal sangat sering ketemu format .tar.gz.'
        ],
        table: {
          headers: ['Tugas', 'Perintah'],
          rows: [
            ['Bungkus folder jadi .zip', 'zip -r hasil.zip nama_folder/'],
            ['Buka file .zip', 'unzip hasil.zip'],
            ['Bungkus & kompres jadi .tar.gz', 'tar -czvf backup.tar.gz nama_folder/'],
            ['Ekstrak file .tar.gz', 'tar -xzvf backup.tar.gz']
          ]
        },
        commands: [
          { label: '📦 Install zip & unzip kalau belum ada', cmd: 'pkg install zip unzip -y' },
          { label: '🗜️ Kompres folder proyek jadi satu arsip', cmd: 'tar -czvf proyek.tar.gz ~/projects' }
        ]
      }
    ]
  },
  {
    id: 'mat-grep-find',
    slug: 'grep-find-pencarian',
    title: '🔎 Jurus Cepat Mencari File & Teks Tersembunyi (grep & find)',
    level: 'Intermediate',
    category: 'Termux',
    summary:
      'Lupa nyimpan file di folder mana atau lupa baris kode yang bermasalah? Dua perintah sakti ini bakal menyelamatkan waktu kamu!',
    reading_time: 6,
    tags: ['grep', 'find', 'search', 'produktivitas'],
    sections: [
      {
        heading: 'Nggak Perlu Buka File Satu per Satu Lagi 🙌',
        paragraphs: [
          'Pernah nggak sih merasa frustrasi karena yakin pernah menulis sesuatu, tapi lupa di file yang mana? Tenang, semua programmer pernah mengalaminya! Dengan grep dan find, komputer akan menyisir ratusan file hanya dalam hitungan milidetik.'
        ],
        commands: [
          { label: '🔍 Cari semua file berakhiran .sh di folder rumah', cmd: 'find ~ -name "*.sh"' },
          { label: '📝 Cari kata "API_URL" di semua file folder ini', cmd: 'grep -rn "API_URL" .' },
          { label: '🙈 Cari teks tanpa peduli huruf besar/kecil', cmd: 'grep -rni "error" ./logs' }
        ]
      }
    ]
  },
  {
    id: 'mat-proses-htop',
    slug: 'proses-htop-kill',
    title: '📊 Pantau CPU, RAM & Hentikan Program Bandel (ps, htop, kill)',
    level: 'Intermediate',
    category: 'System',
    summary:
      'HP terasa panas atau terminal tiba-tiba macet karena skrip jalan terus? Lihat cara memantau proses yang aktif dan menutupnya dengan bersih.',
    reading_time: 6,
    tags: ['htop', 'ps', 'kill', 'performa'],
    sections: [
      {
        heading: 'Kenali Apa yang Diam-Diam Makan Memori Kamu 🧠',
        paragraphs: [
          'Kadang kita menjalankan server uji coba di latar belakang lalu lupa mematikannya, bikin baterai boros atau port bentrok ("Address already in use" 😤). Dengan htop, kamu bisa melihat grafik CPU dan RAM secara langsung yang super rapi.'
        ],
        commands: [
          { label: '📦 Pasang monitor sistem htop', cmd: 'pkg install htop -y' },
          { label: '📊 Buka tampilan grafik proses real-time', cmd: 'htop' },
          { label: '📋 Cek daftar proses Node.js atau Python yang aktif', cmd: 'ps aux | grep -E "node|python"' }
        ]
      }
    ]
  },
  {
    id: 'mat-symlink-alias',
    slug: 'symlink-alias-trik',
    title: '🔗 Bikin Jalan Pintas Folder & Perintah Favorit (ln -s & alias)',
    level: 'Beginner',
    category: 'System',
    summary:
      'Malas mengetik perintah atau alamat folder yang kepanjangan di keyboard HP? Bikin shortcut pribadi biar hidup kamu di terminal jauh lebih santai!',
    reading_time: 5,
    tags: ['alias', 'symlink', 'shortcut', 'produktivitas'],
    sections: [
      {
        heading: 'Ngetik di Layar HP Harus Cerdas, Bukan Capek 😄',
        paragraphs: [
          'Mengetik alamat panjang seperti cd /storage/emulated/0/Download/Proyek di layar sentuh jelas melelahkan jempol. Nah, dengan Symlink (ln -s) kamu bisa membuat "pintu ajaib" dari folder rumah langsung menuju folder tujuan.'
        ],
        commands: [
          { label: '🚪 Buat pintu pintas ~/dl ke folder Download HP', cmd: 'ln -s ~/storage/downloads ~/dl' },
          { label: '⚡ Buat alias singkat sementara di sesi ini', cmd: 'alias ll="ls -la"' }
        ]
      }
    ]
  },
  {
    id: 'mat-env-dotenv',
    slug: 'env-dotenv-rahasia',
    title: '🤫 Menyimpan Password & API Key dengan Aman Pakai .env',
    level: 'Intermediate',
    category: 'System',
    summary:
      'Jangan pernah menulis API Key atau password langsung di dalam kode yang mau di-upload ke GitHub! Pelajari kebiasaan aman memakai file .env.',
    reading_time: 6,
    tags: ['env', 'keamanan', 'api-key', 'git'],
    sections: [
      {
        heading: 'Kesalahan Klasik yang Bisa Berakibat Fatal ⚠️',
        paragraphs: [
          'Banyak pemula yang saking semangatnya langsung menempel API Key rahasia di skrip lalu meng-upload ke GitHub publik. Hitungan menit saja, bot pencari kunci di internet bisa menyalahgunakannya 😬.',
          'Biasakan memisahkan rahasia di file .env dan masukkan nama .env ke dalam .gitignore supaya aman selamanya!'
        ],
        code: {
          language: 'bash',
          caption: 'cara-pakai-env.sh',
          content: `# Isi file .env\nAPI_KEY="kunci_rahasia_kamu"\n\n# Cara membacanya di skrip Bash:\nset -a && source .env && set +a\necho "Siap pakai kunci dengan panjang \${#API_KEY} karakter 🔒"`
        }
      }
    ]
  },
  {
    id: 'mat-logs-baca',
    slug: 'logs-journal-baca',
    title: '📜 Membaca File Log & Melacak Penyebab Error Sistem (tail, less)',
    level: 'Intermediate',
    category: 'System',
    summary:
      'Program error tapi bingung salahnya di mana? Belajar membaca jejak log baris demi baris secara live supaya bug ketemu lebih cepat.',
    reading_time: 6,
    tags: ['logs', 'tail', 'debug', 'monitoring'],
    sections: [
      {
        heading: 'Log Adalah Kotak Hitam Aplikasi Kamu ✈️',
        paragraphs: [
          'Saat aplikasi gagal jalan, rasa panik itu wajar. Tapi daripada menebak-nebak, biasakan membaca log terakhir. Perintah tail -f ibarat memantau CCTV teks: setiap baris error baru muncul, layar langsung menampilkannya secara real-time!'
        ],
        commands: [
          { label: '👀 Lihat 30 baris paling akhir dari file log', cmd: 'tail -n 30 app.log' },
          { label: '📡 Pantau log yang terus bertambah secara live', cmd: 'tail -f app.log' },
          { label: '📖 Baca file panjang dengan nyaman (tekan q untuk keluar)', cmd: 'less app.log' }
        ]
      }
    ]
  },
  {
    id: 'mat-rsync-backup',
    slug: 'backup-rsync-sinkron',
    title: '🔄 Sinkronisasi & Backup Data Cerdas Pakai Rsync',
    level: 'Advanced',
    category: 'System',
    summary:
      'Kenapa menyalin ulang ribuan file kalau cuma 2 file yang berubah? Pakai rsync biar proses backup super cepat dan hemat kuota!',
    reading_time: 7,
    tags: ['rsync', 'backup', 'ssh', 'efisien'],
    sections: [
      {
        heading: 'Smart Copy untuk Pekerjaan Serius 🧠',
        paragraphs: [
          'Perintah cp biasa akan menyalin ulang semuanya dari nol. Berbeda dengan rsync: ia membandingkan ukuran dan waktu modifikasi file, lalu HANYA mengirim bagian yang berubah saja. Kalau koneksi putus di tengah jalan, tinggal ulangi tanpa mulai dari nol!'
        ],
        commands: [
          { label: '📦 Install rsync di Termux', cmd: 'pkg install rsync -y' },
          { label: '🔄 Sinkronkan folder lokal ke folder backup', cmd: 'rsync -avh --progress ~/projects/ ~/backup/projects/' }
        ]
      }
    ]
  },
  {
    id: 'mat-tunneling-online',
    slug: 'ngrok-cloudflare-tunnel',
    title: '🌍 Online-kan Web Lokal dari HP ke Internet (Tunneling Aman)',
    level: 'Intermediate',
    category: 'Networking',
    summary:
      'Sudah bikin web keren di localhost:3000 tapi bingung nunjukinnya ke teman? Pelajari konsep tunneling aman tanpa perlu setting router WiFi.',
    reading_time: 7,
    tags: ['tunnel', 'localhost', 'cloudflare', 'sharing'],
    sections: [
      {
        heading: 'Bangga Lihat Karyamu Bisa Dibuka dari Mana Saja 🚀',
        paragraphs: [
          'Ada kepuasan tersendiri saat link proyek yang kamu bangun di HP bisa dibuka oleh teman atau klien dari kota lain! Karena IP WiFi rumah biasanya tersembunyi di balik NAT operator, layanan tunneling seperti Cloudflare Tunnel (cloudflared) membuat jembatan HTTPS aman dari HP ke internet.'
        ],
        commands: [
          { label: '📦 Pasang cloudflared di Termux', cmd: 'pkg install cloudflared -y' },
          { label: '🌐 Bagikan server lokal port 3000 sementara', cmd: 'cloudflared tunnel --url http://localhost:3000' }
        ]
      }
    ]
  },
  {
    id: 'mat-dns-privasi',
    slug: 'dns-doh-privasi',
    title: '🛡️ Memahami DNS, Hosts File & Cara Cek Koneksi Internet Lebih Dalam',
    level: 'Intermediate',
    category: 'Networking',
    summary:
      'Kenapa kadang web bisa dibuka pakai IP tapi gagal lewat nama domain? Pelajari cara melacak masalah DNS dan memahami cara kerja DNS over HTTPS.',
    reading_time: 6,
    tags: ['dns', 'privasi', 'network', 'troubleshooting'],
    sections: [
      {
        heading: 'Jangan Langsung Salahin Codinganmu 😅',
        paragraphs: [
          'Sering kali aplikasi terasa error padahal masalahnya cuma DNS provider internet lagi lambat merespons. Dengan perintah dig atau nslookup, kamu bisa memastikan apakah domain benar-benar mengarah ke server yang tepat.'
        ],
        commands: [
          { label: '📦 Pasang paket dnsutils (berisi dig)', cmd: 'pkg install dnsutils -y' },
          { label: '🔍 Cek alamat IP suatu domain lewat DNS 1.1.1.1', cmd: 'dig @1.1.1.1 google.com +short' }
        ]
      }
    ]
  },
  {
    id: 'mat-http-status',
    slug: 'http-status-code',
    title: '🚦 Kamus Kode Status HTTP (200, 401, 404, 500) Biar Nggak Bingung',
    level: 'Beginner',
    category: 'Networking',
    summary:
      'Berhenti nebak-nebak arti angka saat API gagal! Pahami bahasa rahasia antara browser dan server dalam 5 menit.',
    reading_time: 5,
    tags: ['http', 'api', 'status-code', 'pemula'],
    sections: [
      {
        heading: 'Angka Tiga Digit yang Penuh Makna 💬',
        paragraphs: [
          'Saat ngoding atau tes API, angka status HTTP sebenarnya adalah cara server jujur ngasih tahu keadaan. Begitu kamu hafal polanya, mencari bug jadi terasa kayak baca rambu lalu lintas!'
        ],
        table: {
          headers: ['Kode', 'Arti Singkat', 'Perasaan yang Muncul 😄'],
          rows: [
            ['200 / 201', 'OK / Created', '🎉 Berhasil! Data diterima atau berhasil disimpan'],
            ['400', 'Bad Request', '✍️ Ada isian formulir atau format JSON yang salah ketik'],
            ['401 / 403', 'Unauthorized / Forbidden', '🔐 Belum login, token habis, atau API Key tidak cocok'],
            ['404', 'Not Found', '🕵️ Alamat URL atau datanya memang tidak ada'],
            ['500 / 502', 'Server Error', '🔥 Masalah ada di sisi server atau API tujuan']
          ]
        }
      }
    ]
  },
  {
    id: 'mat-whois-ssl',
    slug: 'whois-ssl-inspeksi',
    title: '🕵️ Cek Umur Domain, Pemilik & Detail Sertifikat Keamanan Website',
    level: 'Beginner',
    category: 'Networking',
    summary:
      'Penasaran kapan sebuah website dibuat atau kapan sertifikat HTTPS-nya kedaluwarsa? Cek langsung datanya secara transparan lewat terminal.',
    reading_time: 5,
    tags: ['whois', 'domain', 'ssl', 'osint'],
    sections: [
      {
        heading: 'Belajar Verifikasi Keaslian Situs Secara Mandiri 🔍',
        paragraphs: [
          'Kemampuan mengecek informasi publik domain (WHOIS) sangat berguna bagi developer dan pengguna internet sehari-hari—misalnya untuk memastikan kapan domain proyek kita harus diperpanjang sebelum diambil orang lain.'
        ],
        commands: [
          { label: '📦 Install whois di Termux', cmd: 'pkg install whois -y' },
          { label: '📅 Cek tanggal daftar & kadaluarsa domain', cmd: 'whois example.com | grep -iE "Creation|Expiry"' }
        ]
      }
    ]
  },
  {
    id: 'mat-websocket-konsep',
    slug: 'websocket-realtime-konsep',
    title: '⚡ Kenalan dengan WebSocket: Rahasia Chat & Notifikasi Instan',
    level: 'Advanced',
    category: 'Networking',
    summary:
      'Penasaran gimana notifikasi di Bri Tech muncul seketika tanpa refresh halaman? Pahami bedanya HTTP biasa dengan koneksi WebSocket dua arah!',
    reading_time: 8,
    tags: ['websocket', 'realtime', 'arsitektur', 'notifikasi'],
    sections: [
      {
        heading: 'Analogi Telepon vs Kirim Surat ☎️',
        paragraphs: [
          'HTTP biasa itu seperti berkirim surat: kamu tanya server ("ada pesan baru?"), server jawab, lalu sambungan ditutup. Kalau mau real-time pakai cara itu, browser harus nanya terus setiap detik—boros baterai dan kuota!',
          'WebSocket ibarat panggilan telepon yang tetap tersambung: begitu ada peristiwa baru di server, server langsung mendorong (push) datanya detik itu juga ke browser kamu 🚀.'
        ],
        code: {
          language: 'javascript',
          caption: 'ws-client.js',
          content: `const ws = new WebSocket("ws://localhost:3000/ws");\nws.onmessage = (event) => {\n  const data = JSON.parse(event.data);\n  console.log("🔔 Ada event real-time:", data.event);\n};`
        }
      }
    ]
  },
  {
    id: 'mat-bash-loop',
    slug: 'bash-looping-array',
    title: '🔁 Perulangan (For & While Loop) di Bash: Ulangi Tugas Otomatis',
    level: 'Intermediate',
    category: 'Automation',
    summary:
      'Harus mengganti nama 50 file atau mengecek status 10 website sekaligus? Jangan dikerjakan manual—suruh Bash melakukan perulangan dalam 1 detik!',
    reading_time: 7,
    tags: ['bash', 'loop', 'array', 'automation'],
    sections: [
      {
        heading: 'Kenapa Harus Capek Kalau Mesin Bisa Mengulang? 🤖',
        paragraphs: [
          'Bagian paling membosankan dari pekerjaan IT adalah tugas yang diulang-ulang. Begitu kamu paham pola for loop di Bash, pekerjaan yang tadinya makan waktu setengah jam bisa beres sebelum kopi kamu dingin ☕.'
        ],
        code: {
          language: 'bash',
          caption: 'cek-server.sh',
          content: `#!/bin/bash\nSITES=("https://example.com" "http://localhost:3000/api/v1/health")\n\nfor URL in "\${SITES[@]}"; do\n  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")\n  echo "🌐 $URL -> Status HTTP $CODE"\ndone`
        }
      }
    ]
  },
  {
    id: 'mat-bash-function',
    slug: 'bash-function-modular',
    title: '🧱 Merapikan Skrip Panjang Pakai Function di Bash',
    level: 'Intermediate',
    category: 'Automation',
    summary:
      'Skrip Bash kamu mulai panjang dan susah dibaca? Pecah jadi blok-blok fungsi yang rapi biar mudah diperbaiki dan dipakai ulang.',
    reading_time: 6,
    tags: ['bash', 'function', 'clean-code', 'automation'],
    sections: [
      {
        heading: 'Sayangi Diri Kamu di Masa Depan 💚',
        paragraphs: [
          'Kode yang berantakan mungkin masih kamu mengerti hari ini, tapi sebulan lagi kamu sendiri bakal bingung membacanya 😅. Membungkus tugas ke dalam fungsi (function) membuat skrip terasa terstruktur dan enak dilihat.'
        ],
        code: {
          language: 'bash',
          caption: 'fungsi-rapi.sh',
          content: `#!/bin/bash\nkirim_log() {\n  local PESAN="$1"\n  echo "[$(date '+%H:%M:%S')] $PESAN"\n}\n\nkirim_log "🚀 Memulai proses backup..."\nkirim_log "✅ Semua beres!"`
        }
      }
    ]
  },
  {
    id: 'mat-python-api',
    slug: 'python-automation-api',
    title: '🐍 Skrip Python Sederhana untuk Ambil & Olah Data REST API',
    level: 'Intermediate',
    category: 'Automation',
    summary:
      'Ingin mengambil data dari API Bri Tech atau API publik lalu mengolahnya otomatis pakai Python? Pelajari contoh kode ringkas siap pakai ini.',
    reading_time: 7,
    tags: ['python', 'api', 'requests', 'automation'],
    sections: [
      {
        heading: 'Python + REST API = Kombinasi Anti Ribet 🤝',
        paragraphs: [
          'Kalau logika pengolahan data sudah mulai kompleks, Python sering kali jauh lebih nyaman dibaca daripada Bash. Cukup pakai library requests atau urllib bawaan, kamu sudah bisa membaca dan mengirim data JSON dengan mulus.'
        ],
        code: {
          language: 'python',
          caption: 'baca_materi.py',
          content: `import json, urllib.request\n\nwith urllib.request.urlopen("http://localhost:3000/api/v1/materi?limit=5") as res:\n    data = json.loads(res.read().decode())\n    for item in data["items"]:\n        print(f"📘 {item['title']} ({item['level']})")`
        }
      }
    ]
  },
  {
    id: 'mat-webhook-bot',
    slug: 'webhook-notifikasi-bot',
    title: '🔔 Bikin Pengingat & Bot Notifikasi Otomatis ke Dasbor Bri Tech',
    level: 'Advanced',
    category: 'Automation',
    summary:
      'Pelajari cara kerja Webhook dan langsung praktik mengirim notifikasi otomatis saat baterai HP lemah atau saat skrip backup selesai!',
    reading_time: 8,
    tags: ['webhook', 'notifikasi', 'api', 'termux-api'],
    sections: [
      {
        heading: 'Dari HP Kamu Langsung Muncul di Layar Dasbor ✨',
        paragraphs: [
          'Webhook pada dasarnya hanyalah "panggilan balik otomatis": saat sebuah kejadian terjadi (misalnya proses unduhan selesai), skrip langsung menembak endpoint API notifikasi agar kamu tahu seketika tanpa harus terus mengecek layar.'
        ],
        code: {
          language: 'bash',
          caption: 'notify-britech.sh',
          content: `#!/bin/bash\nAPI_KEY="MASUKKAN_API_KEY_ANDA"\ncurl -s -X POST "http://localhost:3000/api/v1/notifications" \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: $API_KEY" \\\n  -d '{"title":"🎉 Tugas Selesai","message":"Skrip automasi di HP sudah beres dieksekusi!","type":"success","source":"api"}'`
        }
      }
    ]
  },
  {
    id: 'mat-cicd-konsep',
    slug: 'ci-cd-deploy-konsep',
    title: '🚀 Paham Konsep Otomatisasi Deploy & Backup Proyek Modern',
    level: 'Advanced',
    category: 'Automation',
    summary:
      'Kenalan dengan dunia CI/CD: bagaimana developer profesional menguji kode dan memperbarui aplikasi secara otomatis setiap kali git push.',
    reading_time: 7,
    tags: ['cicd', 'deploy', 'git', 'devops'],
    sections: [
      {
        heading: 'Kenapa Tim Besar Nggak Pernah Upload File Manual? ⚡',
        paragraphs: [
          'Bayangkan kalau tim punya 20 programmer dan semuanya upload file manual lewat FTP—pasti sering ketimpa dan bikin web error 😱. Dengan alur CI/CD (Continuous Integration / Continuous Deployment), setiap kali kode dikirim ke GitHub, robot server otomatis mengetes kode lalu memperbarui aplikasi jika semua tes lolos.'
        ],
        bullets: [
          '1️⃣ Developer push kode terbaru ke repository Git.',
          '2️⃣ Mesin otomatis menjalankan pengecekan sintaks & tes (lint + build).',
          '3️⃣ Jika hijau semua ✅, aplikasi diperbarui tanpa waktu henti yang mengganggu pengguna.',
          '4️⃣ Notifikasi status sukses/gagal dikirim real-time ke tim.'
        ]
      }
    ]
  }
];
