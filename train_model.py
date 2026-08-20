import pandas as pd

# Load the dataset
df = pd.read_csv("data/customer_onboarding.csv")

# Calculate bottleneck impact
df["bottleneck_score"] = (
    df["friction_score"] * 0.7
    + df["dependency_count"] * 10 * 0.3
)

# Sort tasks by bottleneck score
bottlenecks = df.sort_values(
    by="bottleneck_score",
    ascending=False
)

print("\nTOP WORKFLOW BOTTLENECKS")
print("------------------------")

print(
    bottlenecks[
        [
            "project_id",
            "task_name",
            "friction_score",
            "dependency_count",
            "bottleneck_score",
            "friction_level"
        ]
    ].head(10).to_string(index=False)
)

# Save results
bottlenecks.to_csv(
    "data/bottleneck_results.csv",
    index=False
)

print("\nBottleneck analysis completed!")
print("Results saved to data/bottleneck_results.csv")