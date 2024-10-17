# Deco3801
This is the translator part with all versions while the progress is keeping updating, please run the V6 version(V7 is modified to set down into final whole system which cannot be run singlely)
line 152-168. This is no longer used as the team changed the method to open GUI
The translator is going to decode the machine code which is provided by the previous problem-solver and show the human readable instructions
The 'test.txt' file is used as a sample of problem-solver's output. In translator.JS, just run it(the default name of the test file has already been set as 'test.txt').
The translator used reflection to corresponding every character in machine code and change it into instruction about the shapes with color in every layer. The operation code will be translated into an explaination about what the user will exactly do to create the object shape.
function list:
  1.read and reformat the machine code file
  2.reflect the machine code into human language
  3.reformat the translated words into each step
  4.put every step into array for GUI displaying
  5.a small performance part to analyse the translator running time and memory usage
  6. a child process to open the GUI which is on longer used as the team's requirement
