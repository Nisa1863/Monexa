# Monexa (React uygulamasi + API + ML)

Uygulama arayuzu **yalnizca React**'tir. Streamlit kullanilmaz.

## Calistirma sirasi

### 1) ML modeli (bir kez, `monexa_app`)

```powershell
cd "c:\Users\NİSA NUR\Desktop\monexa_app"
.\run_monexa.ps1
```

### 2) Backend

```powershell
cd "c:\Users\NİSA NUR\Desktop\monexa\backend"
npm start
```

Varsayilan port `5000`. Doluysa backend otomatik olarak `5001`–`5005` dener; konsolda yazan portu kullan.

### 3) Frontend (React)

Ayni portta API kullanmak icin, backend farkli portta acildiysa `monexa` klasorunde `.env` olustur:

```
REACT_APP_API_URL=http://localhost:5001/api
```

Sonra:

```powershell
cd "c:\Users\NİSA NUR\Desktop\monexa"
npm start
```

## Port 5000 doluysa (manuel bosaltma)

```powershell
Get-NetTCPConnection -LocalPort 5000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

## ML API

- `POST /api/ml/predict` — `Insights` sayfasindaki form bu endpoint'e baglidir.
