import * as ws from 'ws';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import express from 'express';

const sim = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'simulatorCard.json'), { encoding: 'utf8'}));

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
      //
      // - Write all logs with importance level of `error` or less to `error.log`
      // - Write all logs with importance level of `info` or less to `combined.log`
      //
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  });

let messageCounter = 0;

const app = express();
const port = '32772';

class AusweisSocket {
    sock = null;

    insertCardTry = 0; 
    pinEntered = 0;
    

    constructor() {
        this.sock = new ws.WebSocket("ws://ausweisapp:24727/eID-Kernel");
    }

    async sendMessage(message) {
        this.sock.send(JSON.stringify(message))
    }
    
    
    async onInsertCard(message) {
        console.log("on insert card");
        await this.sendMessage({
            "cmd": "SET_CARD",
            "name": "Simulator",
            "simulator": sim
        });
    }
    
    async onAccessRights(message) {
        await this.sendMessage({ "cmd": "ACCEPT" });
    }
    
    async onEnterPin(message) {
        await this.sendMessage({"cmd": "SET_PIN" }); // without a "value"
    }


}

app.get('/eID-Client', async (req, res) => {
    const url = await new Promise((resolve, reject) => {
        const as = new AusweisSocket();
        as.sock.on('open', async (ws) => {
            await as.sendMessage({
                "cmd": "RUN_AUTH",
                "tcTokenURL": "https://test.governikus-eid.de/AusweisAuskunft/WebServiceRequesterServlet",
                "developerMode": true,
            })
        })
    
        as.sock.on('message', async (data, isBinary) => {
            logger.info(`Message = ${messageCounter++}, ${data.toString()}`)
            console.log(messageCounter, data.toString());
            const message = JSON.parse(data.toString());
    
            if (message.msg == 'ACCESS_RIGHTS') {
                as.onAccessRights('');
            }
    
            if (message.msg == 'INSERT_CARD' && as.insertCardTry == 0) {
                as.onInsertCard(message);
                as.insertCardTry++;
            }
    
            if (message.msg == 'ENTER_PIN' && as.pinEntered == 0) {
                as.onEnterPin(message);
                as.pinEntered++;
            }
    
            if (message.msg == 'AUTH' && message.url) {
                console.log("Got auth and url", message.url);
                resolve(message.url);
            }
        })
    });
    res.writeHead(303, {
        Location: url 
    })
    res.end();
})

app.listen(port, (err) => {
    if (err) {
        console.err("Error starting on: ", port);
    } else {
        console.log("App listening on: ", port);
    }
})