# Monexa – Personal Finance Management and Analysis Platform

Monexa is a web-based personal finance management platform developed using React, Node.js, and Machine Learning technologies. The application helps users track their financial activities, analyze spending behavior, and receive data-driven financial insights through an interactive and user-friendly interface.

The frontend of the project is developed entirely with React. Backend services are provided through a Node.js API, while the machine learning module performs financial prediction and analysis operations.


## 📸 Application Screenshots

<p align="center">
  <img src="https://github.com/user-attachments/assets/9e5ba705-86a9-490b-99fc-21e741526c82" width="230"/>
  <img src="https://github.com/user-attachments/assets/56844359-185b-47e1-ba25-557185d16b06" width="230"/>
  <img src="https://github.com/user-attachments/assets/dc454777-0e65-47c0-9573-e35f7262ac03" width="230"/>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/1e34b725-a8ce-4a11-8803-141fc8350f23" width="230"/>
  <img src="https://github.com/user-attachments/assets/e151e8f6-77a1-45fe-bf12-081d40d3f3fa" width="230"/>
  <img src="https://github.com/user-attachments/assets/0133a74a-5e3a-4a2e-8232-ec85790fce3f" width="230"/>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/7354b788-cd51-44fb-a45e-aafa436b42d7" width="230"/>
  <img src="https://github.com/user-attachments/assets/f1371973-e883-4daf-a803-1d63f89a3f2c" width="230"/>
  <img src="https://github.com/user-attachments/assets/6116875e-c6dd-4bc7-8e33-3d6a34c41e6e" width="230"/>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/36879198-af46-4e9e-a9e7-146421111f37" width="230"/>
  <img src="https://github.com/user-attachments/assets/7cf7fca1-c050-4f9c-ad86-9d563cf07e93" width="230"/>
  <img src="https://github.com/user-attachments/assets/3f96082b-4609-4d2f-b694-9a76b491ca33" width="230"/>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/3ef41910-01e3-44e1-abf3-b04a76461394" width="230"/>
  <img src="https://github.com/user-attachments/assets/478a74cb-860a-4175-8add-0643a16b2683" width="230"/>
  <img src="https://github.com/user-attachments/assets/7f86d2a4-b521-4f34-9e7a-1d5903058eb8" width="230"/>
</p>

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
