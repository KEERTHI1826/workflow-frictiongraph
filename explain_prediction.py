import pandas as pd
import shap

from sklearn.ensemble import RandomForestClassifier

# Load data
df = pd.read_csv("data/bottleneck_results.csv")

# Create target
df["is_bottleneck"] = (
    df["bottleneck_score"] >= 60
).astype(int)

# Features
features = [
    "planned_days",
    "actual_days",
    "response_delay",
    "rework_count",
    "dependency_count",
    "team_workload",
    "friction_score"
]

X = df[features]
y = df["is_bottleneck"]

# Train model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X, y)

# Create SHAP explainer
explainer = shap.TreeExplainer(model)

# Select one task to explain
sample = X.iloc[[0]]

# Calculate SHAP values
shap_values = explainer.shap_values(sample)

print("\nEXPLAINABLE BOTTLENECK ANALYSIS")
print("--------------------------------")

print("Task:")
print(df.iloc[0]["task_name"])

print("\nInput values:")
print(sample.to_string(index=False))

print("\nFeature contributions:")

# Handle SHAP output format
if isinstance(shap_values, list):
    values = shap_values[1][0]
else:
    values = shap_values[0, :, 1]

for feature, value in zip(features, values):
    print(
        f"{feature}: {value:.4f}"
    )