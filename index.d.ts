import { AbstractApp } from "@nodeknit/app-manager";
import { AppManager } from "@nodeknit/app-manager/lib/AppManager";
import { AbstractCollectionHandler, CollectionItem } from "@nodeknit/app-manager/lib/CollectionStorage";
import { AbstractNoderedNode } from "./abstract";
declare class NodeRedNodeHandler extends AbstractCollectionHandler {
    process(appManager: AppManager, data: CollectionItem[]): Promise<void>;
    unprocess(appManager: AppManager, data: CollectionItem[]): Promise<void>;
}
declare class NodeRedNode_AppManagerEmmiterOn extends AbstractNoderedNode {
    name: string;
    static modulepath: string;
}
export declare class AppNodeRed extends AbstractApp {
    appId: string;
    name: string;
    noderedNodes: (typeof NodeRedNode_AppManagerEmmiterOn)[];
    nodeRedNodeHandlerHandler: NodeRedNodeHandler;
    constructor(appManager: any);
    mount(): Promise<void>;
    unmount(): Promise<void>;
}
export {};
