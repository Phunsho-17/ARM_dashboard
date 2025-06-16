import pandas as pd
from pymongo import MongoClient

import pandas as pd
from pymongo import MongoClient

# 1. MongoDB connection
uri = "mongodb+srv://Pelden:Pelden1234@cluster0.ywgyljr.mongodb.net/"
client = MongoClient(uri)
db = client["census_db"]
collection = db["relationship_data"]

# 2. Load the same Excel file
df = pd.read_excel("C:/Users/sonam/Downloads/Acc_Dashboard/relationship_logs_April_May_2025.xlsx")

# 3. Build delete filter using unique combination: cid + created_at
delete_filter = [{ "cid": row["cid"], "created_at": row["created_at"] } for _, row in df.iterrows()]

# 4. Delete matching records
deleted_count = 0
for doc in delete_filter:
    result = collection.delete_one(doc)
    deleted_count += result.deleted_count

print(f"🗑️ Deleted {deleted_count} records uploaded from Excel.")

