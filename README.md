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

## **💡 Contributing**
Part of Research Group At UW Madison

github.com/B-a-1-a

github.com/sungwoonpark0502


Feel free to submit **issues** or **pull requests** to improve this project!

---

### **📜 License**
This project is licensed under the **MIT License**.
---
