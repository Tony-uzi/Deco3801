document.addEventListener("DOMContentLoaded", () => {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabPanes.forEach(pane => pane.classList.remove("active"));

            button.classList.add("active");
            const tab = button.getAttribute("data-tab");
            document.getElementById(tab).classList.add("active");
        });
    });

    const conveyorData = [
        { id: "Conveyor 1", items: "1000", efficiency: 10 },
        { id: "Conveyor 2", items: "500", efficiency: 25 },
        { id: "Conveyor 3", items: "200", efficiency: 30 }
    ];

    function renderConveyorTable(conveyorData) {
        const tableBody = document.getElementById("conveyor-table-body");
        tableBody.innerHTML = ""; // Clear previous rows
        conveyorData.forEach(conveyor => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${conveyor.id}</td>
                <td>${conveyor.items}</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${conveyor.efficiency}%"></div>
                        </div>
                        <span class="efficiency-percentage">${conveyor.efficiency}%</span>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function updateAIScriptViewer(conveyorData) {
        const totalEfficiency = conveyorData.reduce((acc, conveyor) => acc + conveyor.efficiency, 0);
        const averageEfficiency = conveyorData.length > 0 ? (totalEfficiency / conveyorData.length).toFixed(2) : 0;
        document.getElementById('average-productivity').innerText = `Average Productivity: ${averageEfficiency}%`;

        let imageFilename = "ok.png";
        if (averageEfficiency < 40) imageFilename = "angry.png";
        else if (averageEfficiency > 80) imageFilename = "happy.png";

        const productivityImage = document.getElementById('productivity-image');
        productivityImage.src = `images/${imageFilename}`;
        productivityImage.alt = `Productivity Image (${imageFilename.split('.')[0]})`;
    }

    renderConveyorTable(conveyorData);
    updateAIScriptViewer(conveyorData);
});
