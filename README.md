# BSR Resource Planner

BSR Resource Planner adalah aplikasi React + TypeScript untuk menghitung kebutuhan resource `Character`, `Weapon`, `Skill`, `Stamp`, dan `Extra tools` dalam satu UI yang responsif untuk desktop dan mobile.

## Fitur

- `Character` calculator
  - hitung total EXP, missing EXP, kans, ascension kans, dan essence
  - support mode material `green only`, `blue only`, `purple only`, `yellow only`, dan `mixed recommendation`
- `Weapon` calculator
  - hitung tamahagane EXP, gold, ascension kans, dan hammer
  - support recommendation material seperti character
- `Skill` calculator
  - hitung kebutuhan art, passive omamori, dan kans
  - support multi-select skill type
- `Stamp` calculator
  - `Core Stamp`: card EXP, ectoplasm, dan kans
  - `Set Stamp`: sama seperti core, ditambah `Nexus Stamp`
  - `Nexus Stamp` unfarmable dengan progres level `1-10`, `10-15`, `15-20`, `20-25`, `25-30`
- `Extra`
  - `Total Planner`: gabungan input `Character + Weapon + Skill + Core Stamp + Set Stamp`
  - `Overview`: ringkasan total hasil gabungan
  - `Daily Schedule`: manual setup atau pack `Character`, `Core Stamp`, dan `Set Stamp`
- `Settings`
  - theme switcher dengan persistence ke `localStorage`
- Mobile UX
  - main menu mobile
  - back navigation
  - loading state saat masuk `Extra > Total Planner`

## Tech Stack

- React 19
- TypeScript
- Vite
- CSS modular by feature classes

## Menjalankan Project

Install dependency:

```bash
npm install
```

Jalankan mode development:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Preview hasil build:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

## Struktur Folder

```text
src/
  components/
    character/
      CharacterTab.tsx
    weapon/
      WeaponTab.tsx
    skill/
      SkillTab.tsx
    stamp/
      StampInputs.tsx
      StampPage.tsx
      StampTab.tsx
    extra/
      ExtraTab.tsx
      ExtraOverviewContent.tsx
      ExtraOutputPanel.tsx
      ExtraTotalPlannerContent.tsx
    settings/
      SettingsTab.tsx
    common/
      MobileBackbar.tsx
      MobileMenu.tsx
      PillInput.tsx
      RecommendationCard.tsx
      SelectField.tsx
      StatCard.tsx
      TabNavigation.tsx
  context/
    AppStateContext.tsx
  hooks/
    useCharacterCalculator.ts
    useResponsive.ts
    useSkillCalculator.ts
    useStampCalculator.ts
    useTheme.ts
    useTotalPlannerInit.ts
    useWeaponCalculator.ts
  data/
    character-pack.json
    default-app-state.json
    default-settings.json
    farming-rewards.json
    levels.json
    themes.json
  types/
    index.ts
  utils/
    calculator.ts
    formatter.ts
  App.tsx
  App.css
  index.css
```

## Arsitektur

### 1. Global Calculator State

State utama disimpan di `AppStateContext`:

- `characterState`
- `weaponState`
- `skillState`
- `stampCoreState` dan `stampSetState`

State dipisah per context slice agar update satu domain tidak memicu render domain lain secara berlebihan.

### 2. Business Logic

Perhitungan dipisah ke:

- `src/utils/calculator.ts`
- `src/hooks/useCharacterCalculator.ts`
- `src/hooks/useWeaponCalculator.ts`
- `src/hooks/useSkillCalculator.ts`
- `src/hooks/useStampCalculator.ts`

Semua kalkulasi utama memakai `useMemo` di level hook.

### 3. App-Level Hooks

- `useTheme`
  - handle active theme
  - sync ke `localStorage`
  - apply CSS variables ke `document.documentElement`
- `useResponsive`
  - handle mobile/desktop state
  - handle mobile menu/page flow
- `useTotalPlannerInit`
  - handle preset default saat pertama kali masuk `Extra > Total Planner`

## Performance Notes

Beberapa optimasi yang sudah diterapkan:

- split context per domain state
- memoized calculator hooks
- memoized common navigation components
- memoized heavy tab components
- `startTransition` saat pindah ke tab berat
- loading state untuk `Extra > Total Planner`

## Behavior Penting

- `Extra > Total Planner` memakai preset default tertinggi saat pertama dibuka
- `Total Planner` hanya menampilkan input gabungan dan satu `Extra Output`
- `Daily Schedule` menyediakan tiga pilihan pack: `Character`, `Core Stamp`, dan `Set Stamp`
- `Nexus Stamp` tidak masuk ke farming schedule karena unfarmable
- recommendation material tetap mempertahankan behavior lama
- mobile flow tetap memakai main menu lalu back ke menu

## Catatan Pengembangan

Kalau mau menambah tool baru:

1. Tambah tab atau subtab baru di `App.tsx`
2. Buat komponen baru di `components/`
3. Kalau ada hitungan baru, letakkan di `hooks/` atau `utils/`
4. Kalau butuh state lintas halaman, tambahkan slice context baru atau extend state yang ada

## Status

Project dalam kondisi buildable terakhir:

```bash
npm run build
```

berhasil tanpa error.
