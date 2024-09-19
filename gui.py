import wx
import os

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
        sbSizer1.Add(self.image_ctrl, 0, wx.ALIGN_CENTER | wx.ALL, 10)

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
        self.page2.SetScrollRate(5, 5)

        sbSizer2 = wx.StaticBoxSizer(wx.StaticBox(self.page2, wx.ID_ANY, "Shapez.io Productivity"), wx.VERTICAL)

        # FlexGridSizer for Conveyor productivity with 3 columns
        self.grid_sizer = wx.FlexGridSizer(0, 3, 10, 10)
        self.grid_sizer.AddGrowableCol(0, 1)
        self.grid_sizer.AddGrowableCol(1, 1)
        self.grid_sizer.AddGrowableCol(2, 1)

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

        # Add the conveyor data to Page 2
        self.add_conveyors_from_data(conveyor_data)

    def get_scaling_factor(self):
        ppi = wx.GetDisplayPPI()
        return ppi[0] / 96  # 96 is default DPI

    def load_file(self, file_path):
        try:
            with open(file_path, 'r') as file:
                content = file.read()
                self.script_display.SetValue(content)
        except IOError:
            wx.LogError(f"Cannot open file '{file_path}'.")

    def calculate_and_display_image(self, conveyor_data):
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

        self.avg_productivity_text.SetLabel(f"Average Productivity: {average_efficiency:.2f}%")

        if average_efficiency < 40:
            self.show_image("angry.png")
        elif 40 <= average_efficiency <= 80:
            self.show_image("ok.png")
        else:
            self.show_image("happy.png")

    def show_image(self, image_filename):
        image_folder = "image"
        image_path = os.path.join(image_folder, image_filename)
        scaling_factor = self.get_scaling_factor()
        if os.path.exists(image_path):
            image = wx.Image(image_path, wx.BITMAP_TYPE_ANY).Scale(int(100 * scaling_factor), int(100 * scaling_factor))
            self.image_ctrl.SetBitmap(wx.Bitmap(image))
            self.image_ctrl.Refresh()
        else:
            wx.LogError(f"Image file '{image_path}' not found.")

    def add_conveyor_row(self, conveyor_id, items, efficiency):
        # Add conveyor ID
        self.grid_sizer.Add(wx.StaticText(self.page2, label=conveyor_id), flag=wx.ALIGN_CENTER_VERTICAL | wx.EXPAND, proportion=1)
        
        # Add items transported
        self.grid_sizer.Add(wx.StaticText(self.page2, label=items), flag=wx.ALIGN_CENTER_VERTICAL | wx.EXPAND, proportion=1)

        # Create a wx.BoxSizer to hold the gauge and the percentage label
        efficiency_sizer = wx.BoxSizer(wx.HORIZONTAL)

        # Create a wx.Gauge for efficiency as a progress bar
        gauge = wx.Gauge(self.page2, range=100, size=(100, 20))
        gauge.SetValue(efficiency)

        # Add the gauge to the sizer
        efficiency_sizer.Add(gauge, flag=wx.ALIGN_CENTER_VERTICAL)

        # Add a StaticText next to the gauge to display the efficiency percentage
        efficiency_label = wx.StaticText(self.page2, label=f"{efficiency}%")
        efficiency_sizer.Add(efficiency_label, flag=wx.ALIGN_CENTER_VERTICAL | wx.LEFT, border=10)

        # Add the sizer (with the gauge and percentage) to the grid
        self.grid_sizer.Add(efficiency_sizer, flag=wx.ALIGN_CENTER_VERTICAL | wx.EXPAND, proportion=1)

        # Add a separator line after each row
        self.grid_sizer.Add(wx.StaticLine(self.page2), flag=wx.EXPAND, proportion=3)
        self.grid_sizer.Add(wx.StaticLine(self.page2), flag=wx.EXPAND, proportion=3)
        self.grid_sizer.Add(wx.StaticLine(self.page2), flag=wx.EXPAND, proportion=3)

    # This method should be inside the FrameMain class
    def add_conveyors_from_data(self, conveyor_data):
        for conveyor_id, items, efficiency in conveyor_data:
            self.add_conveyor_row(conveyor_id, items, efficiency)


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
        ("Conveyor 5", "900", 50),
        ("Conveyor 5", "900", 50),
        ("Conveyor 5", "900", 50),
        ("Conveyor 5", "900", 50),
        ("Conveyor 5", "900", 50),
        ("Conveyor 5", "900", 50),
        ("Conveyor 5", "900", 50),
        ("Conveyor 5", "900", 50)
    ]
    
    # Create the main frame, pass the file path and conveyor data
    frame = FrameMain(None, file_path, conveyor_data)
    
    frame.Show(True)
    app.MainLoop()