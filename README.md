# MLLMTool

### **📘 Audio Notebook UI**
Application for managing and summarizing audio transcripts.

## **🚀 Getting Started**

### **1️⃣ Prerequisites**
Ensure you have the following installed before setting up the project:

- **Node.js** (v18 or later) – [Download](https://nodejs.org/)
- **npm** (v9 or later) – Comes with Node.js

### **2️⃣ Installation**
Clone the repository and install dependencies:

```sh
git clone https://github.com/B-a-1-a/MLLMTool
cd notebookui
npm install
```

---

## **🛠 Development Mode**
Start the development server:

```sh
npm run dev
```

Then, open your browser and go to:

```
http://localhost:3000
```

This will start a **hot-reloading** development server.

---

## **🚀 Production Build**
To build the production-ready version of the app:

```sh
npm run build
```

This will generate optimized static files in the `.next/` directory.

### **Starting the Production Server**
After building, start the production server:

```sh
npm run start
```

Then, access the app at:

```
http://localhost:3000
```

## **🛠 Troubleshooting**
1. **Module Not Found Errors**
   - Run `npm install` to ensure all dependencies are installed.
   - If a Shadcn component is missing, install it using `npx shadcn@latest add <component-name>`.

2. **TailwindCSS Not Working**
   - Ensure `globals.css` includes:
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```
   - Restart your Next.js server with `npm run dev`.

---

# Backend

This guide outlines the steps required to set up and run the backend.

## Prerequisites

* **python 3.9:**  Ensure you have python 3.9 installed.

    * **macos:** Use homebrew: `brew install python@3.9`
    * **windows:** Download the installer from [python.org](https://www.python.org/downloads/windows/) and follow the instructions.  make sure to add python to your path environment variable during installation.  (you may need to search for instructions on how to do this for your version of windows.)

## Setup

1. **Create a virtual environment:** This isolates project dependencies.

    ```sh
    python3.9 -m venv venv
    ```

2. **Activate the virtual environment:**

    * **macos/linux:**
      ```sh
      source venv/bin/activate
      ```
    * **windows (command prompt):**
      ```sh
      venv\scripts\activate
      ```
    * **windows (powershell):**
      ```powershell
      venv\scripts\activate.ps1
      ```

3. **Install dependencies:** Install the required python packages.

    ```sh
    pip install -r requirements.txt
    ```

4. **Obtain `mllm-transcription-translation`:**  The `mllm-transcription-translation` file is required for the backend to function. please retrieve it from slack and place it in the `backend` folder.

## Running the backend

1. **Start the flask server:**

    ```sh
    flask --app transcription.py run
    ```

    *(optional)  If you need to specify a port or other flask options:*

    ```sh
    flask --app transcription.py run --port 5000  # example: run on port 5000
    flask --app transcription.py run --host 0.0.0.0 # example: make server accessible from other machines on the network
    ```
---

## **💡 Contributing**
Part of Research Group At UW Madison

github.com/B-a-1-a

github.com/sungwoonpark0502


Feel free to submit **issues** or **pull requests** to improve this project!

---

### **📜 License**
This project is licensed under the **MIT License**.
---
