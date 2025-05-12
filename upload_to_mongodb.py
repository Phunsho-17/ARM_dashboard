import pandas as pd
from pymongo import MongoClient

# 1. MongoDB Atlas connection string
uri = "mongodb+srv://Pelden:Pelden1234@cluster0.ywgyljr.mongodb.net/"

# 2. Connect to MongoDB
client = MongoClient(uri)
db = client["census_db"]
collection = db["analysis_data"]

# 3. Load the Excel file
df = pd.read_excel("ai_analysis.xlsx")

# 4. Insert into MongoDB
records = df.to_dict(orient='records')
if records:
    collection.insert_many(records)
    print(f"✅ Inserted {len(records)} records into MongoDB!")
else:
    print("⚠️ No records to insert.")
