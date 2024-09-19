import asyncio
import websockets
import threading
import subprocess

async def server(websocket, path):
    print("Client connected")
    async for message in websocket:
        message = message[2:-2]
        file_name = "route/" + f"{message}.txt"
        print(f"{message}")
        try:
            with open(file_name,"r") as f:
                file_content = f.read()
                print("load sucessfully")
                
            with open("instruction.txt", "w") as ins_f:
                ins_f.write(file_content)
                print("all steps complete")
            
            subprocess.run(["python", "gui.py"]) 
          
                
        except FileNotFoundError:
            print("Not in this demo")
            file_content=""
            
            
           
                
            
   
           
           

start_server = websockets.serve(server, "localhost", 8765)


print("WebSocket server started on ws://localhost:8765")
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
