import pandas as pd
import random

# Reproducible results
random.seed(42)

# Task names
task_names = [
    "Requirement Collection",
    "API Integration",
    "Data Migration",
    "Configuration",
    "Testing",
    "Customer Approval",
    "Deployment"
]

# Possible task statuses
statuses = ["Completed", "In Progress", "Delayed"]

# Store generated records
records = []

# Generate 30 projects
for project_number in range(1, 31):

    project_id = f"P{project_number:03d}"

    for task_number, task_name in enumerate(task_names, start=1):

        task_id = f"T{task_number:03d}"

        planned_days = random.randint(2, 6)

        # Actual duration
        actual_days = planned_days + random.randint(-1, 4)
        actual_days = max(actual_days, 1)

        # Customer response delay
        response_delay = random.randint(0, 4)

        # Number of times task was reworked
        rework_count = random.randint(0, 3)

        # Number of dependencies
        dependency_count = random.randint(0, 3)

        # Team workload percentage
        team_workload = random.randint(40, 100)

        # Determine task status
        if actual_days > planned_days + 1:
            task_status = "Delayed"
        elif actual_days == planned_days:
            task_status = "Completed"
        else:
            task_status = "In Progress"

        records.append({
            "project_id": project_id,
            "task_id": task_id,
            "task_name": task_name,
            "planned_days": planned_days,
            "actual_days": actual_days,
            "response_delay": response_delay,
            "rework_count": rework_count,
            "dependency_count": dependency_count,
            "team_workload": team_workload,
            "task_status": task_status
        })

# Convert records into a DataFrame
df = pd.DataFrame(records)

# Save dataset
df.to_csv("data/customer_onboarding.csv", index=False)

print("Dataset generated successfully!")
print("Total records:", len(df))
print(df.head(10))