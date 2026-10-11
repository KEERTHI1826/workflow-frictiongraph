let records = [];
let columns = [];
let stageColumn = "";
let scoreColumn = "";
let chart = null;

// CSV parser that supports quoted values and commas inside quotes
function parseCSV(text) {
    const lines = [];
    let row = [];
    let value = "";
    let quoted = false;

    text = text.replace(/^\uFEFF/, "");

    for (let i = 0; i < text.length; i++) {
        const c = text[i];

        if (c === '"' && quoted && text[i + 1] === '"') {
            value += '"';
            i++;
        } else if (c === '"') {
            quoted = !quoted;
        } else if (c === "," && !quoted) {
            row.push(value.trim());
            value = "";
        } else if ((c === "\n" || c === "\r") && !quoted) {
            if (c === "\r" && text[i + 1] === "\n") i++;

            row.push(value.trim());

            if (row.some(item => item !== "")) {
                lines.push(row);
            }

            row = [];
            value = "";
        } else {
            value += c;
        }
    }

    row.push(value.trim());

    if (row.some(item => item !== "")) {
        lines.push(row);
    }

    if (lines.length < 2) return [];

    const headers = lines.shift().map(
        (name, i) => name || `column_${i + 1}`
    );

    return lines.map(line =>
        Object.fromEntries(
            headers.map((header, i) => [header, line[i] ?? ""])
        )
    );
}

function isNumber(value) {
    return value !== "" &&
        value !== null &&
        value !== undefined &&
        Number.isFinite(Number(value));
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function average(values) {
    return values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null;
}

function getStages() {
    const groups = {};

    records.forEach(record => {
        const name = String(record[stageColumn] || "Unknown");

        if (!groups[name]) groups[name] = [];

        groups[name].push(record);
    });

    return Object.entries(groups).map(([name, rows]) => {
        const scores = rows
            .map(row => Number(row[scoreColumn]))
            .filter((value, i) =>
                scoreColumn && isNumber(rows[i][scoreColumn])
            );

        return {
            name,
            rows,
            count: rows.length,
            score: average(scores)
        };
    });
}

function priority(score) {
    if (score === null) return "low";
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
}

function loadData(data, filename = "CSV data") {
    if (!data.length) {
        alert("No data found in this CSV file.");
        return;
    }

    records = data;
    columns = Object.keys(records[0]);

    // Automatically identify likely stage and score columns.
    stageColumn =
        columns.find(c => /stage|step|task|activity|process|phase|node/i.test(c))
        || columns[0];

    scoreColumn =
        columns.find(c =>
            /friction|bottleneck|score|delay|duration|wait|latency/i.test(c)
            && records.some(row => isNumber(row[c]))
        )
        || columns.find(c =>
            records.some(row => isNumber(row[c]))
        )
        || "";

    document.title = "WorkflowIQ - " + filename;

    renderDashboard();
}

function renderDashboard() {
    const stages = getStages();

    const scores = scoreColumn
        ? records.map(row => Number(row[scoreColumn]))
            .filter((value, i) => isNumber(records[i][scoreColumn]))
        : [];

    const avg = average(scores);

    document.getElementById("totalRecords").textContent =
        records.length.toLocaleString();

    document.getElementById("stageCount").textContent =
        stages.length.toLocaleString();

    document.getElementById("bottleneckCount").textContent =
        stages.filter(s => s.score !== null && s.score >= 70).length;

    document.getElementById("avgFriction").textContent =
        avg === null ? "N/A" : avg.toFixed(1);

    renderChart(stages);
    renderTable();
    renderBottlenecks();
    renderWorkflow(stages);
    renderRecommendations(stages);
}

function renderChart(stages) {
    const canvas = document.getElementById("frictionChart");

    if (chart) {
        chart.destroy();
        chart = null;
    }

    if (!window.Chart || !scoreColumn) {
        canvas.parentElement.insertAdjacentHTML(
            "beforeend",
            '<p class="chart-message">A numeric score column is needed for the chart.</p>'
        );
        return;
    }

    const labels = stages.slice(0, 12);

    chart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: labels.map(s => s.name),
            datasets: [{
                label: scoreColumn,
                data: labels.map(s => s.score),
                backgroundColor: labels.map(s =>
                    s.score >= 70 ? "#ed8d72" :
                        s.score >= 40 ? "#e8c76b" : "#8979ed"
                ),
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function renderTable() {
    const search = document
        .getElementById("searchInput")
        .value.toLowerCase();

    const filtered = records.filter(row =>
        Object.values(row).some(value =>
            String(value).toLowerCase().includes(search)
        )
    ).slice(0, 100);

    document.getElementById("tableHead").innerHTML =
        "<tr>" +
        columns.map(c => `<th>${escapeHTML(c)}</th>`).join("") +
        "</tr>";

    document.getElementById("tableBody").innerHTML =
        filtered.map(row =>
            "<tr>" +
            columns.map(c =>
                `<td>${escapeHTML(row[c])}</td>`
            ).join("") +
            "</tr>"
        ).join("");
}

function renderBottlenecks() {
    const stages = getStages()
        .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

    document.getElementById("bottleneckList").innerHTML =
        stages.map(stage => {
            const level = priority(stage.score);

            return `
                <div class="result-item">
                    <strong>${escapeHTML(stage.name)}</strong>
                    <p>Records: ${stage.count}</p>
                    <p>Average score: ${stage.score === null
                    ? "N/A"
                    : stage.score.toFixed(1)
                }</p>
                    <span class="priority ${level}">
                        ${level.toUpperCase()} PRIORITY
                    </span>
                </div>
            `;
        }).join("");
}

function renderWorkflow(stages) {
    const graph = document.getElementById("workflowGraph");

    graph.innerHTML = stages.slice(0, 15).map((stage, index) => `
        <button class="flow-node ${index === 0 ? "selected" : ""}"
            data-stage="${escapeHTML(stage.name)}">
            ${escapeHTML(stage.name)}
        </button>
    `).join("");

    graph.querySelectorAll(".flow-node").forEach(button => {
        button.addEventListener("click", () => {
            graph.querySelectorAll(".flow-node")
                .forEach(node => node.classList.remove("selected"));

            button.classList.add("selected");

            const stage = stages.find(
                s => s.name === button.dataset.stage
            );

            if (!stage) return;

            document.getElementById("stageDetails").innerHTML = `
                <h3>${escapeHTML(stage.name)}</h3>
                <p>Records: ${stage.count}</p>
                <p>Average score: ${stage.score === null
                    ? "N/A"
                    : stage.score.toFixed(1)
                }</p>
                <br>
                <strong>Example record details</strong>
                ${columns.filter(c => c !== stageColumn).slice(0, 6)
                    .map(c => `
                        <p>${escapeHTML(c)}:
                        ${escapeHTML(stage.rows[0][c])}</p>
                    `).join("")}
            `;
        });
    });

    if (stages.length) {
        graph.querySelector(".flow-node")?.click();
    }
}

function renderRecommendations(stages) {
    const sorted = [...stages]
        .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

    document.getElementById("recommendationList").innerHTML =
        sorted.map(stage => {
            const level = priority(stage.score);

            let advice;

            if (stage.score === null) {
                advice = "Review this stage and collect friction or delay measurements.";
            } else if (stage.score >= 70) {
                advice = "Investigate delays, repeated manual work, and approval handoffs first.";
            } else if (stage.score >= 40) {
                advice = "Review the process and measure where waiting time accumulates.";
            } else {
                advice = "Continue monitoring this stage and maintain the current process.";
            }

            return `
                <div class="result-item">
                    <strong>${escapeHTML(stage.name)}</strong>
                    <p>${advice}</p>
                    <span class="priority ${level}">
                        ${level.toUpperCase()} PRIORITY
                    </span>
                </div>
            `;
        }).join("");
}

// Navigation between dashboard sections
document.querySelectorAll(".nav").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".nav")
            .forEach(item => item.classList.remove("active"));

        button.classList.add("active");

        document.querySelectorAll(".view")
            .forEach(view => view.classList.add("hidden"));

        document.getElementById(
            button.dataset.view + "View"
        ).classList.remove("hidden");

        const titles = {
            overview: "Dashboard Overview",
            bottlenecks: "Bottleneck Analysis",
            workflow: "Workflow Graph",
            recommendations: "Recommended Actions"
        };

        document.getElementById("pageTitle").textContent =
            titles[button.dataset.view];
    });
});

