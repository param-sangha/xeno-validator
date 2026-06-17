# Xeno Transaction Validator

A simple web app to validate and clean transaction CSV data.

🔗 **Live Demo:** xeno-validator-c475wis7a-in-punjabs-projects.vercel.app

## What it does

- Validates phone numbers based on country code (India: 10 digits, Singapore: 8 digits, etc.)
- Validates date and time formats
- Validates payment mode (cash, card, upi, netbanking, wallet, credit, debit)
- Checks for missing required fields and invalid amounts/quantities
- Outputs a cleaned CSV with only valid rows
- Splits large files into smaller chunks for download

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **CSV Parsing:** PapaParse

## How to use

1. Upload a CSV file with transaction data
2. Click **Validate**
3. View row-by-row errors
4. Download the cleaned CSV or chunked files

## Expected CSV columns
