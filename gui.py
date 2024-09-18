import wx
import os

###########################################################################
## Class FrameMain
###########################################################################

class FrameMain(wx.Frame):

    def __init__(self, parent, file_path, conveyor_data):
        wx.Frame.__init__(self, parent, id=wx.ID_ANY, title=("Shapez.AI"), pos=wx.DefaultPosition, size=wx.Size(600, 500),
                          style=wx.DEFAULT_FRAME_STYLE | wx.TAB_TRAVERSAL)

        self.SetSizeHints(wx.DefaultSize, wx.DefaultSize)
        self.SetForegroundColour(wx.SystemSettings.GetColour(wx.SYS_COLOUR_BTNHIGHLIGHT))
        self.SetBackgroundColour(wx.SystemSettings.GetColour(wx.SYS_COLOUR_INFOBK))

        # Main layout
        MainFrame = wx.BoxSizer(wx.HORIZONTAL)

        # Create notebook
        self.notebook = wx.Notebook(self, wx.ID_ANY, wx.DefaultPosition, wx.DefaultSize, 0)

        # Page 1 - AI Script Viewer with Image and Productivity Display
        self.page1 = wx.Panel(self.notebook, wx.ID_ANY, wx.DefaultPosition, wx.DefaultSize, wx.TAB_TRAVERSAL)
        sbSizer1 = wx.StaticBoxSizer(wx.StaticBox(self.page1, wx.ID_ANY, "AI Script Viewer"), wx.VERTICAL)

        # Image at the top (angry, ok, happy)
        self.image_ctrl = wx.StaticBitmap(self.page1, wx.ID_ANY)
        sbSizer1.Add(self.image_ctrl, 0, wx.ALIGN_CENTER | wx.ALL, 10)  # Align center

        # Text to display the average productivity
        self.avg_productivity_text = wx.StaticText(self.page1, wx.ID_ANY, "", wx.DefaultPosition, wx.DefaultSize, 0)
        sbSizer1.Add(self.avg_productivity_text, 0, wx.ALIGN_CENTER | wx.ALL, 5)

        # Multi-line text box to display the file content
        self.script_display = wx.TextCtrl(self.page1, wx.ID_ANY, "", wx.DefaultPosition, wx.DefaultSize,
                                          style=wx.TE_MULTILINE | wx.TE_READONLY)
        sbSizer1.Add(self.script_display, 1, wx.EXPAND | wx.ALL, 5)

        # Set the layout for page 1
        self.page1.SetSizer(sbSizer1)
        self.page1.Layout()
        sbSizer1.Fit(self.page1)
        self.notebook.AddPage(self.page1, "AI Script Viewer", True)

        # Automatically load the file and display its content
        self.load_file(file_path)

        # Page 2 - Shapez.io Productivity with Scrolling
        self.page2 = wx.ScrolledWindow(self.notebook, wx.ID_ANY, wx.DefaultPosition, wx.DefaultSize, wx.HSCROLL | wx.VSCROLL)
        self.page2.SetScrollRate(5, 5)  # Set scrolling speed

        sbSizer2 = wx.StaticBoxSizer(wx.StaticBox(self.page2, wx.ID_ANY, "Shapez.io Productivity"), wx.VERTICAL)

        # FlexGridSizer for Conveyor productivity with 3 columns
        self.grid_sizer = wx.FlexGridSizer(0, 3, 10, 10)  # 3 columns: Conveyor ID, Items Transported, Efficiency Gauge
        self.grid_sizer.AddGrowableCol(0, 1)  # Make first column (Conveyor ID) expand
        self.grid_sizer.AddGrowableCol(1, 1)  # Make second column (Items Transported) expand
        self.grid_sizer.AddGrowableCol(2, 1)  # Make third column (Efficiency) expand

        # Add Headers for the columns
        self.grid_sizer.Add(wx.StaticText(self.page2, label="Conveyor ID"), flag=wx.ALIGN_CENTER_VERTICAL | wx.EXPAND, proportion=1)
        self.grid_sizer.Add(wx.StaticText(self.page2, label="Items Transported"), flag=wx.ALIGN_CENTER_VERTICAL | wx.EXPAND, proportion=1)
        self.grid_sizer.Add(wx.StaticText(self.page2, label="Efficiency"), flag=wx.ALIGN_CENTER_VERTICAL | wx.EXPAND, proportion=1)

        # Add the grid sizer to the page layout
        sbSizer2.Add(self.grid_sizer, 1, wx.EXPAND | wx.ALL, 5)

        # Set the layout for page 2
        self.page2.SetSizer(sbSizer2)
        self.page2.Layout()
        sbSizer2.Fit(self.page2)
        self.notebook.AddPage(self.page2, "Shapez.io Productivity", False)

        # Add the notebook to the main frame
        MainFrame.Add(self.notebook, 1, wx.EXPAND | wx.ALL, 5)

        # Set the sizer for the main frame
        self.SetSizer(MainFrame)
        self.Layout()

        # Center the frame
        self.Centre(wx.BOTH)

        # Calculate the average productivity and display the image
        self.calculate_and_display_image(conveyor_data)

    def load_file(self, file_path):
        """Automatically loads the .txt file and displays its content in the text box"""
        try:
            with open(file_path, 'r') as file:
                content = file.read()
                self.script_display.SetValue(content)  # Set the content in the text control
        except IOError:
            wx.LogError(f"Cannot open file '{file_path}'.")

    def calculate_and_display_image(self, conveyor_data):
        """Calculates the average productivity and displays the appropriate image and text"""
        if not conveyor_data:
            return

        total_efficiency = 0
        working_conveyors = 0

        for _, _, efficiency in conveyor_data:
            total_efficiency += efficiency
            working_conveyors += 1

        if working_conveyors > 0:
            average_efficiency = total_efficiency / working_conveyors
        else:
            average_efficiency = 0

        # Update the average productivity text below the icon
        self.avg_productivity_text.SetLabel(f"Average Productivity: {average_efficiency:.2f}%")

        # Determine which image to display based on the average efficiency
        if average_efficiency < 40:
            self.show_image("angry.png")  # Show angry image
        elif 40 <= average_efficiency <= 80:
            self.show_image("ok.png")  # Show ok image
        else:
            self.show_image("happy.png")  # Show happy image

    def show_image(self, image_filename):
        """Loads and displays the specified image in the top of page 1"""
        # Replace this with the actual path to the image files
        image_folder = "image"  # Adjust this to your folder
        image_path = os.path.join(image_folder, image_filename)

        if os.path.exists(image_path):
            image = wx.Image(image_path, wx.BITMAP_TYPE_ANY).Scale(100, 100).ConvertToBitmap()  # Adjust image size
            self.image_ctrl.SetBitmap(image)
            self.image_ctrl.Refresh()
        else:
            wx.LogError(f"Image file '{image_path}' not found.")

    def add_conveyor_row(self, conveyor_id, items, efficiency):
        """Adds a conveyor row to the grid with a gauge for efficiency"""
        # Add Conveyor ID, Items Transported, and Efficiency
        self.grid_sizer.Add(wx.StaticText(self.page2, label=conveyor_id), flag=wx.ALIGN_CENTER_VERTICAL | wx.EXPAND, proportion=1)
        self.grid_sizer.Add(wx.StaticText(self.page2, label=items), flag=wx.ALIGN_CENTER_VERTICAL | wx.EXPAND, proportion=1)

        # Create a panel for the gauge with text label (Efficiency percentage)
        efficiency_panel = wx.Panel(self.page2)
        hbox = wx.BoxSizer(wx.HORIZONTAL)

        # Efficiency Gauge (wx.Gauge)
        efficiency_gauge = wx.Gauge(efficiency_panel, range=100, size=(150, 20))
        efficiency_gauge.SetValue(efficiency)
        hbox.Add(efficiency_gauge, flag=wx.EXPAND)

        # Efficiency Label
        efficiency_label = wx.StaticText(efficiency_panel, label=f"{efficiency}%")
        hbox.Add(efficiency_label, flag=wx.LEFT, border=10)

        # Set layout for the panel and add to the grid
        efficiency_panel.SetSizer(hbox)
        self.grid_sizer.Add(efficiency_panel, flag=wx.EXPAND, proportion=1)

        # Add a separator line below each conveyor row
        self.grid_sizer.Add(wx.StaticLine(self.page2), flag=wx.EXPAND | wx.ALL, border=5)
        self.grid_sizer.Add(wx.StaticLine(self.page2), flag=wx.EXPAND | wx.ALL, border=5)
        self.grid_sizer.Add(wx.StaticLine(self.page2), flag=wx.EXPAND | wx.ALL, border=5)


