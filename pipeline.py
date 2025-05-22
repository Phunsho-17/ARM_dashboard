# pipeline.py

import torch
import torch.nn.functional as F
import pandas as pd
import joblib
from torch_geometric.nn import RGCNConv

class RGCNModel(torch.nn.Module):
    def __init__(self, in_feats, hidden_feats, out_feats, num_relations):
        super().__init__()
        self.conv1 = RGCNConv(in_feats, hidden_feats, num_relations)
        self.conv2 = RGCNConv(hidden_feats, out_feats, num_relations)
        self.decoder = torch.nn.Linear(2 * out_feats, 3)

    def forward(self, x, edge_index, edge_type, pairs=None):
        x = F.relu(self.conv1(x, edge_index, edge_type))
        x = self.conv2(x, edge_index, edge_type)
        if pairs is not None:
            src, dst = pairs[:, 0], pairs[:, 1]
            edge_feats = torch.cat([x[src], x[dst]], dim=1)
            return self.decoder(edge_feats)
        return x

class RelationshipPipeline:
    def __init__(self, model_path, features_path, edge_index_path, edge_type_path,
                 cid_map_path, df_path):
        import torch.serialization
        torch.serialization.add_safe_globals({'RGCNModel': RGCNModel})
        self.model = torch.load(model_path, map_location='cpu', weights_only=False)
        self.model.eval()
        self.x = torch.load(features_path)
        self.edge_index = torch.load(edge_index_path)
        self.edge_type = torch.load(edge_type_path)
        self.cid_to_idx = joblib.load(cid_map_path)
        self.df = pd.read_csv(df_path)
        self.rel_map_inv = {0: "Father", 1: "Mother", 2: "Spouse"}

    def explain_relationship(self, cid1, cid2):
        from torch.nn.functional import softmax
        if cid1 not in self.cid_to_idx or cid2 not in self.cid_to_idx:
            return " One or both CIDs not found."

        row1 = self.df[self.df['CID NO'] == cid1].iloc[0]
        row2 = self.df[self.df['CID NO'] == cid2].iloc[0]

        explanation = "\n🔍 Key Findings\n"
        relation = "Unknown"
        confidence = None

        if cid1 in self.cid_to_idx and cid2 in self.cid_to_idx:
            idx1 = self.cid_to_idx[cid1]
            idx2 = self.cid_to_idx[cid2]
            pair_tensor = torch.tensor([[idx1, idx2]])
            with torch.no_grad():
                logits = self.model(self.x, self.edge_index, self.edge_type, pair_tensor)
                probs = softmax(logits, dim=1)
                confidence = torch.max(probs).item() * 100

        if (row1['FATHER CID NUMBER'] == cid2 or row1['MOTHER CID NUMBER'] == cid2):
            relation = "Parent-Child"
            explanation += "- Person B is listed as the parent of Person A.\n"
        elif (row2['FATHER CID NUMBER'] == cid1 or row2['MOTHER CID NUMBER'] == cid1):
            relation = "Parent-Child"
            explanation += "- Person A is listed as the parent of Person B.\n"

        elif (row1['FATHER CID NUMBER'] == row2['FATHER CID NUMBER']) and \
             (row1['MOTHER CID NUMBER'] == row2['MOTHER CID NUMBER']):
            relation = "Siblings"
            explanation += "- They share both parents.\n- Likely full siblings.\n"

        elif row1['SPOUSE CID NUMBER'] == cid2 or row2['SPOUSE CID NUMBER'] == cid1:
            relation = "Spouse"
            explanation += "- They are listed as spouses.\n"

        else:
            father1 = row1['FATHER CID NUMBER']
            father2 = row2['FATHER CID NUMBER']
            if pd.notna(father1) and pd.notna(father2):
                f1_row = self.df[self.df['CID NO'] == father1]
                f2_row = self.df[self.df['CID NO'] == father2]
                if not f1_row.empty and not f2_row.empty:
                    f1_father = f1_row.iloc[0]['FATHER CID NUMBER']
                    f2_father = f2_row.iloc[0]['FATHER CID NUMBER']
                    if f1_father == f2_father and pd.notna(f1_father):
                        relation = "First Cousins"
                        explanation += "- Their fathers are siblings (shared grandfather).\n"

        if relation == "Unknown":
            if row1['SPOUSE CID NUMBER'] in [row2['FATHER CID NUMBER'], row2['MOTHER CID NUMBER']] or \
               row2['SPOUSE CID NUMBER'] in [row1['FATHER CID NUMBER'], row1['MOTHER CID NUMBER']]:
                relation = "In-Laws"
                explanation += "- Possible parent-in-law relationship detected.\n"

        if relation == "Unknown":
            relation = "Uncertain"
            explanation += "- No direct or extended relationship found.\n"

        explanation = f"\n Predicted Relationship: {relation}" + explanation
        if confidence is not None:
            explanation += f"\n Prediction Confidence: {confidence:.2f}%"
        return explanation
