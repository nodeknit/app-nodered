// APP-NODE-RED

import {AbstractApp, AddToCollection, Collection, CollectionHandler} from "@nodeknit/app-manager";

import RED from "node-red";
import * as runtime from "@node-red/runtime";
import { AppManager } from "@nodeknit/app-manager/lib/AppManager";
type LocalSettings = runtime.LocalSettings
import { createRequire } from "module";
import { AbstractCollectionHandler, CollectionItem } from "@nodeknit/app-manager/lib/CollectionStorage";
import { AbstractNoderedNode } from "./abstract";
import path from "path";
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
const fs = require('fs');


const httpRedServer = http.createServer(app);
    
RED.init(httpRedServer,settings);
app.use(settings.httpAdminRoot,RED.httpAdmin);  
app.use(settings.httpNodeRoot,RED.httpNode);
const RED_PORT = process.env.RED_PORT !== undefined && isNaN(parseInt(process.env.RED_PORT)) !== true ? parseInt(process.env.RED_PORT) : 42881; 
httpRedServer.listen(RED_PORT);
AppManager.log.info("Node-RED app mounted on port", RED_PORT);
RED.start();


import * as registry from "@node-red/registry/lib/registry.js";
import * as registryLoader from "@node-red/registry/lib/loader.js";

console.log("registry", Object.keys(registryLoader));

async function loadCustomModuleFromPath(modulePath: string) {
  console.log("loadCustomModuleFromPath", modulePath);
  const packageFile = path.join(modulePath, 'package.json');
  if (!fs.existsSync(packageFile)) {
      throw new Error(`package.json не найден в ${modulePath}`);
  }

  const pkg = JSON.parse(fs.readFileSync(packageFile));

  const moduleName = pkg.name || path.basename(modulePath);
  const nodeList = pkg['node-red']?.nodes;

  if (!nodeList) {
      throw new Error(`В package.json модуля ${moduleName} отсутствует поле "node-red.nodes"`);
  }

  const result = [];

  for (const [nodeName, nodeFile] of Object.entries(nodeList)) {
      const nodePath = path.resolve(modulePath, nodeFile);
      const nodeInfo = {
          id: `${moduleName}/${nodeName}`,
          module: moduleName,
          name: nodeName,
          file: nodePath,
          types: [], // мы позже загрузим это
          enabled: true,
          loaded: false,
          local: true, // пометка, что это локальный модуль
          path: modulePath
      };

      // Зарегистрировать nodeSet в реестре
      registry.addNodeSet(nodeInfo);

      // Загрузить nodeSet
      const loaded = await registryLoader.loadNodeSet(nodeInfo);
      result.push(loaded);
  }

  return result;
}


class NodeRedNodeHandler extends AbstractCollectionHandler {
  async process(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    try {
      loadCustomModuleFromPath(data[0].item.path).then(() => console.log("Модуль загружен!"))
      .catch(err => console.error("Ошибка при загрузке модуля:", err));
      console.log("stop")
      console.log(await RED.runtime.nodes.getModuleCatalog({}), ">>>");


    } catch (error) {
      console.error("Error registering node:", error);
    }

  }

  async unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void> {
    console.log("NodeRedNodeHandler unprocessed")
  }
}

class NodeRedNode_AppManagerEmmiterOn extends AbstractNoderedNode {
  name = "NodeRedNode_AppManagerEmmiter";
  static path = path.join(path.dirname(fileURLToPath(import.meta.url)), '../nodes/emitter');
}

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

  } 
  async unmount(): Promise<void> {
    console.log("System unmounting Node-RED app not need to unmount");
  }
}