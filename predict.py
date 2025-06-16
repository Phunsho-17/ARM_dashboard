import sys
import json
from pipeline import RelationshipPipeline, RGCNModel  # Ensure both are imported

# Get input CIDs from command-line arguments
cid1 = int(sys.argv[1])
cid2 = int(sys.argv[2])

# Initialize the pipeline
pipeline = RelationshipPipeline(
    model_path="C:/Users/sonam/Downloads/Acc_Dashboard/outputs/RGCN_model.pth",
    features_path="C:/Users/sonam/Downloads/Acc_Dashboard/outputs/x_features.pt",         
    edge_index_path="C:/Users/sonam/Downloads/Acc_Dashboard/outputs/edge_index.pt",
    edge_type_path="C:/Users/sonam/Downloads/Acc_Dashboard/outputs/edge_type.pt",
    cid_map_path="C:/Users/sonam/Downloads/Acc_Dashboard/outputs/cid_to_idx.pkl",
    df_path="C:/Users/sonam/Downloads/Acc_Dashboard/outputs/df.csv"
)


# Run prediction and print as JSON
try:
    result = pipeline.explain_relationship(cid1, cid2)
    print(json.dumps({"explanation": result}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
