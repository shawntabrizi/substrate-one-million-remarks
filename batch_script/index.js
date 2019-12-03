var { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const keyring = new Keyring({ type: 'sr25519' });
var Jimp = require('jimp');

function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

function intToHex(int) {
  return ('0' + int.toString(16)).slice(-2);
}

function toThreeDigit(int) {
  return ('000' + int).slice(-3);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function which needs to run at start
async function main() {
  // Substrate node we are connected to and listening to remarks
  //const provider = new WsProvider('ws://localhost:9944');
  const provider = new WsProvider("wss://kusama-rpc.polkadot.io/");

  const api = await ApiPromise.create({ provider });

  const alice = keyring.addFromUri('//Alice', { name: 'Alice default' });

  // Get general information about the node we are connected to
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);
  console.log(
    `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
  );

  let image;

  // Try to open the file, else create a new bitmap
  try {
    image = await Jimp.read('input.jpg');

    console.log('file found');
  } catch {
    console.log('file NOT found');
    return;
  }

  image.resize(100, 100);

  let start = {
    x: 500,
    y: 500
  };

  heightStart = 0;

  let aliceNonce = await api.query.system.accountNonce(alice.address);

  for (let i = heightStart; i < image.bitmap.height; i++) {
    console.log("Row: " + i);

    image.scan(0, i, image.bitmap.width, 1, async function(x, y, idx) {
      var red = this.bitmap.data[idx + 0];
      var green = this.bitmap.data[idx + 1];
      var blue = this.bitmap.data[idx + 2];
      var alpha = this.bitmap.data[idx + 3];

      let txNonce = parseInt(aliceNonce) + x + (y - heightStart) * image.bitmap.width;

      let hex = intToHex(red) + intToHex(green) + intToHex(blue);
      let input =
        '0x1337' + toThreeDigit(x + start.x) + toThreeDigit(y + start.y) + hex;
      console.log(input, txNonce);

      const unsub = await api.tx.system
        .remark(input)
        .signAndSend(alice, { nonce: txNonce }, result => {
          console.log(`${x}, ${y}: Current status is ${result.status}`);

          if (result.status.isFinalized) {
            console.log(
              `${x}, ${y}: Transaction included at blockHash ${result.status.asFinalized}`
            );
            unsub();
          }
        });
    });

    await sleep(20000);

  }
}

main().catch(console.error);
