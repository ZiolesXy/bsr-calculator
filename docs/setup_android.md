# Panduan Lengkap Vite APK (Capacitor)

## 1. Persiapan

Install tools berikut:

- Node.js & npm
- Android Studio (SDK lengkap)
- Project Vite siap (`npm run dev` jalan)

Install Capacitor:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

Build Vite:

```bash
npm run build
```

Tambahkan Android:

```bash
npm install @capacitor/android
npx cap add android
npx cap sync
```

## 2. Update & Rebuild APK

Setiap ada perubahan frontend:

```bash
npm run build
npx cap copy android
```

Kalau ada perubahan plugin:

```bash
npx cap sync android
```

Update versi APK:

```bash
android/app/build.gradle
versionCode 2
versionName "1.1"
```

Build APK di Android Studio:

- Build > Build APK(s)
- atau Generate Signed APK untuk release

## 3. Hapus Platform Android

Jika ingin reset atau hapus:

```bash
rm -rf android
npm uninstall @capacitor/android
```

## 4. Troubleshooting

- Blank screen → pastikan base: `'./'` di `vite.config`
- Perubahan tidak muncul → jalankan ulang build & sync
- Error build → coba hapus android & add ulang

## 5. Workflow Cepat

```bash
npm run build && npx cap copy android
```

Kalau plugin berubah:

```bash
npx cap sync android
```

Kalau mau build APK:

1. Buka project Android Studio
2. Jalankan sync jika perlu
3. Build > Build APK(s)

## Catatan Project Ini

Project ini memakai:

- `appId`: `com.bsrcalc.app`
- `appName`: `BSR Calc`
- `webDir`: `dist`

Jadi setelah `npm run build`, hasil web app harus ada di `dist/` sebelum disalin ke Android.

