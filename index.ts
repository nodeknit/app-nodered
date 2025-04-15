// APP-NODE-RED

import {AbstractApp, AddToCollection, Collection, CollectionHandler} from "@nodeknit/app-manager";

import RED from "node-red";
import * as runtime from "@node-red/runtime";
import { AppManager } from "@nodeknit/app-manager/lib/AppManager";
type LocalSettings = runtime.LocalSettings
import { createRequire } from "module";
import { AbstractCollectionHandler, CollectionItem } from "@nodeknit/app-manager/lib/CollectionStorage";
import { AbstractNoderedNode } from "./abstract";
import path, { basename } from "path";
import fs from 'fs';
const require = createRequire(import.meta.url);
import { fileURLToPath } from 'url';

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
  //@ts-ignore not typed
  nodesDir: [path.resolve(`${import.meta.dirname}/nodes`)],
  functionGlobalContext: {
    process: process
  },
  ...(process.env.NODE_ENV === "production" || process.env.NODE_RED_TOKEN) && { adminAuth: getNodeRedAuth() },
  uiPort: 0,
  uiHost: ""
}

if(process.env.NODERED_NODES_DIRS) {
  const NODERED_NODES_DIRS = process.env.NODERED_NODES_DIRS
  .split(";")
  .filter(dir => dir);
  
  if(!settings.nodesDir) {
    //@ts-ignore
    settings.nodesDir = []
  }

  settings.nodesDir = settings.nodesDir.concat(...NODERED_NODES_DIRS);
} 




// Функция для создания символических ссылок
// const createSymlinks = (sourceDir: string, targetDir: string) => {
//   try {
//     const files = fs.readdirSync(sourceDir);
//     files.forEach((file: string) => {
//       const sourcePath = path.join(sourceDir, file);
//       const targetPath = path.join(targetDir, file);

//       try {
//         fs.unlinkSync(targetPath);
//         console.log(`Removed existing symlink or target: ${targetPath}`);
//       } catch (err) {
//         // Если ссылки нет — ок
//       }

//       fs.symlinkSync(sourcePath, targetPath, 'dir');
//       console.log(`Created symlink: ${targetPath} -> ${sourcePath}`);
//     });
//   } catch (error) {
//     console.error('Error while creating symlinks:', error);
//   }
// };

class NodeRedNodeHandler extends AbstractCollectionHandler {
  async process(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    try {
      for(let nrModule of data) {
        
        // const targetDir = path.join(settings.userDir, basename(nrModule.item.modulepath));
        // if (!fs.existsSync(targetDir)) {
        //   fs.mkdirSync(targetDir, { recursive: true });
        //   console.log(`Created directory: ${targetDir}`);
        // }

        // if (nrModule.item.modulepath) {
        //   createSymlinks(nrModule.item.modulepath, targetDir);
        // }
      }







      // Запуск Node-RED после линковки
    } catch (error) {
      console.error("Error in NodeRedNodeHandler.process:", error);
    }
  }

  async unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    console.log("NodeRedNodeHandler unprocessed")
  }
}

class NodeRedNode_AppManagerEmmiterOn extends AbstractNoderedNode {
  name = "NodeRedNode_AppManagerEmmiter";
  static modulepath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../nodes/emitter');
}

// ------------------------ APP-NODE-RED ------------------------

var express = require("express");
var app = express();
var http = require("http");
export class AppNodeRed extends AbstractApp {
  appId: string = "app-nodered";
  name: string = "Node-RED";

  @Collection
  noderedNodes = [NodeRedNode_AppManagerEmmiterOn]
  
  @CollectionHandler('noderedNodes')
  nodeRedNodeHandlerHandler = new NodeRedNodeHandler();

  constructor(appManager: any) {
    super(appManager);
   }
  async mount(): Promise<void> {

    const httpRedServer = http.createServer(app);
    RED.init(httpRedServer,settings);
    app.use(settings.httpAdminRoot,RED.httpAdmin);  
    app.use(settings.httpNodeRoot,RED.httpNode);
    const RED_PORT = process.env.RED_PORT !== undefined && isNaN(parseInt(process.env.RED_PORT)) !== true ? parseInt(process.env.RED_PORT) : 42881; 
    httpRedServer.listen(RED_PORT);
    AppManager.log.info("Node-RED app mounted on port", RED_PORT);
    RED.start();
  } 
  async unmount(): Promise<void> {
    console.log("System unmounting Node-RED app not need to unmount");
  }
}