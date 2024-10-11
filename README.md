Deco3801
Introduction
This directory contains all the relevant code for state capture and graphical processing. The project aims to capture the real-time state from the Shapez Mod game and display it on a GUI for users to view and analyze.

Installation
Shapez Mod Installation: Place the latest mymodv6.js file into the mods/ folder. You can locate the mods/ folder by clicking the "Open Mods Folder" button in the Shapez Standalone version. Ensure that you have selected the 1.5.0-modloader branch in Steam.

Additional Dependencies: Please make sure to install the following dependencies for both Python and JavaScript as required.

Usage
Press Ctrl + P: This will print the current state information of the Shapez game to the console and generate a solution for the target shape.

Start the GUI Interface: Run gui.py or open index.html in your browser to launch the graphical interface for interactive operations.

Data Transmission: Use websocket_server.py to perform data communication between the JS and Python side (only for the initial version).

File Structure
graphql
Copy code
Deco3801/
├── __pycache__/                    # Python cache folder
├── image/                          # Image resources used by the GUI interface
│   └── (related image files)
├── route/                          # Folder containing test shape shortcodes
│   └── GUI                         # Stores test files related to the GUI
├── README.md                       # Project documentation
├── gui.py                          # Initial Python version of the GUI interface code
├── index.html                      # HTML version of the GUI interface
├── instruction.txt                 # Operation instruction file
├── mymodv3.js                      # Mod implementation for version 3
├── mymodv4.js                      # Mod implementation for version 4
├── mymodv5.js                      # Mod implementation for version 5
├── mymodv6.js                      # Latest Shapez Mod, used for state capture
├── starter.py                      # Script file for starting the program
├── style.css                       # CSS style file for the HTML GUI
├── style.js                        # JavaScript file for the HTML GUI interactions
├── template.zip                    # Template file (contents need to be filled)
├── test.txt                        # Test text file
├── translator.py                   # Translator module for converting solver code into human-readable text
├── websocket_server.py             # WebSocket server used for data transmission between JS and Python in earlier versions
Main File Descriptions
gui.py: Python-based GUI interface code, used for visual analysis of Shapez game's state information.
index.html: HTML-based GUI interface, providing basic graphical operations and interaction functionalities.
mymodv6.js: The latest version of the Shapez Mod for capturing game states and controlling operations within Shapez.
websocket_server.py: Used for JS-to-Python data communication in the early versions.

Authors
Water Bottle: Project creator and main contributor.
Adjustment Explanation
I translated the provided content into English while retaining all the original structure and formatting.
For files without detailed content (e.g., template.zip), I only marked them and did not describe their functions specifically.
If you need more detailed descriptions for any particular file or section, feel free to let me know for further adjustments.
