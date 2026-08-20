import pandas as pd
import networkx as nx

# Load dataset
df = pd.read_csv("data/customer_onboarding.csv")

# Create a directed graph
G = nx.DiGraph()

# Task order in the onboarding workflow
task_order = [
    "Requirement Collection",
    "API Integration",
    "Data Migration",
    "Configuration",
    "Testing",
    "Customer Approval",
    "Deployment"
]

# Add tasks as nodes
for task in task_order:
    G.add_node(task)

# Add workflow dependencies
for i in range(len(task_order) - 1):
    G.add_edge(task_order[i], task_order[i + 1])

# Calculate downstream impact
print("WORKFLOW DEPENDENCY GRAPH")
print("--------------------------")

for task in task_order:
    downstream_tasks = list(nx.descendants(G, task))

    print("\nTask:", task)
    print("Affected downstream tasks:", len(downstream_tasks))

    if downstream_tasks:
        print("Tasks affected:", downstream_tasks)
    else:
        print("No downstream tasks")