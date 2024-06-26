import * as ws from 'ws';


const sock = new ws.WebSocket("ws://ausweisapp:24727/eID-Kernel")

sock.on('open', (ws) => {
    sock.send(JSON.stringify({ cmd: "GET_INFO" }), (err) => {
        console.log("Err = ", err)
    }) 
})


sock.on('message', (data, isBinary) => {
    console.log("Data = ", data.toString())
})