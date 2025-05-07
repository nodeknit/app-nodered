module.exports = function (RED: { nodes: { createNode: (arg0: any, arg1: any) => void; registerType: (arg0: string, arg1: (config: any) => void) => void; }; }) {
    function EmitterEmitNode(config: { event: any; }) {
        RED.nodes.createNode(this, config);
        let node = this;

        node.on('input', async function (msg: { payload: any; }) {
            var args = [config.event].concat(msg.payload);
            // let result = await emitter.emit.apply(emitter, args);
            // console.log("AFTER EMIT WAIT:", args[1],"IN RESULTs:", result[0].result)
        });
    }
    RED.nodes.registerType("emitter-emit", EmitterEmitNode);
}