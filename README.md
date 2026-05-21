# Monexa – Personal Finance Management and Analysis Platform

Monexa is a web-based personal finance management platform developed using React, Node.js, and Machine Learning technologies. The application helps users track their financial activities, analyze spending behavior, and receive data-driven financial insights through an interactive and user-friendly interface.

The frontend of the project is developed entirely with React. Backend services are provided through a Node.js API, while the machine learning module performs financial prediction and analysis operations.


#Application Screenshots
<img width="370" height="838" alt="Screenshot 2026-05-20 at 01 41 42" src="https://github.com/user-attachments/assets/55fb208f-53ea-4782-bf38-09f975b6ce7d" />
<img width="370" height="833" alt="Screenshot 2026-05-20 at 01 42 02" src="https://github.com/user-attachments/assets/4232377f-44d2-418f-ac3a-7d5d3dbe2e9c" />
<img width="374" height="834" alt="Screenshot 2026-05-20 at 01 40 49" src="https://github.com/user-attachments/assets/8a162444-95b2-4e34-b5df-a0b80f3c03c0" />
<img width="373" height="834" alt="Screenshot 2026-05-20 at 01 40 34" src="https://github.com/user-attachments/assets/443e3b14-96cc-402c-9be4-27e05a731257" />
<img width="371" height="807" alt="Screenshot 2026-05-20 at 01 41 08" src="https://github.com/user-attachments/assets/0951cf2f-5a43-4fa1-904e-605cd06da028" />
<img width="372" height="832" alt="Screenshot 2026-05-20 at 01 41 21" src="https://github.com/user-attachments/assets/934b124f-e4a5-4f4b-85c8-8103f8f14b16" />
<img width="382" height="834" alt="Screenshot 2026-05-20 at 01 41 32" src="https://github.com/user-attachments/assets/c166e8c3-4514-4111-ad80-5bbfa03cbb14" />
<img width="376" height="834" alt="Screenshot 2026-05-20 at 01 39 23" src="https://github.com/user-attachments/assets/7b225c13-4025-423d-b08d-77d3516e4d0d" />
<img width="369" height="833" alt="Screenshot 2026-05-20 at 01 39 35" src="https://github.com/user-attachments/assets/66493f01-502b-4447-a607-f503560de59c" />
<img width="372" height="837" alt="Screenshot 2026-05-20 at 01 39 49" src="https://github.com/user-attachments/assets/3b885129-ea3b-458e-ba44-504e93e4c5a7" />
<img width="369" height="829" alt="Screenshot 2026-05-20 at 01 40 01" src="https://github.com/user-attachments/assets/35037b1e-dd53-4abf-b949-337e34254738" />
<img width="373" height="834" alt="Screenshot 2026-05-20 at 01 40 21" src="https://github.com/user-attachments/assets/188fe80e-08e7-4747-babf-4aa0176eeaed" />
<img width="384" height="829" alt="Screenshot 2026-05-20 at 01 38 45" src="https://github.com/user-attachments/assets/dbfce8af-98b3-4493-ac7c-173c9323a2f8" />
<img width="378" height="821" alt="Screenshot 2026-05-20 at 01 38 30" src="https://github.com/user-attachments/assets/62e26c68-a458-4f5b-be81-1a188c530926" />

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
