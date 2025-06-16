# pipeline.py

import torch
import torch.nn.functional as F
import pandas as pd
import joblib
from torch_geometric.nn import RGCNConv

# -----------------------------------------
# 3. RGCN Model
# -----------------------------------------
class RGCNModel(torch.nn.Module):
    def __init__(self, in_feats, hidden_feats, out_feats, num_relations, num_classes):
        super().__init__()
        self.conv1 = RGCNConv(in_feats, hidden_feats, num_relations)
        self.conv2 = RGCNConv(hidden_feats, out_feats, num_relations)
        self.decoder = torch.nn.Sequential(
            torch.nn.Linear(2 * out_feats, out_feats),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.3),
            torch.nn.Linear(out_feats, num_classes)
        )

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
        self.rel_map_inv = {
            0: "Father",
            1: "Mother",
            2: "Spouse",
            3: "Sibling",
            4: "Son-in-law",
            5: "Daughter-in-law",
            6: "Grandparent",
            7: "Aunt/Uncle",
            8: "Parent-in-law",
            9: "Sibling-in-law",
            10: "Unrelated",
        }
    def explain_relationship(self, cid1, cid2):
        from torch.nn.functional import softmax
        if cid1 == cid2:
            return {
                "ai_prediction": "Same Person",
                "confidence": 100.0,
                "rule_based": "Same Person",
                "explanation": "The provided CID belong to the same person. No relationship analysis is applicable."
            }
        if cid1 not in self.cid_to_idx or cid2 not in self.cid_to_idx:
            return {
                "ai_prediction": "Unknown",
                "confidence": None,
                "rule_based": "Unknown",
                "explanation": "One or both CIDs not found in Data."
            }


        row1 = self.df[self.df['CID NO'] == cid1].iloc[0]
        row2 = self.df[self.df['CID NO'] == cid2].iloc[0]

        explanation = ""
        rule_based_relation = "Unknown"
        model_relation = "Unknown"
        confidence = None

        # AI Model Prediction
        idx1 = self.cid_to_idx[cid1]
        idx2 = self.cid_to_idx[cid2]
        pair_tensor = torch.tensor([[idx1, idx2]])
        with torch.no_grad():
            logits = self.model(self.x, self.edge_index, self.edge_type, pair_tensor)
            probs = softmax(logits, dim=1)
            pred_label = torch.argmax(probs).item()
            confidence = torch.max(probs).item() * 100
            model_relation = self.rel_map_inv.get(pred_label, "Unknown")

        # Rule-Based Relationships
        if row1['FATHER CID NUMBER'] == cid2:
            rule_based_relation = "Father-Child"
            explanation += "- Person B is father of Person A.\n"
        elif row1['MOTHER CID NUMBER'] == cid2:
            rule_based_relation = "Mother-Child"
            explanation += "- Person B is mother of Person A.\n"
        elif row2['FATHER CID NUMBER'] == cid1:
            rule_based_relation = "Father-Child"
            explanation += "- Person A is father of Person B.\n"
        elif row2['MOTHER CID NUMBER'] == cid1:
            rule_based_relation = "Mother-Child"
            explanation += "- Person A is mother of Person B.\n"
        elif row1['FATHER CID NUMBER'] == row2['FATHER CID NUMBER'] and \
            row1['MOTHER CID NUMBER'] == row2['MOTHER CID NUMBER']:
            rule_based_relation = "Siblings"
            explanation += "- Person A and Person B share both parents.\n"
        elif row1['SPOUSE CID NUMBER'] == cid2 or row2['SPOUSE CID NUMBER'] == cid1:
            rule_based_relation = "Spouse"
            explanation += "- Person A and Person B are spouses.\n"
        else:
            # First Cousins check
            f1 = row1['FATHER CID NUMBER']
            f2 = row2['FATHER CID NUMBER']
            if pd.notna(f1) and pd.notna(f2):
                f1_row = self.df[self.df['CID NO'] == f1]
                f2_row = self.df[self.df['CID NO'] == f2]
                if not f1_row.empty and not f2_row.empty:
                    gf1 = f1_row.iloc[0]['FATHER CID NUMBER']
                    gf2 = f2_row.iloc[0]['FATHER CID NUMBER']
                    if pd.notna(gf1) and gf1 == gf2:
                        rule_based_relation = "First Cousins"
                        explanation += "- Their fathers are siblings (shared grandfather).\n"

        # Grandparent check
        if rule_based_relation == "Unknown":
            for p in [row1['FATHER CID NUMBER'], row1['MOTHER CID NUMBER']]:
                if pd.notna(p):
                    parent_row = self.df[self.df['CID NO'] == p]
                    if not parent_row.empty:
                        gp1 = parent_row.iloc[0]['FATHER CID NUMBER']
                        gp2 = parent_row.iloc[0]['MOTHER CID NUMBER']
                        if cid2 == gp1 or cid2 == gp2:
                            rule_based_relation = "Grandparent-Grandchild"
                            explanation += "- Person B is grandparent of Person A.\n"
            for p in [row2['FATHER CID NUMBER'], row2['MOTHER CID NUMBER']]:
                if pd.notna(p):
                    parent_row = self.df[self.df['CID NO'] == p]
                    if not parent_row.empty:
                        gp1 = parent_row.iloc[0]['FATHER CID NUMBER']
                        gp2 = parent_row.iloc[0]['MOTHER CID NUMBER']
                        if cid1 == gp1 or cid1 == gp2:
                            rule_based_relation = "Grandparent-Grandchild"
                            explanation += "- Person A is grandparent of Person B.\n"

        # Aunt/Uncle check (gender-aware)
        if rule_based_relation == "Unknown":
            def is_sibling(p1, p2):
                return p1['FATHER CID NUMBER'] == p2['FATHER CID NUMBER'] and \
                    p1['MOTHER CID NUMBER'] == p2['MOTHER CID NUMBER']

            p1_father_row = self.df[self.df['CID NO'] == row1['FATHER CID NUMBER']]
            p2_father_row = self.df[self.df['CID NO'] == row2['FATHER CID NUMBER']]

            if not p1_father_row.empty and is_sibling(p1_father_row.iloc[0], row2):
                a_gender = str(row1.get("GENDER", "")).strip().lower()
                b_gender = str(row2.get("GENDER", "")).strip().lower()

                if a_gender == "male":
                    if b_gender == "male":
                        rule_based_relation = "Uncle - Nephew"
                        explanation += "- Person A is an uncle to Person B (who is a nephew).\n"
                    elif b_gender == "female":
                        rule_based_relation = "Uncle - Niece"
                        explanation += "- Person A is an uncle to Person B (who is a niece).\n"
                    else:
                        rule_based_relation = "Uncle - Niece/Nephew"
                        explanation += "- Person A is an uncle to Person B.\n"

                elif a_gender == "female":
                    if b_gender == "male":
                        rule_based_relation = "Aunt - Nephew"
                        explanation += "- Person A is an aunt to Person B (who is a nephew).\n"
                    elif b_gender == "female":
                        rule_based_relation = "Aunt - Niece"
                        explanation += "- Person A is an aunt to Person B (who is a niece).\n"
                    else:
                        rule_based_relation = "Aunt - Niece/Nephew"
                        explanation += "- Person A is an aunt to Person B.\n"
                else:
                    rule_based_relation = "Aunt/Uncle - Niece/Nephew"
                    explanation += "- Person A is a sibling of Person B's parent.\n"

            elif not p2_father_row.empty and is_sibling(p2_father_row.iloc[0], row1):
                a_gender = str(row1.get("GENDER", "")).strip().lower()
                b_gender = str(row2.get("GENDER", "")).strip().lower()

                if b_gender == "male":
                    if a_gender == "male":
                        rule_based_relation = "Uncle - Nephew"
                        explanation += "- Person B is an uncle to Person A (who is a nephew).\n"
                    elif a_gender == "female":
                        rule_based_relation = "Uncle - Niece"
                        explanation += "- Person B is an uncle to Person A (who is a niece).\n"
                    else:
                        rule_based_relation = "Uncle - Niece/Nephew"
                        explanation += "- Person B is an uncle to Person A.\n"

                elif b_gender == "female":
                    if a_gender == "male":
                        rule_based_relation = "Aunt - Nephew"
                        explanation += "- Person B is an aunt to Person A (who is a nephew).\n"
                    elif a_gender == "female":
                        rule_based_relation = "Aunt - Niece"
                        explanation += "- Person B is an aunt to Person A (who is a niece).\n"
                    else:
                        rule_based_relation = "Aunt - Niece/Nephew"
                        explanation += "- Person B is an aunt to Person A.\n"
                else:
                    rule_based_relation = "Aunt/Uncle - Niece/Nephew"
                    explanation += "- Person B is a sibling of Person A's parent.\n"

        # In-laws check (extended logic)
        if rule_based_relation == "Unknown":
            spouse1 = row1['SPOUSE CID NUMBER']
            spouse2 = row2['SPOUSE CID NUMBER']
            f1 = row1['FATHER CID NUMBER']
            m1 = row1['MOTHER CID NUMBER']
            f2 = row2['FATHER CID NUMBER']
            m2 = row2['MOTHER CID NUMBER']

            df_lookup = self.df

            # Parent-in-law
            if spouse1 in [f2, m2] or spouse2 in [f1, m1]:
                rule_based_relation = "Parent-in-law"
                explanation += "- One is likely the parent-in-law of the other.\n"

            # Sibling-in-law
            elif (
                (pd.notna(spouse1) and pd.notna(f2) and spouse1 in df_lookup[df_lookup['FATHER CID NUMBER'] == f2]['CID NO'].values) or
                (pd.notna(spouse2) and pd.notna(f1) and spouse2 in df_lookup[df_lookup['FATHER CID NUMBER'] == f1]['CID NO'].values)
            ):
                rule_based_relation = "Sibling-in-law"
                explanation += "- One is likely the sibling-in-law of the other.\n"

            # Son-in-law / Daughter-in-law detection (bidirectional)
            children_of_row1 = self.df[
                (self.df['FATHER CID NUMBER'] == row1['CID NO']) |
                (self.df['MOTHER CID NUMBER'] == row1['CID NO'])
            ]

            for _, child in children_of_row1.iterrows():
                if child['SPOUSE CID NUMBER'] == row2['CID NO']:
                    b_gender = str(row2.get("GENDER", "")).strip().lower()
                    if b_gender == "male":
                        rule_based_relation = "Son-in-law"
                        explanation += "- Person B is likely the son-in-law of Person A.\n"
                    elif b_gender == "female":
                        rule_based_relation = "Daughter-in-law"
                        explanation += "- Person B is likely the daughter-in-law of Person A.\n"
                    else:
                        rule_based_relation = "Child-in-law"
                        explanation += "- Person B is likely a child-in-law of Person A.\n"

            children_of_row2 = self.df[
                (self.df['FATHER CID NUMBER'] == row2['CID NO']) |
                (self.df['MOTHER CID NUMBER'] == row2['CID NO'])
            ]

            for _, child in children_of_row2.iterrows():
                if child['SPOUSE CID NUMBER'] == row1['CID NO']:
                    a_gender = str(row1.get("GENDER", "")).strip().lower()
                    if a_gender == "male":
                        rule_based_relation = "Son-in-law"
                        explanation += "- Person A is likely the son-in-law of Person B.\n"
                    elif a_gender == "female":
                        rule_based_relation = "Daughter-in-law"
                        explanation += "- Person A is likely the daughter-in-law of Person B.\n"
                    else:
                        rule_based_relation = "Child-in-law"
                        explanation += "- Person A is likely a child-in-law of Person B.\n"

        # Unrelated fallback
        if rule_based_relation == "Unknown":
            if row1['DZONGKHAG'] == row2['DZONGKHAG'] and row1['GEWOG'] == row2['GEWOG']:
                rule_based_relation = "Unrelated (Same Dzongkhag & Gewog)"
                explanation += "- No known relation between Person A and Person B, but they are from the same dzongkhag and gewog.\n"
            elif row1['DZONGKHAG'] == row2['DZONGKHAG']:
                rule_based_relation = "Unrelated (Same Dzongkhag)"
                explanation += "- No known relation between Person A and Person B, but they are from the same dzongkhag.\n"
            elif row1['GEWOG'] == row2['GEWOG']:
                rule_based_relation = "Unrelated (Same Gewog)"
                explanation += "- No known relation between Person A and Person B, but they are from the same gewog.\n"
            else:
                rule_based_relation = "Unrelated"
                explanation += "- No known relation between Person A and Person B.\n"

        return {
            "ai_prediction": model_relation,
            "confidence": round(confidence, 2),
            "rule_based": rule_based_relation,
            "explanation": explanation.strip()
    }
