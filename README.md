<div align="center">

# Fraud Radar
### Fraud detection on real e-commerce payment transactions

<p align="center">
<img src="https://img.shields.io/badge/Python-F9B7D6?style=for-the-badge&logo=python&logoColor=5B4688" /> <img src="https://img.shields.io/badge/scikit--learn-D4B8F5?style=for-the-badge&logo=scikitlearn&logoColor=5B4688" /> <img src="https://img.shields.io/badge/XGBoost-B8A4E3?style=for-the-badge" /> <img src="https://img.shields.io/badge/SHAP-ADBEF7?style=for-the-badge" />
<br>
<img src="https://img.shields.io/badge/FastAPI-A8DDF0?style=for-the-badge&logo=fastapi&logoColor=5B4688" /> <img src="https://img.shields.io/badge/Next.js-FBE3A9?style=for-the-badge&logo=nextdotjs&logoColor=5B4688" /> <img src="https://img.shields.io/badge/TypeScript-F9C6B6?style=for-the-badge&logo=typescript&logoColor=5B4688" /> <img src="https://img.shields.io/badge/Docker-F9B7D6?style=for-the-badge&logo=docker&logoColor=5B4688" />
</p>

</div>

---

## 💡 The problem

Every online payment has to be approved or blocked in milliseconds. Block too little and the company loses money to fraud; block too much and legitimate customers get their cards declined.

**Fraud Radar** is an end-to-end prototype of the tool a fraud analyst would use: a machine learning model scores each transaction with a **risk score**, explains **why** it looks suspicious, and sends the riskiest cases to an **alert queue** in a web platform where analysts review them.

---

## 📊 Data

**IEEE-CIS Fraud Detection** — real, anonymized e-commerce transactions provided by **Vesta Corporation**, a payment services company, for a Kaggle competition organized by the IEEE Computational Intelligence Society.

| | |
|---|---|
| Training transactions | 590,540 |
| Fraudulent transactions | 20,663 (≈ 3.5%) |
| Files | `train_transaction.csv` + `train_identity.csv`, joined by `TransactionID` |
| Target | `isFraud` |

