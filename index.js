const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 80;

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`));

var { ApiPromise, WsProvider } = require('@polkadot/api');

function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

function parsePrefix(buffer) {
  if (!buffer) {
    console.log('No Buffer');
    return [null, null];
  }

  let string = toHexString(buffer);

  if (string.length < 4) {
    console.log('No remarkable prefix');
    return [null, null];
  }

  // Return [prefix, restOfBuffer]
  return [string.slice(0, 4), string.slice(4)];
}

// Remarkable Apps
var remarkableImage = require('./remarkable/image');

// Main function which needs to run at start
async function main() {
  // Substrate node we are connected to and listening to remarks
  const provider = new WsProvider('ws://localhost:9944');
  //const provider = new WsProvider('wss://kusama-rpc.polkadot.io/');

  const api = await ApiPromise.create({ provider });

  // Get general information about the node we are connected to
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);
  console.log(
    `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
  );

  // Initialize apps
  await remarkableImage.initialize();

  // Subscribe to new blocks being produced, not necessarily finalized ones.
  const unsubscribe = await api.rpc.chain.subscribeNewHeads(async header => {
    await api.rpc.chain.getBlock(header.hash, async block => {
      // Try to never crash
      try {
        console.log('Block is: ', block.block.header.number.toNumber());
        // Extrinsics in the block
        let extrinsics = await block.block.extrinsics;

        // Check each extrinsic in the block
        for (extrinsic of extrinsics) {
          // This specific call index [0,1] represents `system.remark`
          if (extrinsic.callIndex[0] == 0 && extrinsic.callIndex[1] == 1) {
            // Get the byte data from a remark
            let [prefix, buffer] = parsePrefix(extrinsic.args[0]);
            // Route the rest of the buffer to the correct remarkable logic
            switch (prefix) {
              case '1337':
                updateImage = remarkableImage.parse(buffer);
            }
          }
        }

        // Update apps
        await remarkableImage.update();
      } catch (e) {
        console.log(e);
      }
    });
  });
}

main().catch(console.error);
