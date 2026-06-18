# 🖥️ Hivora Desktop Application

> Multi-AI Coordination Platform - Desktop Client

Masaüstü uygulaması kullanarak yerel veya bulut modunda AI agent'lerini koordine edin.

## 🎯 Özellikler

- ⚡ **Cloud Mode**: Web server'a bağlı tam özellikli deneyim
- 💾 **Local Mode**: Internet olmadan çalış, tüm veriler lokal
- 🤖 **Agent Management**: Claude, Cursor, Copilot vs takip et
- 🔒 **Symbol-Level Locks**: Gerçek zamanlı kilit görselleştirmesi
- 📊 **Kanban Board**: Task management ve drag-drop
- 🔄 **Real-Time Sync**: WebSocket ile anlık güncelleme
- 📦 **Auto-Update**: Electron-updater ile otomatik güncelleme

## 📋 Sistem Gereksinimleri

- Windows 10+ (64-bit) veya macOS 12+
- 8 GB RAM minimum (16 GB önerilen)
- 500 MB disk space
- Internet (Cloud mode için)

## 🚀 Kurulum

### 📥 Önceden Derlenmiş Installer İndir

#### Windows
- **File**: `Hivora Setup 0.1.0.exe` (76 MB)
- **Download**: [GitHub Releases](https://github.com/hivora/desktop-releases/releases)
- **Installation**: Çalıştır → Next → Finish
- **Warning**: SmartScreen uyarısı alırsa "More info" → "Run anyway" tıkla

#### macOS
- **File**: `Hivora-0.1.0.dmg` (Intel & Apple Silicon)
- **Download**: [GitHub Releases](https://github.com/hivora/desktop-releases/releases)
- **Installation**: DMG'yi aç → Drag Hivora to Applications
- **Warning**: Gatekeeper uyarısı alırsa Right-click → Open tıkla

#### Linux
- **File**: `Hivora-0.1.0.AppImage`
- **Download**: [GitHub Releases](https://github.com/hivora/desktop-releases/releases)
- **Installation**: `chmod +x Hivora-0.1.0.AppImage && ./Hivora-0.1.0.AppImage`

### Geliştirme için Kurulum

```bash
# Repository'i clone et
git clone <repo-url>
cd apps/desktop

# Dependencies kur
npm install

# Development modda çalıştır
npm run dev

# Production build (mevcut OS için)
npm run build
```

### Platform-Specific Build

#### Windows'ta Windows Installer Yap
```bash
npm run build:win
# Output: release/Hivora Setup 0.1.0.exe
```

#### Mac'te macOS Installer Yap
```bash
npm run build:mac
# Output: release/Hivora-0.1.0.dmg
# Not: Notarization gerekli prodüksyon için
```

#### Linux'ta AppImage Yap
```bash
npm run build:linux
# Output: release/Hivora-0.1.0.AppImage
```

**Not**: Her platform'da build yapabilmek için o platform'da çalıştırman gerekir (cross-compilation sınırlama).

## 🔧 Yapılandırma

### Environment Variables

`.env.local` dosyası oluştur:

```
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=ws://localhost:4000
ELECTRON_ENABLE_LOGGING=1
```

### Cloud Mode

Cloud mode'da kullanabilmek için:

1. Web uygulamasında oturum aç (http://localhost:3000)
2. Organization oluştur
3. Desktop uygulamasını başlat
4. "Cloud" modunu seç
5. Otomatik olarak bağlanacak

### Local Mode

Yerel modda kullanımı:

1. Desktop uygulamasını başlat
2. "Local" modunu seç
3. Demo project'ler hazır olacak
4. Tamamen çevrimdışı çalışır

## 💡 Kullanım

### Modu Değiştir

- Header'da "Cloud" veya "Local" butonuna tıkla
- **Cloud**: Server'a bağlı, tüm veriler sync
- **Local**: Lokal only, offline çalışma

### Project Seç

Sol sidebar'da "Projects" bölümünde:
- Proje adını tıkla
- Sağ tarafta board yüklenir

### Agent'leri Takip Et

"Agents" bölümünde:
- Aktif agent'leri gör
- Status'unu takip et (working/idle)
- Rollerini anla

### Lock'ları Görmek

"Active Locks" bölümünde:
- Hangi agent hangi dosyayı kilit aldığını gör
- Lock süresini takip et
- Conflikt'leri önceden göz önüne al

### Task Board'u Kullan

Kanban board'da:
- Task'ları sürükle → Todo/In Progress/Done
- Yeni task ekle (+)
- Task detaylarını gör
- Öncelik ayarla

## 🐛 Troubleshooting

### "Connection Failed" Cloud Mode'da

```
✓ Çözüm:
- Web uygulamasında oturum aç
- API server'ın çalıştığını kontrol et (http://localhost:4000)
- Local mode'a geç ve test et
```

### "Cannot connect to database"

```
✓ Çözüm:
- PostgreSQL'in çalıştığını kontrol et
- .env dosyasındaki DATABASE_URL'i kontrol et
- npm run db:migrate çalıştır
```

### Window açılmıyor

```
✓ Çözüm:
- Terminal'de npm run dev çalıştır
- DevTools açılacak (F12)
- Console'da hata mesajlarını kontrol et
- Electron logs'u kontrol et: ~/.electron-logs/
```

### Auto-update hataları

```
✓ Çözüm:
- Firewall'a izin ver
- GitHub releases'ten manuel indirme yap
- Uygulamayı kapat, .exe dosyasını sil, yenisini kur
```

## 🔐 Güvenlik

- ✅ Context isolation: Node.js erişimi yok
- ✅ Preload script: Safe API bridge
- ✅ HTTPS: Production'da şifreli iletişim
- ✅ Token storage: Secure storage (OS keychain)
- ✅ No localStorage: Veriler memory'de

**Eğer hassas proje ile çalışıyorsanız Local Mode kullanın.**

## 📊 Performans

- Startup time: ~2 saniye
- Memory usage: ~150 MB (minimum)
- CPU: Mostly idle, event-driven
- Network: Polling free, WebSocket events

Performans düşerse:
1. Local mode dene
2. Ekran ayarlarını azalt
3. Eski task'ları sil
4. Uygulamayı restart et

## 🚀 Deployment

### Windows Installer Dağıt

```bash
# Generate installer
npm run build:win

# File: release/Hivora Setup 0.1.0.exe
# Dağıt: Website download sayfasında host et
# Size: ~76 MB
```

### macOS Build

```bash
# Generate DMG
npm run build:mac

# File: release/Hivora-0.1.0.dmg
# Notarization gerekli (Apple'dan)
```

### Auto-Update Setup

1. GitHub repository oluştur: `hivora/desktop-releases`
2. Releases'e .exe/.dmg ekle
3. electron-updater otomatik kontrol eder
4. Kullanıcılar otomatik update alır

## 📝 License

Hivora Desktop - All rights reserved.

## 🤝 İletişim

- Documentation: `/how-it-works` sayfası
- Issues: GitHub
- Email: support@hivora.local

---

**Happy orchestrating! 🎉**
