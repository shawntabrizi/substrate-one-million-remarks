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
var Jimp = require('jimp');

function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

function parseBuffer(buffer) {
  if (!buffer) {
    console.log('No Buffer');
    return null;
  }

  let string = toHexString(buffer);

  if (string.length != 4 + 3 + 3 + 6) {
    console.log('Wrong Length');
    return null;
  }

  let magic, x, y, color;

  try {
    magic = parseInt(string.slice(0, 4));
    x = parseInt(string.slice(4, 7));
    y = parseInt(string.slice(7, 10));
    color = Jimp.cssColorToHex('#' + string.slice(10));
  } catch {
    console.log('Bad Info');
  }

  if (magic != 1337 || x > 999 || y > 999 || color > 0xffffffff) {
    console.log('Out of Bounds');
    return null;
  }

  let pixel = {
    x: x,
    y: y,
    color: color
  };

  return pixel;
}

async function updateImage(image, pixels) {
  for (pixel of pixels) {
    let x = pixel.x;
    let y = pixel.y;
    let color = pixel.color;

    await image.setPixelColour(color, x, y);
  }
}

// Main function which needs to run at start
async function main() {
  // Substrate node we are connected to and listening to remarks
  //const provider = new WsProvider('ws://localhost:9944');
  const provider = new WsProvider('wss://kusama-rpc.polkadot.io/');

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

  // Image File
  let image;

  // Try to open the file, else create a new image
  try {
    image = await Jimp.read('./public/image.png');
    console.log('file found');
  } catch {
    console.log('file NOT found');
    image = new Jimp(1000, 1000, 0x000000ff, (err, image) => {
      // this image is 1000 x 1000, every pixel is set to 0x000000ff
    });

    await image.writeAsync('./public/image.png');
  }

  let newPixels = [];

  // Subscribe to new blocks being produced, not necessarily finalized ones.
  const unsubscribe = await api.rpc.chain.subscribeNewHeads(async header => {
    await api.rpc.chain.getBlock(header.hash, async block => {
      // Try to never crash
      try {
        console.log('Block is: ', block.block.header.number.toNumber());
        // Extrinsics in the block
        let extrinsics = await block.block.extrinsics;
        // Variable to check if we need to update the image
        let update = false;

        // Check each extrinsic in the block
        for (extrinsic of extrinsics) {
          // This specific call index [0,1] represents `system.remark`
          if (extrinsic.callIndex[0] == 0 && extrinsic.callIndex[1] == 1) {
            // Get the `byte` data from a `remark`
            let pixel = parseBuffer(extrinsic.args[0]);
            console.log('Pixel: ', pixel);
            if (pixel) {
              newPixels.push(pixel);
              update = true;
            }
          }
        }

        // Check if we need to update the image
        if (update) {
          await updateImage(image, newPixels);
          await image.writeAsync('./public/image.png');
        }
      } catch (e) {
        console.log(e);
      }
    });
  });
}

main().catch(console.error);
