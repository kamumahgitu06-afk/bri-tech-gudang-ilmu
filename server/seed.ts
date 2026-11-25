import type { MateriCategory, MateriLevel, MateriSection } from '../src/types.ts';
import { EXTRA_MATERI } from './seed_extra.ts';

export interface SeedMateri {
  id: string;
  slug: string;
  title: string;
  level: MateriLevel;
  category: MateriCategory;
  summary: string;
  reading_time: number;
  tags: string[];
  sections: MateriSection[];
}

const BASE_MATERI: SeedMateri[] = [
  {
    id: 'mat-termux-pengenalan',
    slug: 'termux-pengenalan',
    title: '📱 Termux: Kenalan dengan Terminal Linux di HP',
    level: 'Beginner',
    category: 'Termux',
    summary:
      'Bingung mulai belajar Linux dan coding tapi cuma punya HP? Termux jawabannya! Yuk kenali cara kerja terminal Android ini tanpa perlu root.',
    reading_time: 5,
    tags: ['termux', 'linux', 'pemula', 'android'],
    sections: [
      {
        heading: 'Apa sih Termux itu? 🤔',
        paragraphs: [
          'Bayangkan Termux itu seperti aplikasi "komputer mini" berbasis Linux yang tinggal di dalam HP Android kamu. Tanpa perlu oprek atau root HP, kamu sudah bisa mengetik perintah Linux, belajar bahasa pemrograman seperti Python atau Node.js, sampai mengelola server dari jarak jauh.',
          'Buat pemula, tampilan layar hitam penuh teks mungkin kelihatan seram 😅. Padahal kalau sudah tahu perintah dasarnya, pakai terminal justru jauh lebih cepat dan hemat kuota dibanding klik sana-sini!'
        ]
      },
      {
        heading: 'Apa Saja yang Bisa Dilakukan di Termux? ✨',
        bullets: [
          '📂 Mengelola file dan folder layaknya di laptop Linux.',
          '🐍 Ngoding Python, JavaScript (Node.js), atau Bash script langsung dari HP.',
          '🔑 Masuk ke server VPS atau komputer kantor secara aman lewat SSH.',
          '🌐 Mengecek koneksi internet, IP jaringan WiFi, dan mengetes REST API.',
          '🤖 Bikin skrip otomatis untuk backup file atau kirim notifikasi.'
        ]
      },
      {
        heading: 'Perintah Wajib Pertama Kali Buka Termux 🚀',
        table: {
          headers: ['Fungsi', 'Perintah', 'Penjelasan Sederhana'],
          rows: [
            ['Lihat isi folder', 'ls', 'Menampilkan daftar file & folder di tempat kamu berada'],
            ['Cek posisi folder', 'pwd', 'Menunjukkan alamat folder aktif saat ini'],
            ['Bersihkan layar', 'clear', 'Menghapus tulisan yang penuh di layar terminal'],
            ['Cek info sistem', 'uname -a', 'Melihat jenis prosesor & sistem Android kamu']
          ]
        },
        commands: [
          { label: '👋 Cek folder tempat kamu berada sekarang', cmd: 'pwd' },
          { label: '📋 Lihat daftar file yang ada', cmd: 'ls -la' },
          { label: '🧹 Bersihkan layar terminal biar rapi', cmd: 'clear' }
        ]
      },
      {
        heading: 'Contoh Skrip Backup Pertama Kamu 💾',
        paragraphs: [
          'Coba buat skrip sederhana ini untuk menyalin folder dokumen penting ke folder backup secara otomatis:'
        ],
        code: {
          language: 'bash',
          caption: 'backup.sh',
          content: `#!/bin/bash\nmkdir -p ~/backup\ncp -r ~/storage/shared/Documents ~/backup/\necho "✅ Backup selesai pada $(date '+%Y-%m-%d %H:%M')"`
        }
      }
    ]
  },
  {
    id: 'mat-filesystem',
    slug: 'filesystem',
    title: '📁 Peta Folder Termux: Biar Nggak Nyasar di Terminal',
    level: 'Beginner',
    category: 'Termux',
    summary:
      'Pahami di mana file kamu disimpan di Termux ($HOME, $PREFIX, ~/storage) lengkap dengan analogi rumah agar mudah navigasi.',
    reading_time: 6,
    tags: ['termux', 'filesystem', 'navigasi', 'dasar'],
    sections: [
      {
        heading: 'Kenapa Alamat Folder Termux Terasa Panjang? 🗺️',
        paragraphs: [
          'Di HP Android, setiap aplikasi punya "kamar" pribadinya sendiri demi keamanan. Karena itu, rumah utama kamu di Termux tidak berada di C:\\Users seperti Windows, melainkan di /data/data/com.termux/files/home.',
          'Untungnya kamu tidak perlu menghafal alamat panjang itu! Cukup pakai simbol gelombang ~ (tilde), Termux otomatis paham kalau kamu sedang menunjuk folder rumahmu 🏠.'
        ],
        table: {
          headers: ['Singkatan', 'Alamat Asli', 'Analogi Mudah'],
          rows: [
            ['~ atau $HOME', '/data/data/com.termux/files/home', '🏠 Kamar pribadi tempat kamu menyimpan semua proyek'],
            ['$PREFIX', '/data/data/com.termux/files/usr', '🧰 Gudang alat tempat aplikasi & tools terinstall'],
            ['~/storage/downloads', '/storage/emulated/0/Download', '📥 Jembatan ke folder Download di memori internal HP'],
            ['$TMPDIR', '$PREFIX/tmp', '🗑️ Keranjang sementara untuk file proses sistem']
          ]
        }
      },
      {
        heading: 'Perintah Pindah & Kelola Folder 🚶‍♂️',
        bullets: [
          'cd nama_folder — Masuk ke dalam folder tertentu.',
          'cd .. — Mundur satu langkah ke folder sebelumnya.',
          'cd ~ — Langsung pulang ke folder rumah utama dari mana saja.',
          'mkdir -p proyek/api — Membuat folder beserta sub-foldernya sekaligus.'
        ],
        commands: [
          { label: '📥 Pindah ke folder Download HP', cmd: 'cd ~/storage/downloads' },
          { label: '📁 Buat folder latihan baru', cmd: 'mkdir -p ~/latihan/termux' },
          { label: '📊 Cek sisa ruang penyimpanan HP', cmd: 'df -h' }
        ]
      }
    ]
  },
  {
    id: 'mat-pkg-apt',
    slug: 'pkg-apt',
    title: '📦 Cara Install Aplikasi di Termux Pakai pkg & apt',
    level: 'Beginner',
    category: 'Termux',
    summary:
      'Mirip Play Store versi teks! Pelajari cara update, mencari, memasang, dan menghapus aplikasi terminal di Termux tanpa error.',
    reading_time: 5,
    tags: ['pkg', 'apt', 'install', 'termux'],
    sections: [
      {
        heading: 'Mengenal pkg: Play Store Versi Terminal 🛍️',
        paragraphs: [
          'Kalau di Android biasa kamu menginstal aplikasi lewat Play Store, di Termux kita memakai perintah pkg (singkatan dari package). Sebenarnya pkg adalah jalan pintas ramah dari perintah apt milik Linux Ubuntu/Debian.',
          'Kelebihan pkg dibanding apt adalah pkg otomatis mengecek daftar aplikasi terbaru dulu sebelum mengunduh, jadi kecil kemungkinannya kena error "404 Not Found" 👍.'
        ],
        table: {
          headers: ['Kebutuhan', 'Perintah pkg', 'Fungsi'],
          rows: [
            ['Update semua paket', 'pkg update && pkg upgrade -y', 'Memperbarui katalog dan aplikasi yang sudah terpasang'],
            ['Cari aplikasi', 'pkg search python', 'Mencari nama paket yang tersedia di server'],
            ['Pasang aplikasi', 'pkg install git curl', 'Menginstal beberapa tools sekaligus'],
            ['Lihat yang terpasang', 'pkg list-installed', 'Mengecek daftar paket apa saja yang sudah ada'],
            ['Hapus aplikasi', 'pkg uninstall nano', 'Mencopot paket yang tidak lagi dibutuhkan']
          ]
        }
      },
      {
        heading: 'Paket Wajib Setelah Pertama Install Termux 🛠️',
        paragraphs: [
          'Kalau baru selesai menginstal Termux dari F-Droid atau GitHub, jalankan perintah ini agar terminal kamu siap dipakai ngoding dan eksplorasi:'
        ],
        code: {
          language: 'bash',
          caption: 'setup-pemula.sh',
          content: `termux-change-repo\npkg update && pkg upgrade -y\npkg install -y git curl wget nano jq openssh`
        },
        commands: [
          { label: '🌍 Ganti server mirror kalau unduhan lambat', cmd: 'termux-change-repo' },
          { label: '🧹 Bersihkan file instalasi bekas biar hemat memori', cmd: 'apt clean && apt autoclean' }
        ]
      }
    ]
  },
  {
    id: 'mat-nano-vim',
    slug: 'nano-vim-editor',
    title: '📝 Cara Edit File & Kode di Terminal Pakai Nano',
    level: 'Beginner',
    category: 'Termux',
    summary:
      'Tidak perlu aplikasi terpisah! Pelajari cara membuat, mengedit, menyimpan, dan mencari teks di dalam file langsung di Termux dengan Nano.',
    reading_time: 5,
    tags: ['nano', 'editor', 'coding', 'termux'],
    sections: [
      {
        heading: 'Kenapa Pemula Sebaiknya Pakai Nano? ✏️',
        paragraphs: [
          'Di terminal ada banyak editor teks seperti Vim, Emacs, dan Nano. Untuk pemula, Nano adalah pilihan paling bersahabat karena di bagian bawah layar selalu ada petunjuk tombolnya—jadi kamu tidak bakal bingung cara keluar dari editor 😄.',
          'Catatan penting di keyboard HP: tanda ^ artinya tombol CTRL. Kamu bisa mengetuk tombol CTRL di barisan tombol ekstra Termux atau menekan tombol Volume Bawah di HP.'
        ],
        table: {
          headers: ['Pintasan Keyboard', 'Arti Tombol', 'Kegunaan'],
          rows: [
            ['CTRL + O lalu Enter', '^O Write Out', '💾 Menyimpan perubahan file'],
            ['CTRL + X', '^X Exit', '🚪 Keluar dari editor Nano'],
            ['CTRL + W', '^W Where Is', '🔍 Mencari kata tertentu di dalam file'],
            ['CTRL + K', '^K Cut', '✂️ Memotong atau menghapus satu baris cepat']
          ]
        },
        commands: [
          { label: '📦 Install editor Nano jika belum ada', cmd: 'pkg install nano -y' },
          { label: '📝 Buat dan edit file catatan.txt', cmd: 'nano catatan.txt' },
          { label: '👀 Baca isi file tanpa membuka editor', cmd: 'cat catatan.txt' }
        ]
      }
    ]
  },
  {
    id: 'mat-git-github',
    slug: 'git-github-termux',
    title: '🐙 Belajar Git & Upload Proyek ke GitHub dari HP',
    level: 'Beginner',
    category: 'Termux',
    summary:
      'Simpan kode kamu dengan aman! Pelajari alur dasar git clone, add, commit, dan push proyek ke GitHub langsung dari Termux.',
    reading_time: 7,
    tags: ['git', 'github', 'kolaborasi', 'termux'],
    sections: [
      {
        heading: 'Git Itu Seperti "Save Game" untuk Koding 🎮',
        paragraphs: [
          'Pernah bikin kode yang awalnya jalan, lalu setelah diubah malah error dan lupa tadi ubah apa? Nah, Git berfungsi seperti fitur save checkpoint di game. Kamu bisa merekam setiap perubahan dan kembali ke versi sebelumnya kapan saja.',
          'Sedangkan GitHub adalah tempat menyimpan cadangan kode tersebut secara online agar bisa dibuka dari perangkat lain atau dibagikan ke teman.'
        ]
      },
      {
        heading: 'Pengaturan Awal Nama & Email Git ⚙️',
        code: {
          language: 'bash',
          caption: 'git-setup.sh',
          content: `pkg install git -y\ngit config --global user.name "Nama Kamu"\ngit config --global user.email "emailkamu@example.com"`
        }
      },
      {
        heading: '4 Perintah Emas Sehari-hari 🏆',
        table: {
          headers: ['Perintah', 'Kapan Dipakai?', 'Keterangan'],
          rows: [
            ['git status', 'Cek kondisi folder', 'Melihat file mana saja yang baru diubah'],
            ['git add .', 'Pilih file yang mau disimpan', 'Menandai semua perubahan siap di-commit'],
            ['git commit -m "pesan"', 'Buat checkpoint', 'Menyimpan riwayat perubahan dengan catatan singkat'],
            ['git push', 'Upload ke GitHub', 'Mengirim rekaman perubahan ke repository online']
          ]
        },
        commands: [
          { label: '📥 Unduh proyek orang lain dari GitHub', cmd: 'git clone https://github.com/username/repo.git' },
          { label: '🔍 Cek perubahan yang belum disimpan', cmd: 'git status' }
        ]
      }
    ]
  },
  {
    id: 'mat-python-nodejs',
    slug: 'python-nodejs-termux',
    title: '🐍 Menjalankan Python & Node.js Langsung di Termux',
    level: 'Intermediate',
    category: 'Termux',
    summary:
      'Ubah smartphone Android menjadi mesin developer! Cara install Python dan Node.js lengkap dengan contoh server web lokal di HP.',
    reading_time: 7,
    tags: ['python', 'nodejs', 'javascript', 'programming'],
    sections: [
      {
        heading: 'Ngoding Dua Bahasa Populer di Satu Terminal 💻',
        paragraphs: [
          'Termux mendukung penuh bahasa pemrograman modern seperti Python 3 dan Node.js. Kamu bisa membuat bot Telegram, mengolah data Excel/CSV, atau menjalankan server web Express langsung dari saku celana!'
        ],
        commands: [
          { label: '🐍 Pasang Python dan pip', cmd: 'pkg install python -y && python --version' },
          { label: '🟢 Pasang Node.js dan npm', cmd: 'pkg install nodejs-lts -y && node -v' }
        ]
      },
      {
        heading: 'Bikin Server Web Mini dalam 5 Detik ⚡',
        paragraphs: [
          'Dengan Python, kamu bahkan bisa membagikan file di folder HP ke laptop lewat WiFi yang sama hanya dengan satu perintah:'
        ],
        code: {
          language: 'bash',
          caption: 'server-lokal.sh',
          content: `# Jalankan server file di port 8080\npython -m http.server 8080\n\n# Lalu buka di browser HP: http://localhost:8080`
        }
      }
    ]
  },
  {
    id: 'mat-permission',
    slug: 'permission',
    title: '🔐 Mengatur Izin File (chmod) & Akses Penyimpanan HP',
    level: 'Intermediate',
    category: 'System',
    summary:
      'Kenapa muncul error "Permission denied"? Pahami cara kerja izin baca-tulis-eksekusi di Linux (chmod) dan cara buka akses storage Android.',
    reading_time: 6,
    tags: ['chmod', 'permission', 'storage', 'keamanan'],
    sections: [
      {
        heading: 'Buka Akses Storage Android Sekali Klik 📱',
        paragraphs: [
          'Secara default, Termux belum diizinkan membaca foto atau dokumen di memori internal HP. Jalankan perintah termux-setup-storage lalu tekan "Izinkan" pada jendela popup Android agar folder ~/storage langsung terhubung.'
        ],
        commands: [
          { label: '🔓 Berikan izin akses folder Download & Documents', cmd: 'termux-setup-storage' },
          { label: '⚡ Jadikan skrip bisa dijalankan (executable)', cmd: 'chmod +x script.sh' }
        ]
      },
      {
        heading: 'Membaca Angka Ajaib chmod (755, 644, 600) 🔢',
        paragraphs: [
          'Di Linux, setiap izin punya nilai angka: Baca (Read) = 4, Tulis (Write) = 2, Jalankan (Execute) = 1. Tinggal dijumlahkan saja! Misalnya 4 + 2 + 1 = 7 (akses penuh).'
        ],
        table: {
          headers: ['Angka', 'Simbol', 'Cocok Untuk Apa?'],
          rows: [
            ['600', '-rw-------', '🔒 Kunci rahasia (seperti SSH private key) — hanya kamu yang boleh baca/tulis'],
            ['644', '-rw-r--r--', '📄 Dokumen & konfigurasi biasa — kamu edit, yang lain cuma boleh baca'],
            ['755', '-rwxr-xr-x', '🚀 Skrip program & folder — boleh dijalankan oleh pengguna']
          ]
        }
      }
    ]
  },
  {
    id: 'mat-path',
    slug: 'path',
    title: '🧭 Rahasia Variabel $PATH & Cara Bikin Perintah Sendiri',
    level: 'Intermediate',
    category: 'System',
    summary:
      'Pernah penasaran gimana terminal tahu lokasi perintah seperti git atau python? Yuk pahami $PATH dan bikin perintah shortcut buatan sendiri!',
    reading_time: 6,
    tags: ['path', 'bashrc', 'env', 'shortcut'],
    sections: [
      {
        heading: 'Cara Terminal Mencari Program 🔍',
        paragraphs: [
          'Saat kamu mengetik kata python lalu tekan Enter, terminal tidak mencari ke seluruh isi HP yang memakan waktu lama. Ia hanya mengecek daftar folder yang terdaftar di variabel $PATH.',
          'Kalau kamu menaruh skrip buatan sendiri di folder khusus lalu mendaftarkannya ke $PATH, skrip itu bisa dipanggil dari folder mana saja layaknya aplikasi resmi!'
        ],
        commands: [
          { label: '👀 Intip daftar folder yang ada di $PATH', cmd: 'echo $PATH' },
          { label: '📍 Cek di mana lokasi asli program curl', cmd: 'which curl' }
        ]
      },
      {
        heading: 'Menambahkan Folder ~/bin & Alias Keren di ~/.bashrc ✨',
        code: {
          language: 'bash',
          caption: '~/.bashrc',
          content: `mkdir -p ~/bin\necho 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc\necho 'alias update="pkg update && pkg upgrade -y"' >> ~/.bashrc\nsource ~/.bashrc`
        }
      }
    ]
  },
  {
    id: 'mat-troubleshooting',
    slug: 'troubleshooting',
    title: '🛠️ Solusi Cepat Mengatasi Error Termux yang Sering Muncul',
    level: 'Intermediate',
    category: 'System',
    summary:
      'Jangan panik kalau ketemu error merah! Kumpulan solusi praktis untuk error mirror 404, Permission denied, hingga proses mati saat layar HP terkunci.',
    reading_time: 6,
    tags: ['troubleshooting', 'error', 'debug', 'tips'],
    sections: [
      {
        heading: 'Daftar Masalah Populer & Obat Ampuhnya 💊',
        table: {
          headers: ['Pesan Error / Gejala', 'Kenapa Terjadi?', 'Cara Mengatasi'],
          rows: [
            ['Unable to locate package / 404', 'Server mirror bawaan sedang sibuk atau alamat usang', 'Ketik termux-change-repo lalu pilih mirror lain & pkg update'],
            ['Permission denied saat ./file.sh', 'File berada di /sdcard (dilarang eksekusi) atau lupa chmod', 'Pindahkan file ke ~ lalu jalankan chmod +x file.sh'],
            ['Proses terhenti saat layar HP mati', 'Android menghemat baterai dengan menidurkan Termux', 'Aktifkan termux-wake-lock sebelum menjalankan tugas berat'],
            ['CANNOT LINK EXECUTABLE', 'Versi library belum sinkron satu sama lain', 'Jalankan pkg upgrade -y agar semua paket seragam']
          ]
        }
      },
      {
        heading: 'Tombol Darurat Terminal di HP ⌨️',
        bullets: [
          '🛑 Volume Down + C (Ctrl+C): Menghentikan proses yang macet atau berjalan terus.',
          '🚪 Volume Down + D (Ctrl+D): Keluar dari sesi terminal atau Python dengan rapi.',
          '✨ Volume Down + L (Ctrl+L): Membersihkan layar dalam sekejap.',
          '🎛️ Volume Up + Q: Memunculkan atau menyembunyikan tombol bantu (ESC, TAB, CTRL).'
        ],
        commands: [
          { label: '🔋 Tahan Termux agar tetap nyala di background', cmd: 'termux-wake-lock' },
          { label: '🩺 Perbaiki instalasi paket yang sempat terputus', cmd: 'dpkg --configure -a && apt --fix-broken install' }
        ]
      }
    ]
  },
  {
    id: 'mat-tmux-session',
    slug: 'tmux-session',
    title: '🖥️ Tmux: Buka Banyak Layar Terminal Sekaligus Tanpa Putus',
    level: 'Intermediate',
    category: 'System',
    summary:
      'Capek buka-tutup tab saat menjalankan server sekaligus ngedit kode? Pakai Tmux untuk membelah layar dan menjaga proses tetap hidup!',
    reading_time: 7,
    tags: ['tmux', 'multitasking', 'terminal', 'produktivitas'],
    sections: [
      {
        heading: 'Apa Hebatnya Tmux? 🪄',
        paragraphs: [
          'Tmux (Terminal Multiplexer) memungkinkan kamu membagi satu layar terminal menjadi beberapa jendela (split screen). Hebatnya lagi, kalau koneksi SSH ke server terputus, pekerjaanmu di dalam Tmux tetap berjalan aman di belakang layar.'
        ],
        commands: [
          { label: '📦 Install Tmux di Termux', cmd: 'pkg install tmux -y' },
          { label: '🚀 Mulai sesi baru bernama lab', cmd: 'tmux new -s lab' },
          { label: '🔄 Sambung kembali ke sesi yang tadi ditinggal', cmd: 'tmux attach -t lab' }
        ]
      },
      {
        heading: 'Pintasan Tmux Paling Berguna (Tekan Ctrl+B dulu) ⌨️',
        table: {
          headers: ['Kombinasi Tombol', 'Fungsi'],
          rows: [
            ['Ctrl+B lalu %', 'Membelah layar secara vertikal (kiri-kanan)'],
            ['Ctrl+B lalu "', 'Membelah layar secara horizontal (atas-bawah)'],
            ['Ctrl+B lalu Panah', 'Pindah kursor antar panel layar'],
            ['Ctrl+B lalu D', 'Keluar sementara (detach) tanpa mematikan program']
          ]
        }
      }
    ]
  },
  {
    id: 'mat-ssh-remote',
    slug: 'ssh-remote-server',
    title: '🔑 Remote Server VPS Pakai SSH & Kunci Keamanan Ed25519',
    level: 'Intermediate',
    category: 'System',
    summary:
      'Kendalikan komputer atau server cloud dari HP dengan aman menggunakan protokol SSH dan login tanpa password memakai SSH Key.',
    reading_time: 8,
    tags: ['ssh', 'vps', 'security', 'remote'],
    sections: [
      {
        heading: 'Mengenal SSH (Secure Shell) 🔐',
        paragraphs: [
          'SSH adalah terowongan terenkripsi yang dipakai programmer dan sysadmin untuk mengendalikan server Linux dari jarak jauh. Semua perintah yang kamu ketik di HP dikirim secara teracak sehingga aman dari penyadapan di WiFi publik.'
        ],
        commands: [
          { label: '📦 Pasang OpenSSH di Termux', cmd: 'pkg install openssh -y' },
          { label: '🔑 Buat pasangan kunci modern Ed25519', cmd: 'ssh-keygen -t ed25519 -C "hp-termux"' },
          { label: '🚀 Masuk ke server remote', cmd: 'ssh user@ip-server-kamu' }
        ]
      },
      {
        heading: 'Tips Mengamankan File Kunci SSH 🛡️',
        code: {
          language: 'bash',
          caption: 'ssh-lock.sh',
          content: `chmod 700 ~/.ssh\nchmod 600 ~/.ssh/id_ed25519\nchmod 644 ~/.ssh/id_ed25519.pub`
        }
      }
    ]
  },
  {
    id: 'mat-networking-dasar',
    slug: 'networking-dasar',
    title: '🌐 Paham IP Address, Port, DNS & Cara Cek Ping Jaringan',
    level: 'Beginner',
    category: 'Networking',
    summary:
      'Analogi paling mudah memahami IP Address sebagai alamat rumah, Port sebagai nomor pintu, dan DNS sebagai buku kontak internet.',
    reading_time: 6,
    tags: ['networking', 'ip', 'dns', 'ping'],
    sections: [
      {
        heading: 'Analogi Jaringan dalam Kehidupan Sehari-hari 🏘️',
        bullets: [
          '🏠 IP Address (contoh: 192.168.1.10) ibarat alamat lengkap rumah sebuah perangkat di jaringan.',
          '🚪 Port (contoh: 80, 443, 3000) ibarat nomor pintu di rumah tersebut. Pintu 443 khusus tamu HTTPS, pintu 22 khusus SSH.',
          '📖 DNS (Domain Name System) ibarat buku kontak di HP: mengubah nama yang mudah diingat (google.com) menjadi angka IP.'
        ]
      },
      {
        heading: 'Alat Cek Kesehatan Jaringan di Termux 🩺',
        table: {
          headers: ['Perintah', 'Kegunaan', 'Contoh'],
          rows: [
            ['ping', 'Cek apakah server hidup & ukur latensi (ms)', 'ping -c 4 1.1.1.1'],
            ['ip addr', 'Lihat IP lokal HP saat terhubung ke WiFi', 'ip addr show wlan0'],
            ['nslookup / dig', 'Lacak alamat IP di balik sebuah domain', 'nslookup cloudflare.com']
          ]
        },
        commands: [
          { label: '📶 Tes kecepatan respon internet ke Cloudflare', cmd: 'ping -c 4 1.1.1.1' },
          { label: '🔍 Cek IP lokal perangkat kamu', cmd: 'ifconfig || ip addr' }
        ]
      }
    ]
  },
  {
    id: 'mat-nmap-recon',
    slug: 'nmap-recon',
    title: '🔍 Nmap Dasar: Cek Perangkat & Port Terbuka di WiFi Sendiri',
    level: 'Intermediate',
    category: 'Networking',
    summary:
      'Pelajari cara menggunakan Nmap secara etis dan legal untuk mengaudit perangkat apa saja yang tersambung di jaringan lokal milikmu.',
    reading_time: 8,
    tags: ['nmap', 'recon', 'networking', 'audit'],
    sections: [
      {
        heading: 'Aturan Main & Etika Pemindaian ⚖️',
        paragraphs: [
          'Nmap adalah senter digital bagi teknisi jaringan untuk melihat perangkat aktif dan layanan apa saja yang sedang terbuka. Gunakan Nmap HANYA pada jaringan lokal milikmu sendiri atau server laboratorium uji coba yang berizin.'
        ]
      },
      {
        heading: 'Perintah Nmap yang Paling Ramah Pemula 🧭',
        table: {
          headers: ['Flag Nmap', 'Artinya', 'Kegunaan Praktis'],
          rows: [
            ['-sn', 'Ping Sweep', 'Mencari siapa saja yang online di WiFi tanpa memindai port'],
            ['-sT', 'TCP Connect Scan', 'Cocok untuk Termux non-root guna mengecek port terbuka'],
            ['-sV', 'Version Detection', 'Menebak nama & versi aplikasi yang berjalan di port'],
            ['-p 80,443,3000', 'Port Spesifik', 'Hanya memeriksa pintu tertentu biar cepat selesai']
          ]
        },
        commands: [
          { label: '📦 Install Nmap di Termux', cmd: 'pkg install nmap -y' },
          { label: '📱 Cek perangkat di WiFi rumah (sesuaikan subnet)', cmd: 'nmap -sn 192.168.1.0/24' },
          { label: '🔎 Cek port layanan di localhost sendiri', cmd: 'nmap -sT -sV -p 22,80,443,3000 127.0.0.1' }
        ]
      }
    ]
  },
  {
    id: 'mat-curl-http',
    slug: 'curl-http-testing',
    title: '📡 Belajar cURL: Cara Menguji Website & REST API dari Terminal',
    level: 'Beginner',
    category: 'Networking',
    summary:
      'Tidak butuh Postman! Pelajari cara mengambil data JSON, mengirim payload POST, dan membaca status HTTP langsung memakai cURL.',
    reading_time: 6,
    tags: ['curl', 'api', 'http', 'rest'],
    sections: [
      {
        heading: 'Kenalan dengan cURL 🌊',
        paragraphs: [
          'cURL adalah alat serbaguna untuk berkomunikasi dengan server web atau REST API lewat baris perintah. Setiap kali kamu ingin mengecek apakah API berjalan normal atau mengirim notifikasi otomatis dari skrip Bash, cURL adalah andalannya.'
        ],
        table: {
          headers: ['Flag cURL', 'Fungsi'],
          rows: [
            ['-I', 'Hanya melihat header respon server (status 200 OK, 404, dll)'],
            ['-X POST', 'Mengubah metode permintaan menjadi POST untuk mengirim data'],
            ['-H "..."', 'Menambahkan header seperti Content-Type atau X-API-Key'],
            ['-d "..."', 'Menyertakan isi data (body JSON) yang akan dikirim']
          ]
        },
        commands: [
          { label: '🌐 Cek status header website', cmd: 'curl -I https://example.com' },
          { label: '📥 Ambil daftar materi Bri Tech lewat API', cmd: 'curl -s http://localhost:3000/api/v1/materi | head -c 300' }
        ]
      }
    ]
  },
  {
    id: 'mat-ssh-tunneling',
    slug: 'ssh-tunneling',
    title: '🛡️ SSH Tunneling: Akses Layanan Lokal dengan Aman',
    level: 'Advanced',
    category: 'Networking',
    summary:
      'Teknik Local Port Forwarding memakai SSH untuk membuka database atau dasbor internal server jarak jauh seolah-olah berjalan di HP sendiri.',
    reading_time: 8,
    tags: ['ssh', 'tunneling', 'port-forwarding', 'security'],
    sections: [
      {
        heading: 'Kenapa Harus Pakai Tunneling? 🚇',
        paragraphs: [
          'Banyak layanan penting seperti database atau panel admin sengaja dikunci agar hanya bisa diakses dari localhost server itu sendiri (bukan internet umum). Dengan SSH Local Port Forwarding (-L), kamu bisa membungkus lalu lintas data tersebut di dalam koneksi SSH terenkripsi.'
        ],
        code: {
          language: 'bash',
          caption: 'tunnel.sh',
          content: `# Teruskan port 5432 di server agar bisa diakses lewat localhost:5432 di HP\nssh -N -L 5432:127.0.0.1:5432 user@ip-vps-kamu`
        }
      }
    ]
  },
  {
    id: 'mat-keamanan-web',
    slug: 'keamanan-wifi-web',
    title: '🔒 Dasar Keamanan Web: HTTPS, Header Keamanan & Cek SSL',
    level: 'Intermediate',
    category: 'Networking',
    summary:
      'Pahami cara kerja sertifikat SSL/TLS, bedanya HTTP vs HTTPS, serta cara memeriksa header keamanan website langsung dari terminal.',
    reading_time: 7,
    tags: ['https', 'ssl', 'security', 'web'],
    sections: [
      {
        heading: 'Apa Bedanya HTTP dan HTTPS? 🔐',
        paragraphs: [
          'HTTP mengirim data seperti kartu pos terbuka: siapa saja di jaringan WiFi yang sama berpotensi membacanya. HTTPS menambahkan lapisan enkripsi TLS sehingga data antara browser dan server terbungkus rapat.',
          'Selain HTTPS, situs modern juga memasang HTTP Security Headers seperti Strict-Transport-Security (HSTS) dan Content-Security-Policy (CSP) untuk melindungi pengguna.'
        ],
        commands: [
          { label: '🔍 Cek sertifikat SSL sebuah domain pakai openssl', cmd: 'echo | openssl s_client -connect google.com:443 2>/dev/null | openssl x509 -noout -dates' },
          { label: '📋 Intip header keamanan website', cmd: 'curl -sI https://google.com | grep -iE "strict|content-security|x-frame"' }
        ]
      }
    ]
  },
  {
    id: 'mat-bash-dasar',
    slug: 'bash-variabel-kondisi',
    title: '⚡ Dasar Bash Script: Variabel, Input & Percabangan If-Else',
    level: 'Beginner',
    category: 'Automation',
    summary:
      'Mulai bikin skrip pintar pertama kamu! Belajar menyimpan nilai ke variabel, menyapa pengguna dengan read, dan membuat keputusan dengan if-else.',
    reading_time: 7,
    tags: ['bash', 'scripting', 'pemula', 'automation'],
    sections: [
      {
        heading: 'Aturan Emas Menulis Variabel di Bash 📌',
        paragraphs: [
          'Satu jebakan yang paling sering dialami pemula di Bash: saat mengisi variabel, JANGAN kasih spasi di kiri dan kanan tanda sama dengan (=)! Tulis NAMA="Budi", bukan NAMA = "Budi".'
        ],
        code: {
          language: 'bash',
          caption: 'cek-umur.sh',
          content: `#!/bin/bash\nread -p "Siapa nama kamu? " NAMA\necho "Halo $NAMA! 👋"\n\nread -p "Berapa target belajar hari ini (menit)? " MENIT\nif [ "$MENIT" -ge 30 ]; then\n  echo "🔥 Mantap! Konsisten $MENIT menit sehari bikin cepat jago."\nelse\n  echo "👍 Bagus, yang penting rutin tiap hari!"\nfi`
        },
        commands: [
          { label: '⚡ Beri izin dan jalankan skrip', cmd: 'chmod +x cek-umur.sh && ./cek-umur.sh' }
        ]
      }
    ]
  },
  {
    id: 'mat-jq-json',
    slug: 'jq-json-parsing',
    title: '🧩 Mengolah Data JSON API dengan Mudah Pakai jq',
    level: 'Intermediate',
    category: 'Automation',
    summary:
      'Output API sering kelihatan berantakan? Pakai jq di Termux untuk mewarnai, menyaring, dan mengambil nilai tertentu dari data JSON dalam sekejap.',
    reading_time: 6,
    tags: ['jq', 'json', 'api', 'automation'],
    sections: [
      {
        heading: 'Kenapa jq Wajib Dimiliki Pengguna API? ✨',
        paragraphs: [
          'Hampir semua API modern mengirimkan data dalam format JSON. Kalau dibaca mentah-mentah di layar HP pasti pusing. Dengan jq, kamu bisa merapikan indentasi sekaligus mengambil field tertentu saja.'
        ],
        commands: [
          { label: '📦 Pasang jq di Termux', cmd: 'pkg install jq -y' },
          { label: '✨ Ambil semua judul materi dari API Bri Tech', cmd: 'curl -s http://localhost:3000/api/v1/materi | jq ".items[].title"' },
          { label: '📊 Cek jumlah total materi yang tersimpan', cmd: 'curl -s http://localhost:3000/api/v1/materi | jq ".total"' }
        ]
      }
    ]
  },
  {
    id: 'mat-cron-scheduler',
    slug: 'cron-job-scheduler',
    title: '⏰ Menjalankan Tugas Otomatis Terjadwal (Cron & Termux Job)',
    level: 'Advanced',
    category: 'Automation',
    summary:
      'Ingin skrip backup atau pengecekan server jalan otomatis tiap jam tanpa disentuh? Pelajari sintaks jadwal Cron dan Termux Job Scheduler.',
    reading_time: 7,
    tags: ['cron', 'scheduler', 'automation', 'background'],
    sections: [
      {
        heading: 'Membaca 5 Bintang Jadwal Cron 🌟',
        paragraphs: [
          'Format Cron terdiri dari 5 kolom waktu berurutan: Menit (0-59), Jam (0-23), Tanggal (1-31), Bulan (1-12), dan Hari (0-6). Tanda bintang (*) artinya "setiap".'
        ],
        table: {
          headers: ['Ekspresi Cron', 'Jadwal Jalan'],
          rows: [
            ['*/15 * * * *', '⏱️ Setiap 15 menit sekali'],
            ['0 7 * * *', '🌅 Setiap hari tepat pukul 07:00 pagi'],
            ['0 0 * * 0', '📅 Setiap hari Minggu tengah malam (00:00)']
          ]
        },
        commands: [
          { label: '📦 Pasang paket cronie di Termux', cmd: 'pkg install cronie -y' },
          { label: '📝 Edit daftar jadwal tugas otomatis', cmd: 'crontab -e' }
        ]
      }
    ]
  },
  {
    id: 'mat-automation',
    slug: 'automation',
    title: '🤖 Automasi Lengkap: Skrip Pemantau & Notifikasi Real-Time API',
    level: 'Advanced',
    category: 'Automation',
    summary:
      'Gabungkan semua ilmu Bash, cURL, dan API Key untuk membuat skrip pemantau penyimpanan yang langsung mengirim notifikasi real-time ke dasbor Bri Tech!',
    reading_time: 9,
    tags: ['bash', 'automation', 'api', 'webhook'],
    sections: [
      {
        heading: 'Menghubungkan Terminal ke Dasbor Real-Time 🔗',
        paragraphs: [
          'Ini bagian paling seru! Skrip Bash di HP atau server kamu bisa langsung berbicara dengan dasbor web Bri Tech ini secara real-time. Begitu skrip dijalankan, notifikasi langsung muncul seketika di browser lewat WebSocket 🚀.',
          'Caranya mudah: buat API Key dulu di tab "Manajemen & API → API Keys", lalu masukkan ke skrip di bawah ini.'
        ],
        code: {
          language: 'bash',
          caption: 'disk-alert.sh',
          content: `#!/bin/bash\nAPI_URL="http://localhost:3000/api/v1/notifications"\nAPI_KEY="MASUKKAN_API_KEY_ANDA"\nUSAGE=$(df / | awk 'NR==2 {gsub("%",""); print $5}')\n\ncurl -s -X POST "$API_URL" \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: $API_KEY" \\\n  -d "{\n    \\"title\\": \\"Laporan Penyimpanan Server\\",\n    \\"message\\": \\"Penggunaan disk saat ini berada pada \${USAGE}%.\\",\n    \\"type\\": \\"info\\",\n    \\"source\\": \\"api\\"\n  }"`
        },
        commands: [
          { label: '🚀 Jalankan skrip pemantau dengan aman', cmd: 'bash -euo pipefail disk-alert.sh' },
          { label: '📊 Cek jumlah panggilan API dari terminal', cmd: 'curl -s http://localhost:3000/api/v1/analytics/summary | jq ".kpis.totalApiCalls"' }
        ]
      }
    ]
  }
];

export const INITIAL_MATERI: SeedMateri[] = [...BASE_MATERI, ...EXTRA_MATERI];

