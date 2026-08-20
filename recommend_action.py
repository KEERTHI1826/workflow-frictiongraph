import pandas as pd

df = pd.read_csv("data/bottleneck_results.csv")

def recommend_action(row):

    if row["response_delay"] >= 3:
        return "Send customer reminder or escalate the pending response."

    elif row["rework_count"] >= 2:
        return "Review the task requirements and assign an experienced team member."

    elif row["dependency_count"] >= 2:
        return "Prioritize the blocking dependency and coordinate with the dependent team."

    elif row["team_workload"] >= 85:
        return "Redistribute workload or reassign the task."

    elif row["actual_days"] > row["planned_days"]:
        return "Review task progress and investigate the cause of delay."

    else:
        return "Continue monitoring the task."


df["recommended_action"] = df.apply(
    recommend_action,
    axis=1
)

top_tasks = df.sort_values(
    by="bottleneck_score",
    ascending=False
).head(10)

print("\nBOTTLENECK ACTION RECOMMENDATIONS")
print("---------------------------------")

for _, row in top_tasks.iterrows():

    print("\nProject:", row["project_id"])
    print("Task:", row["task_name"])
    print("Friction Score:", row["friction_score"])
    print("Bottleneck Score:", round(row["bottleneck_score"], 2))

    print("Recommended Action:")
    print(row["recommended_action"])

df.to_csv(
    "data/final_bottleneck_results.csv",
    index=False
)

print("\nRecommendations generated successfully!")