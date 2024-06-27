import * as ws from 'ws';
import winston from 'winston';
import fs from 'fs';
import path from 'path';

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

const sock = new ws.WebSocket("ws://ausweisapp:24727/eID-Kernel")
let messageCounter = 0;


const sendMessage = async (message) => {
    sock.send(JSON.stringify(message))
}


sock.on('open', (ws) => {

    (async function main() {
        await sendMessage({
            "cmd": "RUN_AUTH",
            "tcTokenURL": "https://test.governikus-eid.de/AusweisAuskunft/WebServiceRequesterServlet",
            "developerMode": true,
        })
    })()
})




let insertCardTry = 0; 
let pinEntered = 0;

sock.on('message', async (data, isBinary) => {
    logger.info(`Message = ${messageCounter++}, ${data.toString()}`)

    const message = JSON.parse(data.toString());

    if (message.msg == 'ACCESS_RIGHTS') {
        onAccessRights();
    }

    if (message.msg == 'INSERT_CARD' && insertCardTry == 0) {
        onInsertCard(message);
        insertCardTry++;
    }


    if (message.msg == 'ENTER_PIN' && pinEntered == 0) {
        onEnterPin(message);
        pinEntered++;
    }
})

const onInsertCard = async (message) => {
    await sendMessage({
        "cmd": "SET_CARD",
        "name": "Simulator",
        "simulator": sim
    });
}

const onAccessRights = async (message) => {
    await sendMessage({ "cmd": "ACCEPT" });
}

const onEnterPin = async (message) => {
    await sendMessage({"cmd": "SET_PIN" }); // without a "value"
}