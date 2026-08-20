import pandas as pd

# Load the dataset
df = pd.read_csv("data/customer_onboarding.csv")

# Calculate how many days a task exceeded its planned duration
df["delay_days"] = df["actual_days"] - df["planned_days"]

# Negative delay is not considered
df["delay_days"] = df["delay_days"].clip(lower=0)

# Convert delay into a percentage
df["delay_score"] = (
    df["delay_days"] / df["planned_days"] * 100
).clip(upper=100)

# Convert other factors into scores
response_score = (df["response_delay"] / 4 * 100).clip(upper=100)
rework_score = (df["rework_count"] / 3 * 100).clip(upper=100)
dependency_score = (df["dependency_count"] / 3 * 100).clip(upper=100)
workload_score = df["team_workload"]

# Calculate overall friction score
df["friction_score"] = (
    0.30 * df["delay_score"]
    + 0.20 * response_score
    + 0.15 * rework_score
    + 0.15 * dependency_score
    + 0.20 * workload_score
)

# Round the score
df["friction_score"] = df["friction_score"].round(2)

# Assign friction level
def get_friction_level(score):
    if score < 30:
        return "Low"
    elif score < 60:
        return "Moderate"
    else:
        return "High"

df["friction_level"] = df["friction_score"].apply(get_friction_level)

# Save the updated dataset
df.to_csv("data/customer_onboarding.csv", index=False)

print("Friction score calculated successfully!")
print(df[[
    "task_name",
    "friction_score",
    "friction_level"
]].head(10))