# Outside the class: Function to insert conveyor data from external input
def add_conveyors_from_data(frame, conveyor_data):
    """Takes a list of conveyor data and adds rows to the frame"""
    for conveyor_id, items, efficiency in conveyor_data:
        frame.add_conveyor_row(conveyor_id, items, efficiency)


# Main application logic
if __name__ == "__main__":
    app = wx.App(False)

    # Specify the path of the .txt file to load
    file_path = "instruction.txt"  # Adjust to your actual file path
    
    # Conveyor data for Page 2
    conveyor_data = [
        ("Conveyor 1", "1000", 95),
        ("Conveyor 2", "1200", 85),
        ("Conveyor 3", "500", 75),
        ("Conveyor 4", "700", 65),
        ("Conveyor 5", "900", 50),  # Test data
        ("Conveyor 4", "700", 65),
        ("Conveyor 4", "700", 65),
        ("Conveyor 4", "700", 65),
        ("Conveyor 4", "700", 65),
        ("Conveyor 4", "700", 65),
        ("Conveyor 4", "700", 65),
        ("Conveyor 4", "700", 65),
        ("Conveyor 4", "700", 65),
        ("Conveyor 4", "700", 65)

    ]
    
    # Create the main frame, pass the file path and conveyor data
    frame = FrameMain(None, file_path, conveyor_data)
    
    # Add the conveyor data to Page 2
    add_conveyors_from_data(frame, conveyor_data)
    
    frame.Show(True)
    app.MainLoop()