# Monexa – Personal Finance Management and Analysis Platform

Monexa is a web-based personal finance management platform developed using React, Node.js, and Machine Learning technologies. The application helps users track their financial activities, analyze spending behavior, and receive data-driven financial insights through an interactive and user-friendly interface.

The frontend of the project is developed entirely with React. Backend services are provided through a Node.js API, while the machine learning module performs financial prediction and analysis operations.

---

## Project Structure

* **Frontend:** React.js
* **Backend:** Node.js / Express.js
* **Machine Learning Module:** Python-based prediction system

---

# Running the Project

## 1. Start the Machine Learning Service

Run the following command inside the `monexa_app` directory:

```powershell
cd "c:\Users\NİSA NUR\Desktop\monexa_app"
.\run_monexa.ps1
```

This step initializes the machine learning service used for financial analysis and prediction operations.

---

## 2. Start the Backend Server

Open a new terminal and run:

```powershell
cd "c:\Users\NİSA NUR\Desktop\monexa\backend"
npm start
```

The backend server runs on port `5000` by default.
If the port is already occupied, the system automatically switches to an available port between `5001` and `5005`.

Please check the terminal output to confirm the active API port.

---

## 3. Start the Frontend Application

If the backend starts on a different port, create a `.env` file inside the main `monexa` directory and define the API URL as follows:

```env
REACT_APP_API_URL=http://localhost:5001/api
```

Then run the frontend application:

```powershell
cd "c:\Users\NİSA NUR\Desktop\monexa"
npm start
```

---

# Manual Port Cleanup (Optional)

If port `5000` is occupied and needs to be released manually:

```powershell
Get-NetTCPConnection -LocalPort 5000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

---

# Machine Learning API

The backend provides the following machine learning endpoint:

* `POST /api/ml/predict`

This endpoint is connected to the financial analysis and prediction section within the application and is used to generate personalized financial insights based on user data.
