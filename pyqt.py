import sys
import os
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QLabel, QVBoxLayout, QTabWidget, QTextEdit, QGridLayout, QProgressBar
)
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QPixmap

class MainWindow(QMainWindow):
    def __init__(self, file_path, conveyor_data):
        super().__init__()
        self.setWindowTitle("Shapez.AI")
        self.setGeometry(100, 100, 600, 400)  # Smaller frame

        # Create the central widget and set the layout
        central_widget = QWidget()
        layout = QVBoxLayout(central_widget)

        # Create notebook (tabs)
        self.tab_widget = QTabWidget()

        # Page 1: AI Script Viewer
        self.page1 = QWidget()
        self.setup_ai_script_viewer(self.page1, file_path)  # Pass file_path to load the file content
        self.tab_widget.addTab(self.page1, "AI Script Viewer")

        # Page 2: Shapez.io Productivity
        self.page2 = QWidget()
        self.setup_shapez_productivity(self.page2, conveyor_data)
        self.tab_widget.addTab(self.page2, "Shapez.io Productivity")

        # Add the tabs to the layout
        layout.addWidget(self.tab_widget)
        self.setCentralWidget(central_widget)

    def setup_ai_script_viewer(self, page, file_path):
        layout = QVBoxLayout()

        # Set the image path to the "image" folder
        image_folder = "images"
        image_filename = "ok.png"  # Placeholder
        image_path = os.path.join(image_folder, image_filename)

        # Load and display the image
        image_label = QLabel()
        if os.path.exists(image_path):
            pixmap = QPixmap(image_path)
            image_label.setPixmap(pixmap.scaled(100, 100, Qt.KeepAspectRatio))
        else:
            image_label.setText("Image not found")
        image_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(image_label)

        # Average productivity label (Placeholder for now)
        avg_productivity_label = QLabel(f"Average Productivity: 60.00%")
        avg_productivity_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(avg_productivity_label)

        # Multi-line text box to display the content of instruction.txt
        script_display = QTextEdit()
        script_display.setReadOnly(True)
        layout.addWidget(script_display)

        # Load the content of instruction.txt and set it to script_display
        self.load_file_content(file_path, script_display)

        page.setLayout(layout)

    def load_file_content(self, file_path, script_display):
        # Load the contents of instruction.txt
        try:
            with open(file_path, 'r') as file:
                content = file.read()
                script_display.setText(content)
        except FileNotFoundError:
            script_display.setText("File not found.")

    def setup_shapez_productivity(self, page, conveyor_data):
        layout = QGridLayout()

        # Add headers for the columns
        layout.addWidget(QLabel("Conveyor ID"), 0, 0, Qt.AlignCenter)
        layout.addWidget(QLabel("Items Transported"), 0, 1, Qt.AlignCenter)
        layout.addWidget(QLabel("Efficiency"), 0, 2, Qt.AlignCenter)

        # Add rows for each conveyor
        for i, (conveyor_id, items, efficiency) in enumerate(conveyor_data):
            # Add Conveyor ID
            layout.addWidget(QLabel(conveyor_id), i + 1, 0)

            # Add Items Transported
            layout.addWidget(QLabel(items), i + 1, 1)

            # Create horizontal layout to hold the progress bar and percentage
            bar_layout = QVBoxLayout()

            # Create progress bar for efficiency
            efficiency_bar = QProgressBar()
            efficiency_bar.setValue(efficiency)
            efficiency_bar.setTextVisible(False)  # Hide default percentage text on the bar

            # Create a label for the percentage
            efficiency_label = QLabel(f"{efficiency}%")

            # Add progress bar and percentage label to the horizontal layout
            bar_layout.addWidget(efficiency_bar)
            bar_layout.addWidget(efficiency_label)

            # Add the horizontal layout to the grid
            layout.addLayout(bar_layout, i + 1, 2)

        page.setLayout(layout)




# Main application logic
if __name__ == "__main__":
    app = QApplication(sys.argv)

    # Example conveyor data
    conveyor_data = [
        ("Conveyor 1", "1000", 95),
        ("Conveyor 2", "1200", 85),
        ("Conveyor 3", "500", 75),
        ("Conveyor 4", "700", 65),
        ("Conveyor 5", "900", 50)
    ]

    # Create the main window and pass the path of instruction.txt
    window = MainWindow("instruction.txt", conveyor_data)
    window.show()

    sys.exit(app.exec_())
