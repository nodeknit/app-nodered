// APP-NODE-RED

import {AbstractApp} from "@nodeknit/app-manager/lib/AbstractApp";

import RED from "node-red";
import * as runtime from "@node-red/runtime";
import { AppManager } from "@nodeknit/app-manager/lib/AppManager";
type LocalSettings = runtime.LocalSettings
import { createRequire } from "module";
const require = createRequire(import.meta.url);

let flowNamespace = process.env.NODE_RED_NAMESPACE || 'nodeknit'
let flowsFile = flowNamespace+".json"

function getNodeRedAuth() {
  return {
    tokens: function(token: string) {
      return new Promise(function(resolve, reject) {
        const validTokens = [];
  
        if(process.env.NODE_RED_TOKEN) {
            validTokens.push(process.env.NODE_RED_TOKEN) 
        }
  
        // ?access_token=<ACCESS_TOKEN>
        if(validTokens.includes(token)) {
          var user = { username: 'admin', permissions: '*' };
          resolve(user);
        } else {
          resolve(null);
        }
      });
    }
  }
}
//@ts-ignore
const settings: LocalSettings = {
  flowFile: flowsFile,
  httpAdminRoot: "/red",
  httpNodeRoot: "/red/api/",
  userDir: `${process.cwd()}/data/nodered/`,
  functionGlobalContext: {
    process: process
  },
  ...(process.env.NODE_ENV === "production" || process.env.NODE_RED_TOKEN) && { adminAuth: getNodeRedAuth() },
  uiPort: 0,
  uiHost: ""
}


var express = require("express");
var app = express();
var http = require("http");
  

export class AppNodeRed extends AbstractApp {
  appId: string = "app-nodered";
  name: string = "Node-RED";

  
  constructor(appManager: any) {
    super(appManager);
   }
  async mount(): Promise<void> {
    
    const httpRedServer = http.createServer(app);
    RED.init(httpRedServer,settings);
  
    RED.init(httpRedServer,settings);
    app.use(settings.httpAdminRoot,RED.httpAdmin);  
    app.use(settings.httpNodeRoot,RED.httpNode);
    RED.start();
    const RED_PORT = process.env.RED_PORT !== undefined && isNaN(parseInt(process.env.RED_PORT)) !== true ? parseInt(process.env.RED_PORT) : 42881; 
    httpRedServer.listen(RED_PORT);
    console.log("Mounting Node-RED app...");
    AppManager.log.info("Node-RED app mounted on port", RED_PORT);
  } 
  async unmount(): Promise<void> {
    console.log("System unmounting Node-RED app not need to unmount");
  }
}