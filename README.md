# PawMaster Pro

PawMaster Pro သည် ခွေးလေးများကို မြန်မာဘာသာဖြင့် အဆင့်ဆင့် လေ့ကျင့်ပေးနိုင်သော React + TypeScript + Vite Progressive Web App (PWA) ဖြစ်ပါသည်။

## 1. လိုအပ်ချက်များ

- Node.js 20 သို့မဟုတ် 22
- npm
- VS Code (အကြံပြု)

## 2. Local မှာ Run လုပ်ရန်

Project folder (`pawmaster-vite-ts`) အတွင်း Terminal ဖွင့်ပြီး —

```bash
npm install
npm run dev -- --host
```

Browser မှာ Terminal ပြထားသော `http://localhost:5173` ကို ဖွင့်ပါ။ ဖုန်းကနေ စမ်းရန် ကွန်ပျူတာနှင့် ဖုန်းကို Wi-Fi တစ်ခုတည်း ချိတ်ပြီး Terminal ပြသော Network URL ကို ဖွင့်နိုင်ပါသည်။

## 3. Build စမ်းသပ်ရန်

```bash
npm run build
npm run preview -- --host
```

Production build ကို `dist/` folder ထဲ ထုတ်ပေးပါမည်။ `dist/` ကို GitHub repository ထဲ ကိုယ်တိုင် upload လုပ်ရန် မလိုပါ။ GitHub Actions က build လုပ်ပြီး Pages သို့ deploy ပေးပါမည်။

## 4. GitHub Pages သို့ တင်ရန်

1. ZIP ကို Extract လုပ်ပါ။ အတွင်းရှိ `pawmaster-vite-ts` folder ကို ဖွင့်ပါ။
2. အဲဒီ folder **အတွင်းက ဖိုင်များနှင့် `.github` folder ကို repository root သို့** တင်ပါ။ `pawmaster-vite-ts` ဆိုသော outer folder ကို ထပ်မထည့်ပါနှင့်။
3. GitHub repository ၏ `main` သို့မဟုတ် `master` branch ကို Push လုပ်ပါ။
4. GitHub repository → **Settings → Pages → Build and deployment → Source** တွင် **GitHub Actions** ကို ရွေးပါ။
5. **Actions** tab တွင် “Build and deploy PawMaster Pro to GitHub Pages” workflow အောင်မြင်ပြီးပါက Pages URL ကို ဖွင့်ပါ။

`.github/workflows/deploy.yml` သည် repository name ကို အလိုအလျောက်ဖတ်ပြီး Vite `base` path ကို သတ်မှတ်ပေးသောကြောင့် `https://<username>.github.io/<repository-name>/` ပုံစံ Project Pages အတွက် ပြင်ဆင်ထားပါသည်။

### Git ဖြင့်တင်လိုပါက

GitHub မှာ repository အသစ်ဖန်တီးပြီး ဒီ project folder အတွင်း Terminal မှာ အောက်ပါ command များကို အသုံးပြုပါ။ `<username>` နှင့် `<repository-name>` ကို မိမိတန်ဖိုးဖြင့် အစားထိုးပါ။

```bash
git init
git add .
git commit -m "Prepare PawMaster Pro for GitHub Pages"
git branch -M main
git remote add origin https://github.com/<username>/<repository-name>.git
git push -u origin main
```

## 5. PWA / Offline အသုံးပြုမှု

- Production build တင်ပြီး HTTPS URL မှ ဖွင့်ပါ။ GitHub Pages သည် HTTPS ပေးပါသည်။
- Android Chrome တွင် Install prompt ပေါ်လာလျှင် Install App ကိုနှိပ်နိုင်ပါသည်။ iPhone/iPad တွင် Safari → Share → Add to Home Screen ကို အသုံးပြုပါ။
- Service Worker သည် App shell နှင့် အသုံးပြုထားသော static assets များကို cache လုပ်ပေးပါသည်။ ပထမအကြိမ် online ဖွင့်ပြီး cache ပြည့်မှ Offline စမ်းသပ်ပါ။

## 6. Data သိမ်းဆည်းပုံနှင့် အရေးကြီးသတိပြုရန်

- Dog Profile, Training Progress, Routine checklist နှင့် setting အချို့ကို Zustand Persist ဖြင့် Browser Local Storage ထဲ သိမ်းပါသည်။
- Training History ကိုလည်း Local Storage ထဲ သိမ်းပါသည်။
- **လက်ရှိ Version တွင် Cloud Database / Account Login / Multi-device Sync မပါဝင်သေးပါ။** Data သည် အသုံးပြုနေသော Browser နှင့် Device အတွင်းသာ ရှိသည်။ Browser data ကို Clear လုပ်ခြင်း၊ App data ကို ဖျက်ခြင်း သို့မဟုတ် အခြားဖုန်းသို့ပြောင်းခြင်းကြောင့် Data ပျောက်နိုင်ပါသည်။ အရေးကြီးသော မှတ်တမ်းများအတွက် backup/export feature ကို နောက်ထပ်အဆင့်တွင် ထည့်သွင်းရန် လိုအပ်ပါသည်။

## 7. Project Structure

```text
pawmaster-vite-ts/
├── .github/workflows/deploy.yml
├── public/
│   ├── .nojekyll
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── paw-icon.svg
│   ├── paw-icon-192.png
│   ├── paw-icon-512.png
│   ├── apple-touch-icon.png
│   └── pawmaster-puppy.jpg
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── components/
│   ├── hooks/
│   ├── schemas/
│   └── store/
├── index.html
├── package.json
└── vite.config.ts
```

## 8. Troubleshooting

- **GitHub မှာ အဖြူမျက်နှာပြင်** — Actions workflow build အောင်မြင်/မအောင်မြင်ကို စစ်ပါ။ Pages Source ကို GitHub Actions ရွေးထားကြောင်း စစ်ပါ။
- **App အဟောင်းပဲ ပေါ်နေခြင်း** — Browser cache/Service Worker ဟောင်းကို ဖယ်ရှားပြီး page ကို reload လုပ်ပါ။
- **Install မပေါ်ခြင်း** — HTTPS ဖြင့် production URL ကိုဖွင့်ပါ၊ online အခြေအနေတွင် အရင်ဖွင့်ပါ၊ browser ၏ Install/Add to Home Screen menu ကို အသုံးပြုပါ။
- **Data မတွေ့ခြင်း** — မူလအသုံးပြုခဲ့သော Browser နှင့် Device တူညီကြောင်း စစ်ပါ။ Local Storage Data သည် browser တစ်ခုမှ တစ်ခုသို့ အလိုအလျောက် မကူးပါ။
