<div align="center">

# 🫆Fraud Radar
### Fraud detection on real e-commerce payment transactions

<p>
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" /> <img src="https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" /> <img src="https://img.shields.io/badge/XGBoost-1F6FEB?style=for-the-badge&logoColor=white" /> <img src="https://img.shields.io/badge/SHAP-FF4B4B?style=for-the-badge&logoColor=white" />
<br>
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" /> <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" /> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" /> <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

</div>

> [!NOTE]
> **Status: Work in progress 🚧** · Sections marked *coming soon* will be updated as each stage is completed.

---

## 💡 The problem

Every online payment has to be approved or blocked in milliseconds. Block too little and the company loses money to fraud; block too much and legitimate customers get their cards declined.

**Fraud Radar** is an end-to-end prototype of the tool a fraud analyst would use: a machine learning model scores each transaction with a **risk score**, explains **why** it looks suspicious, and sends the riskiest cases to an **alert queue** in a web dashboard.

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
| **Exploratory analysis** | Fraud rate by product, card type, email domain, device and transaction amount |
| **Feature engineering** | Time features, amount patterns, card/email/device aggregations, missing-value indicators |
| **Models** | Logistic Regression (baseline) · Random Forest · XGBoost |
| **Class imbalance** | Class weights and threshold tuning instead of plain accuracy |
| **Validation** | Time-based split: train on earlier transactions, test on later ones |
| **Explainability** | SHAP values to show the main reasons behind each alert |

### Why not accuracy?
Only ≈ 3.5% of transactions are fraud, so a model that says "not fraud" every time would already be 96.5% accurate and completely useless. Fraud Radar is evaluated with:

- **PR-AUC** (precision-recall curve)
- **Recall:** how much fraud is caught
- **Precision:** how many alerts are real fraud
- **Decision threshold** chosen by business cost: a missed fraud costs more than a false alarm

### ⚠️ Avoiding data leakage
- **Time-based split:** a random split would let the model "see the future", inflating results.
- **Same card in train and test:** transactions from the same card can appear in both sets, so results are also checked by grouping cards.
- **Features only available at payment time:** nothing that is known only after the transaction is reviewed.

### Results
*Coming soon.*

---

## 🖥️ Web application

```text
Fraud Radar
│
├── Frontend      → Next.js · React · TypeScript · Tailwind CSS · shadcn/ui · Recharts
├── Backend       → FastAPI · Python · Pandas · scikit-learn · Joblib
├── Model         → Trained pipeline (.joblib) + SHAP explainer
└── Deployment    → Docker · Docker Compose
```

| Module | What it does |
|---|---|
| **Dashboard** | Fraud KPIs: fraud rate, amount at risk, alerts by product, card type and hour |
| **Alert queue** | Highest-risk transactions, sorted by score, with their top reasons |
| **Evaluate transaction** | Form to score a new transaction and see its explanation |
| **Transactions** | Searchable table of scored transactions |
| **Roles** | Analyst and administrator access |
| **Assistant** | Chat widget to answer questions about the dashboard |

*Screenshots coming soon.*

---

## 🚀 Run it locally

*Coming soon.*

---

## 🗺️ Roadmap

- [ ] Exploratory data analysis notebook
- [ ] Feature engineering and leakage-safe validation
- [ ] Model comparison and threshold tuning
- [ ] SHAP explanations
- [ ] Backend `/score` endpoint
- [ ] Dashboard and alert queue
- [ ] Screenshots and demo

---

## 📝 About

Originally developed as the final project for the **Machine Learning** course, M.Sc. in Information Technologies for Data Analytics, Universidad de San Buenaventura Cali. Redesigned as a fraud detection case study, inspired by my experience testing payment and money transfer platforms as a QA Analyst.

**Data:** IEEE-CIS Fraud Detection, provided by Vesta Corporation via Kaggle. Used for educational, non-commercial purposes.

<div align="center">

Made with 💜 by **[María José Ospina Samboni](https://github.com/naksu707)**

</div>
