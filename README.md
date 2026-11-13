# Kuryentipid

Kuryentipid estimates household electricity use and cost from appliance schedules, published model ratings, and a local electricity rate. The catalog includes 30 models across 18 appliance types. Each model links to its manufacturer specification or Philippine Department of Energy label. Personal profiles, appliances, icons and goals are saved in the visitor’s browser.

## Explore the dashboard

- **Home** shows a segmented bar of each appliance’s share of the monthly estimate. Larger households group the remaining appliances after the top five.
- **Appliances** lets you search the catalog by brand, model, or type. Choose a device pictogram or upload a personal icon when adding or editing an appliance.
- **Profile → Edit profile** lets you choose, preview, replace or remove your profile picture. Save the profile to keep the picture in this browser.
- **Energy report** includes an animated sample trend, alongside household rankings calculated from saved settings. Select kWh or pesos to change units.
- **Tips & tricks** provides appliance-specific advice and links to its sources. **Profile → About us** credits the four AMIS U team members.
- **Appliance → History** stores monthly kWh readings entered from a meter or appliance app. Consecutive months show the change in measured use.
- **Settings → Notifications** turns on alerts for projected monthly spending and an optional kWh limit. Set the first warning as a percentage of your budget. The app also alerts when the estimate reaches your full budget. The kWh limit applies to the forecast and to the sum of appliance readings you enter for the current calendar month. Each alert identifies its basis. The Home bell opens the history.

Alerts are calculated when the app opens, returns to view, or saves household changes. In-app alerts also work in the standalone preview. On the hosted HTTPS site or localhost, supported browsers can show a device notification after the visitor enables it and grants permission. Forecasts use saved schedules. There is no live meter connection or closed-app background monitoring.

For a wattage-based model, monthly kWh is watts ÷ 1,000 × daily hours × days used per week ÷ 7 × 30 × quantity. Refrigerator models with a published monthly energy label use that figure times the quantity. Cost is estimated kWh times the saved rate. Usage schedules and the starting electricity rate are examples. Check each device’s rating description for its operating condition, such as maximum input, idle power, or power while printing.

## Run locally

Install Python 3.12, extract the project, and open a terminal in the folder containing `app.py`.

**Windows PowerShell**

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m flask --app app run
```

**macOS or Linux**

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m flask --app app run
```

Open [the local dashboard](http://127.0.0.1:5000). Press Ctrl+C in the terminal to stop the server.

## Deploy through GitHub and Vercel

1. Create a GitHub repository. Upload or commit the **extracted files** so that `app.py`, `requirements.txt`, and `public/` appear together at the repository root. Include `.python-version` and `.gitignore`.
2. In Vercel, choose **Add New → Project**, then import the GitHub repository.
3. Set **Root Directory** to the folder containing `app.py`. If you uploaded the files at the repository root, keep the default.
4. Use the detected **Flask** framework, keep the default build and output settings, and choose **Deploy**. Open the deployment URL when Vercel finishes.

The module-level `app` in `app.py` is the entry point. Vercel serves CSS, scripts, and images from `public/`. See [Vercel’s Flask deployment guide](https://vercel.com/kb/guide/ship-a-flask-app-on-vercel).

## Project files

```text
app.py                     Flask application and home route
requirements.txt           Python dependency
.python-version            Python runtime version
.gitignore                 Local files excluded from Git
public/index.html          Single page (served by Flask, Vercel and Android)
public/manifest.json       Web app manifest
public/icons/              App icons (192, 512)
assets/                    Icon and splash sources for @capacitor/assets
capacitor.config.json      Android wrapper settings
package.json               Capacitor dependencies and scripts
public/css/styles.css      Responsive desktop and mobile layouts
public/css/editor.css      Appliance and settings dialogs
public/js/app.js           Dashboard, reports, navigation, and profile
public/js/catalog.js       Model specifications and primary-source links
public/js/energy.js        Energy calculations, presets, and local storage
public/js/photos.js        Local image validation, resizing and portrait cropping
public/js/alerts.js        Budget and usage thresholds, history and delivery
public/notification-sw.js  Opens the alert inbox from a device notification
public/js/editor.js        Appliance editor and savings calculator
public/js/icons.js         Interface icons
public/js/tips.js          Appliance tips and source links
public/js/trend.js         Interactive sample energy chart
public/css/trend.css       Chart layout and motion
public/js/team.js          Team credits and About page
public/css/team.css        Team page layout
public/assets/wordmark.svg Kuryentipid wordmark
public/assets/brandmark.svg App symbol and favicon
public/assets/team/        Four portraits from the supplied team screenshot
```

## Build the Android app (Capacitor)

The Android app wraps `public/` as is. Flask is not used in the app. Install Node 20 or later and Android Studio first.

```sh
npm install
npx cap add android          # first time only, creates the android/ folder
npm run assets               # app icon and splash from assets/
npm run sync                 # run again after every change in public/
npm run open                 # opens Android Studio; press Run on a phone or emulator
```

In Android Studio, **Build → Build Bundle(s) / APK(s) → Build APK(s)** makes an installable debug APK.

Notes: alerts currently use the browser Notification API and a service worker. Android WebView support for that is limited, so the next step is `@capacitor/local-notifications` for reliable device alerts. Data is saved in WebView storage; `@capacitor/preferences` is the safer long-term store.

### Build the APK on GitHub (no Android Studio)

Push the project to GitHub. The workflow in `.github/workflows/android-apk.yml` builds a debug APK on every push to `main`. Open the repository's **Actions** tab, click the latest run, and download **Kuryentipid-debug-apk** under Artifacts. Unzip it, copy `app-debug.apk` to the phone, and install it (allow "install unknown apps" when asked). It is free for public repositories.
