# Hivora - Multi-AI Orchestrator Platform

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![Status: Beta](https://img.shields.io/badge/Status-Beta%20%2F%20Active%20Development-orange.svg)](#)
[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?style=flat&logo=githubsponsors)](https://github.com/sponsors/Enard52)

> ⚠️ **Status: Active Beta Development** — We are actively welcoming community contributions, bug reports, and feedback! Check our [Issues](https://github.com/Enard52/Hivora/issues) tab for `good first issue` and `help wanted` tasks.

**Ücretsiz & Açık Kaynak İnsan-AI İşbirliği Ortamı**

Hivora, aynı proje üzerinde çalışan birden fazla insan geliştirici ve birden fazla AI aracını (Cursor, Claude Code, GitHub Copilot, vb.) tek bir merkezi koordinasyon katmanı altında bir araya getiren platformdur.

## Özellikler

### 🎯 MVP Özellikleri
- **Sembol Seviyesinde İzolasyon**: Fonksiyon/sınıf/modül seviyesinde kilit alma
- **Git-Native Durum Yönetimi**: `agents/todo/`, `agents/doing/`, `agents/done/` branch yapısı
- **Editör-Agnostik Mimari**: MCP, LSP, CLI protokolleri ile her editör desteği
- **İnsan-AI Karma Panosu**: Web tabanlı gerçek zamanlı Kanban panosu
- **Otomatik Bütünlük Doğrulaması**: Lint, tip kontrolü ve birim test entegrasyonu
- **Paralel Worktree Yönetimi**: Her AI için izole Git worktree'leri

## Proje Yapısı

```
hivora/
├── core/                 # Backend (Node.js + TypeScript)
│   ├── src/
│   │   ├── index.ts      # Express API server
│   │   ├── lock/         # Sembol kilitleme modülü
│   │   ├── git/          # Git worktree yönetimi
│   │   └── mcp/          # MCP Host server
│   └── package.json
├── dashboard/            # Frontend + Electron (React + TypeScript)
│   ├── src/
│   │   ├── components/   # React komponentleri
│   │   ├── App.tsx       # Ana uygulama
│   │   └── main.tsx      # React entry point
│   ├── electron/         # Electron dosyaları
│   │   ├── main.ts       # Electron main process
│   │   └── preload.js    # IPC bridge
│   └── package.json
└── README.md
```

## Kurulum

### Gereksinimler
- Node.js 18+ ve npm
- Git
- Windows, macOS veya Linux

### Adım 1: Core Backend Kurulumu

```bash
cd core
npm install
npm run build
```

### Adım 2: Dashboard Kurulumu

```bash
cd dashboard
npm install
```

## Geliştirme (Development)

### Backend'i Ayrı Çalıştırma

```bash
cd core
npm run build
node dist/index.js
```

Backend `http://localhost:3000` adresinde çalışacaktır.

### Dashboard'u Ayrı Çalıştırma

```bash
cd dashboard
npm run dev:vite
```

Dashboard `http://localhost:5173` adresinde çalışacaktır.

### Tam Uygulamayı Çalıştırma (Electron ile)

```bash
cd dashboard
npm run dev
```

Bu komut hem backend'i hem de Electron desktop uygulamasını aynı anda çalıştırır.

## Build (Dağıtım Paketi Oluşturma)

### Windows (.exe) için Build

```bash
cd dashboard
npm run build:win
```

Çıktı: `release/Hivora Setup 1.0.0.exe`

### macOS (.dmg) için Build

```bash
cd dashboard
npm run build:mac
```

Çıktı: `release/Hivora-1.0.0.dmg`

### Linux (AppImage) için Build

```bash
cd dashboard
npm run build:linux
```

Çıktı: `release/Hivora-1.0.0.AppImage`

## API Endpoints

### Health Check
```
GET http://localhost:3000/api/health
```

### Locking API
```
GET    /api/locks              # Tüm kilitleri listele
POST   /api/locks/lock         # Kilit al
POST   /api/locks/unlock       # Kilit bırak
```

### MCP Server
MCP server `stdio` üzerinden çalışır ve şu tool'ları sunar:
- `get_locks` - Aktif kilitleri listele
- `lock_symbol` - Sembol kilitle
- `unlock_symbol` - Kilit bırak

## Teknoloji Stack

| Katman | Teknoloji |
|--------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS v4 |
| **Desktop** | Electron 29 |
| **Backend** | Node.js, Express |
| **MCP** | Model Context Protocol SDK |
| **Git** | isomorphic-git |
| **Build** | Vite, electron-builder |

## Kullanım

1. **Projeyi Aç**: Hivora uygulamasını başlat ve çalışmak istediğin projeyi seç
2. **AI Ajanları Ekle**: Cursor, Claude Code, veya diğer AI araçlarını bağla
3. **Görev Ata**: Kanban panosunda görevleri AI veya insan takım üyelerine ata
4. **Sembol Kilitle**: AI'ların çakışmasını önlemek için fonksiyonları kilitle
5. **İzle ve Yönet**: Gerçek zamanlı olarak tüm aktiviteleri izle

## İş Modeli

**"Anlaşma Yapanlara Reklam, Herkese Ücretsiz"**

- **Core**: Her zaman ücretsiz ve açık kaynak (MIT/Apache-2.0)
- **Partner Editörler**: Resmi partnerlik anlaşması yapan editörlere özel tanıtım
- **Cloud Hosting**: Opsiyonel yönetilen cloud instance (ücretli)
- **Enterprise Destek**: Büyük ekipler için SLA ve kurumsal destek (ücretli)

## Katkıda Bulunma

1. Fork yap
2. Feature branch oluştur (`git checkout -b feature/amazing-feature`)
3. Commit yap (`git commit -m 'Add amazing feature'`)
4. Push yap (`git push origin feature/amazing-feature`)
5. Pull Request aç

## Lisans

Bu proje [Apache 2.0 Lisansı](./LICENSE) ile lisanslanmıştır. © 2024-2026 Hivora. 

*Not: Apache 2.0 Lisansı kodun açık kaynak kullanımını sağlarken "Hivora" ticari markasını ve ismini koruma altına alır.*

## Topluluk & Destek

- GitHub Repository: [github.com/Enard52/Hivora](https://github.com/Enard52/Hivora)
- Issues & Hata Bildirimi: [github.com/Enard52/Hivora/issues](https://github.com/Enard52/Hivora/issues)

---

**Not**: Bu proje aktif geliştirme aşamasındadır. MVP sürümü temel özellikleri içerir.