// Search records
document.getElementById("searchInput")
    .addEventListener("input", renderTable);

// Import any CSV file from your computer
document.getElementById("csvInput")
    .addEventListener("change", async event => {
        const file = event.target.files[0];

        if (!file) return;

        try {
            const text = await file.text();
            loadData(parseCSV(text), file.name);
        } catch (error) {
            alert("Unable to read the CSV file.");
        }

        event.target.value = "";
    });

// Try loading your existing CSV files automatically.
// The page must be served through a local web server.
async function autoLoadCSV() {
    const paths = [
        "data/final_bottleneck_results.csv",
        "data/bottleneck_results.csv",
        "data/customer_onboarding.csv"
    ];

    for (const path of paths) {
        try {
            const response = await fetch(path);

            if (!response.ok) continue;

            const text = await response.text();
            const data = parseCSV(text);

            if (data.length) {
                loadData(data, path.split("/").pop());
                return;
            }
        } catch (error) {
            // Try the next candidate file.
        }
    }

    document.getElementById("totalRecords").textContent = "0";
    document.getElementById("stageCount").textContent = "0";
    document.getElementById("bottleneckCount").textContent = "0";
    document.getElementById("avgFriction").textContent = "N/A";

    document.getElementById("tableBody").innerHTML =
        `<tr><td colspan="100">
        No CSV loaded. Click Import CSV to select your dataset.
        </td></tr>`;
}

autoLoadCSV();