🔗 **Download:** [kaggle.com/competitions/ieee-fraud-detection](https://www.kaggle.com/competitions/ieee-fraud-detection/data)

> The data is **not included** in this repository. To use it, join the competition on Kaggle, accept its rules and download `train_transaction.csv` and `train_identity.csv` into `IEEE-CIS Fraud Detection/dataset/raw/`.

---

## 🧠 Machine learning approach

| Step | Details |
|---|---|
| **Exploratory analysis** | Fraud rate by product, card type, email domain, device, hour and transaction amount; missing values and identity coverage |
| **Feature engineering** | Amount patterns (log amount, cents, tiny "card testing" amounts), hour and weekday, how common each card, address, email domain and device is, amount vs. the card's usual amount, purchaser/recipient email match |
| **Models** | Logistic Regression (baseline) · Random Forest · XGBoost |
| **Class imbalance** | Class weights (`scale_pos_weight`) and a cost-based threshold instead of plain accuracy |
| **Validation** | Time-based split: 70% train · 15% validation · 15% untouched test |
| **Explainability** | SHAP values to show the main reasons behind each alert |

### Why not accuracy?
Only ≈ 3.5% of transactions are fraud, so a model that says "not fraud" every time would already be 96.5% accurate and completely useless. Fraud Radar is evaluated with:

- **PR-AUC** (precision-recall curve)
- **Recall:** how much fraud is caught
- **Precision:** how many alerts are real fraud
- **Decision threshold** chosen by business cost: a missed fraud costs more than a false alarm

### ⚠️ Avoiding data leakage
- **Time-based split:** a random split would let the model "see the future", inflating results.
- **Learned on train only:** frequencies and card averages are computed on the training period and then applied to validation and test.
- **No card memorization:** the raw card ID is removed, and results are also checked on cards never seen during training.
- **Features only available at payment time:** nothing that is known only after the transaction is reviewed.

### Results

| Model (validation) | PR-AUC | ROC-AUC |
|---|---|---|
| **XGBoost** | **0.613** | **0.917** |
| Random Forest | 0.454 | 0.870 |
| Logistic Regression (baseline) | 0.166 | 0.760 |
| Random (reference) | 0.034 | 0.500 |

**Final evaluation on the untouched test period (XGBoost, threshold 0.06):**

| Metric | Value |
|---|---|
| PR-AUC | 0.534 (random ≈ 0.035) |
| ROC-AUC | 0.897 |
| Fraud caught (recall) | 72.9% |
| Alerts that are real fraud (precision) | 20.7% |
| Fraud captured in the top 5% riskiest transactions | 57.5% |
| Cost reduction vs. no model (validation) | 59.1% |

> Scores are **risk scores**, not calibrated probabilities. The threshold was chosen on validation to minimize total cost, assuming each missed fraud costs its amount and each false alarm costs $10 to review.

---

## 🖥️ Web platform

<img src="./img/Screenshot at Nov 24 11-15-22.png" width="85%" alt="Preview of the Fraud Detection page" />

<p align="center"><b>🔗 <a href="https://fraud-radar.vercel.app">Live demo</a></b> · Demo account: <code>analyst@fraudradar.dev</code> / <code>analyst1234</code></p>

```text
Fraud Radar
│
├── Frontend      → Next.js · React · TypeScript · CSS · hand-built SVG charts
├── Backend       → FastAPI · Python · pandas · XGBoost · SQLite
├── Model         → Trained XGBoost model (.joblib) + SHAP contributions
└── Deployment    → Docker · Docker Compose
```

| Module | What it does |
|---|---|
| **Home & Project** | Public landing page and an explanation of the data, model and limitations |
| **Accounts & roles** | Register / log in with hashed passwords and signed tokens. **Analyst** and **Administrator** roles |
| **Dashboard** | Fraud KPIs, highest-risk transactions, alerts by hour, score distribution and fraud rate by product, card type and device |
| **Alert queue** | Transactions sorted by risk score with their top reasons. Analysts mark each alert as *confirmed fraud*, *legitimate* or *escalated*, with a note |
| **Evaluate** | Score a new transaction, or open a real alert and change its amount, email or device to see how the risk moves (what-if) |
| **History** | Every prediction an analyst makes is saved |
| **Admin** | Manage users (role, active/inactive), see all predictions and the team's activity log |
| **Language** | English / Spanish switch |

**Demo accounts** (created automatically when the API starts):

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@fraudradar.dev` | `admin1234` |
| Fraud analyst | `analyst@fraudradar.dev` | `analyst1234` |

> Change these passwords and set `SECRET_KEY` before deploying anywhere public.

---

## 🚀 Run it locally

**Requirements:** Python 3.11+, Node.js 20+ and the Kaggle data in `IEEE-CIS Fraud Detection/dataset/raw/`.

**1. Train the model**

```bash
cd "IEEE-CIS Fraud Detection"
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Run `notebook/01_eda.ipynb` and then `notebook/02_modeling.ipynb`. They save the model to `model/`.

> The trained model is already included in `page/backend/model/`, so you can skip this step and go straight to the API. If you retrain, copy the files from `model/` to `page/backend/model/`.

> On macOS, XGBoost needs OpenMP: `brew install libomp`.

**2. Start the API** (keep the virtual environment active)

```bash
cd page/backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The demo data is already in `page/backend/data/`. To rebuild it from the Kaggle files: `python -m scripts.build_demo_data`.

API docs: http://localhost:8000/docs

**3. Start the platform** (in a second terminal)

```bash
cd "IEEE-CIS Fraud Detection/page/frontend"
npm install
npm run dev
```

Open http://localhost:3000 and log in with a demo account.

**Or with Docker:**

```bash
cd "IEEE-CIS Fraud Detection/page"
docker compose up --build
```

---

## 📁 Project structure

```text
fraud-radar-ml/
└── IEEE-CIS Fraud Detection/
    ├── dataset/            # raw/ (Kaggle CSVs) and processed/ — not in the repo
    ├── notebook/           # 01_eda.ipynb · 02_modeling.ipynb
    ├── model/              # notebook output — not in the repo
    ├── page/
    │   ├── backend/        # FastAPI: scoring, users, reviews, admin
    │   │   ├── model/      # trained model used by the API (17 MB)
    │   │   └── data/       # demo transactions from the test period
    │   ├── frontend/       # Next.js platform
    │   └── docker-compose.yml
    └── requirements.txt
```

---

## 🗺️ Roadmap

- [x] Exploratory data analysis notebook
- [x] Feature engineering and leakage-safe validation
- [x] Model comparison and threshold tuning
- [x] SHAP explanations
- [x] Backend scoring API
- [x] Platform with users, roles, dashboard and alert queue
- [x] English / Spanish interface
- [x] Online deployment (Vercel + Render)

---

## 📝 About

Originally developed as the final project for the **Machine Learning** course, M.Sc. in Information Technologies for Data Analytics, Universidad de San Buenaventura Cali. Redesigned as a fraud detection case study, inspired by my experience testing payment and money transfer platforms as a QA Analyst.

**Data:** IEEE-CIS Fraud Detection, provided by Vesta Corporation via Kaggle. Used for educational, non-commercial purposes.

---

> [!NOTE]
> **Project status: Completed ✅**
> This repository is finished and is no longer being updated. All projects were last verified to work correctly as of **November 24, 2026**. Later changes to browsers, libraries or dependencies may affect how some projects run.

---

<div align="center">

Made by 💜 **[Maria Jose Ospina](https://github.com/naksu707)** 💜

</div>
