var { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
var { cryptoWaitReady } = require('@polkadot/util-crypto');

const fs = require('fs');

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
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });

  // Substrate node we are connected to and listening to remarks
  //const provider = new WsProvider('ws://localhost:9944');
  //const provider = new WsProvider('wss://kusama-rpc.polkadot.io/');
  const provider = new WsProvider('wss://cc3-5.kusama.network/');

  const api = await ApiPromise.create({ provider });

  // Add account with URI
  // let account = keyring.addFromUri('//Alice', { name: 'Alice default' });
  // Add account with Polkadot JS JSON
  let input_json = require('./account.json');
  await keyring.addFromJson(input_json);
  await keyring.getPair(input_json.address).decodePkcs8('password');
  let account = keyring.getPair(input_json.address);

  // Get general information about the node we are connected to
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);
  console.log(
    `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
  );

  let accountNonce = await api.query.system.accountNonce(account.address);

  let image = JSON.parse(fs.readFileSync('./image.json'));

  let imagelength = image.length;

  // How many transactions to send out at once
  let tx_batch_size = 50;
  // How long to pause before the next batch (ms).
  let pause_time = 6000;
  // Submit pixels spread out by `pixel_density`
  let pixel_density = 10;

  let index = 0;
  for (let j = 0; j < pixel_density; j++) {
    // Recalculate length
    imagelength = image.length;
    // Loop backwards because we remove elements
    for (let i = imagelength - 1; i >= 0; i -= pixel_density) {
      try {
        let txNonce = parseInt(accountNonce) + parseInt(index);
        index += 1;

        // Send a batch of transactions then pause
        if (index % tx_batch_size == 0) {
          await sleep(pause_time);
        }

        let pixel = image[i];
        let hex = intToHex(pixel.r) + intToHex(pixel.g) + intToHex(pixel.b);
        let x = pixel.x;
        let y = pixel.y;

        // Don't send transactions for pixels off the image
        if (x < 1000 && y < 1000) {
          let input = '0x1337' + toThreeDigit(x) + toThreeDigit(y) + hex;
          console.log(input, txNonce);

          const unsub = await api.tx.system
            .remark(input)
            .signAndSend(account, { nonce: txNonce }, async function(result) {
              console.log(`${x}, ${y}: Current status is ${result.status}`);

              if (result.status.isFinalized) {
                console.log(
                  `${x}, ${y}: Transaction included at blockHash ${result.status.asFinalized}`
                );
                // Remove pixel from JSON;
                image = image.filter(function(elm) {
                  if (elm.x == x && elm.y == y) {
                    return false;
                  }
                  return true;
                });
                await fs.writeFile(
                  'image.json',
                  JSON.stringify(image, null, 2),
                  err => {
                    if (err) throw err;
                    console.log(`${x}, ${y}: Removed from file`);
                  }
                );
                // Unsubscribe from sign and send.
                unsub();
              }
            });
        }
      } catch (e) {
        console.error(e);
        // Update account nonce
        accountNonce = await api.query.system.accountNonce(account.address);
      }
    }
  }
  console.log('############ Finished Loop ##############');
}

main().catch(console.error);
