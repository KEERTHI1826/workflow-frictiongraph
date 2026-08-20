import streamlit as st
import pandas as pd

st.set_page_config(
    page_title="Workflow Friction Monitor",
    layout="wide"
)

st.title("🚦 Workflow Friction Monitor")
st.write(
    "Explainable detection of customer onboarding bottlenecks"
)

# Load data
df = pd.read_csv("data/final_bottleneck_results.csv")

# Project statistics
total_tasks = len(df)
high_risk = len(df[df["friction_level"] == "High"])
average_friction = df["friction_score"].mean()

# Top metrics
col1, col2, col3 = st.columns(3)

col1.metric(
    "Total Tasks",
    total_tasks
)

col2.metric(
    "High Friction Tasks",
    high_risk
)

col3.metric(
    "Average Friction",
    round(average_friction, 2)
)

st.divider()

# Top bottlenecks
st.subheader("🔴 Top Workflow Bottlenecks")

top_bottlenecks = df.sort_values(
    by="bottleneck_score",
    ascending=False
).head(10)

st.dataframe(
    top_bottlenecks[
        [
            "project_id",
            "task_name",
            "friction_score",
            "bottleneck_score",
            "friction_level",
            "recommended_action"
        ]
    ],
    use_container_width=True
)

st.divider()

# Select a task
st.subheader("🔍 Bottleneck Investigation")

selected_task = st.selectbox(
    "Select a task",
    df["task_name"].unique()
)

task = df[
    df["task_name"] == selected_task
].iloc[0]

col1, col2 = st.columns(2)

with col1:

    st.write("### Task Information")

    st.write(
        "**Project:**",
        task["project_id"]
    )

    st.write(
        "**Task:**",
        task["task_name"]
    )

    st.write(
        "**Friction Score:**",
        round(task["friction_score"], 2)
    )

    st.write(
        "**Bottleneck Score:**",
        round(task["bottleneck_score"], 2)
    )

with col2:

    st.write("### Why is this task risky?")

    st.write(
        "**Response Delay:**",
        task["response_delay"]
    )

    st.write(
        "**Rework Count:**",
        task["rework_count"]
    )

    st.write(
        "**Dependencies:**",
        task["dependency_count"]
    )

    st.write(
        "**Team Workload:**",
        task["team_workload"],
        "%"
    )

st.divider()

st.subheader("💡 Recommended Action")

st.info(
    task["recommended_action"]
)