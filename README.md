# 💻 Suc

Suc is a Finnish personal Windows application built with Tauri, featuring a growing collection of custom mini-apps.

You can sign in with Google or Discord OAuth, manage your apps, and even create your own.

# 📦 Default Apps

Suc comes with a few preinstalled utilities, such as:

📝 Notepad

🎨 Paint

🎨 Customization

Personalize the look and feel of your workspace with beautiful theme customization options available in the settings.

# 🚧 Development Status

This project is still under active development — expect bugs and errors


# Showcase
<img width="818" height="440" alt="image" src="https://github.com/user-attachments/assets/b5e66ce7-f74f-4bbc-925e-8165a25f82ba" />
<img width="818" height="440" alt="image" src="https://github.com/user-attachments/assets/de88af79-da93-4385-bb78-6d5250c69bf7" />
<img width="818" height="440" alt="image" src="https://github.com/user-attachments/assets/be248ce4-41c2-481b-a1a3-42fc41aab655" />


# 🧩 How it Works

To create an app, simply make a new folder inside your host’s root directory.
For example:

HOST/apps/store/calculator/


Add your app files into the store folder:

  index.html
  style.css
  main.js

(In Apps.json ((public_html/apps/store/apps.json)), you can change the path where your app is and other things.)

Once Done, you can download and launch apps directly through Suc’s built-in “App Store”.

## 👨🏻‍💻 How to Edit, Run and Build the Suc App

### 🧩 1. Install Required Tools

Before running or editing the app, make sure you have these installed:

- [Node.js](https://nodejs.org/) (LTS version recommended) — check with `node -v`
- [Rust](https://www.rust-lang.org/tools/install)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)  
  *(install only the **Build Tools**, not the full Visual Studio IDE)*

You can install everything easily on Windows using PowerShell:

- winget install Rustlang.Rustup
- winget install Microsoft.VisualStudio.2022.BuildTools


npm install
npm run tauri dev


### Edit files
- src/utils/api.js -  (const APPS_URL = 'https://Yourhost.com/apps/store/apps.json';)
- src/main.js  -  (const APPS_URL = 'https://Yourhost.com/apps/store/apps.json';)
- HOST/apps/suc.php Create ur database and change to correct credentials.
