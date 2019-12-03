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
  const provider = new WsProvider('wss://kusama-rpc.polkadot.io/');
  //const provider = new WsProvider("wss://cc3-5.kusama.network/");

  const api = await ApiPromise.create({ provider });

  // Add account with Polkadot JS JSON
  keyring.addFromJson({
    /* ADD JSON HERE */
  });
  keyring.getPair('ADDRESS').decodePkcs8('password');
  let account = keyring.getPair('ADDRESS');

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

  // Try to open the file, else exit.
  try {
    image = await Jimp.read('input.bmp');
    console.log('file found');
  } catch {
    console.log('file NOT found');
    process.exit(1);
  }

  // Optional Resize
  // image.resize(100, 100);

  // Starting Location for your image. Top left corner.
  let start = {
    x: 450,
    y: 490
  };

  // The area of your image you want to send
  // Height
  let heightStart = 0; //0;
  let heightEnd = image.bitmap.height; //image.bitmap.height
  // Width
  let widthStart = 0; //0;
  let widthEnd = image.bitmap.width; //image.bitmap.width;

  let accountNonce = await api.query.system.accountNonce(account.address);

  image.scan(
    widthStart,
    heightStart,
    widthEnd - widthStart,
    heightEnd - heightStart,
    async function(x, y, idx) {
      var red = this.bitmap.data[idx + 0];
      var green = this.bitmap.data[idx + 1];
      var blue = this.bitmap.data[idx + 2];
      var alpha = this.bitmap.data[idx + 3];

      // Construct a set of sequential nonces based on the area you want to submit.
      let txNonce =
        parseInt(accountNonce) +
        (x - widthStart) +
        (y - heightStart) * (widthEnd - widthStart);

      let hex = intToHex(red) + intToHex(green) + intToHex(blue);
      let input =
        '0x1337' + toThreeDigit(x + start.x) + toThreeDigit(y + start.y) + hex;
      console.log(input, txNonce);

      const unsub = await api.tx.system
        .remark(input)
        .signAndSend(account, { nonce: txNonce }, result => {
          console.log(`${x}, ${y}: Current status is ${result.status}`);

          if (result.status.isFinalized) {
            console.log(
              `${x}, ${y}: Transaction included at blockHash ${result.status.asFinalized}`
            );
            unsub();
          }
        });
    }
  );
}

main().catch(console.error);
