Image Recognition Program - Template Library

Project Background

This branch contains the template library used for our image recognition program. The template images are derived from the open-source Shapez code and have been processed using the imgpreprocessing.py script. These preprocessed images serve as templates for comparison with input test images.


File Descriptions

imgpreprocessing.py: A script that preprocesses the original images from Shapez into the required format for the template library, using the OpenCV library for image processing.
template.zip: A compressed file containing the preprocessed template images used for matching.
tester.py: A testing script that compares input test images against the template library to determine matches.


Requirements

Make sure the following dependencies are installed before running the scripts:

Python 3.x

OpenCV (Install via pip):

pip install opencv-python


Usage Instructions

1.Run the Preprocessing Script

Use the following command to run the code:

python imgpreprocessing.py

2.Unzip the zip file.


Notes

Template Library Updates: If the images from Shapez are updated, rerun imgpreprocessing.py to regenerate the template library.

Testing Environment: Ensure all required dependencies, such as Python and OpenCV, are installed before running the scripts.


License

This project uses images and code derived from the open-source Shapez project. All materials must adhere to the corresponding open-source license.
