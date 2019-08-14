var express = require("express");
var api = require("@polkadot/api");
var { ApiPromise, WsProvider } = require("@polkadot/api");
var bitmapManipulation = require("bitmap-manipulation");

const app = express();

app.get("/get", function(req, res) {
  res.json({
    image: [0, 0, 1]
  });
});

app.listen(process.env.PORT, () =>
  console.log(`Example app listening on port ${process.env.PORT}!`)
);

function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}

function parseBuffer(buffer) {
  if (!buffer) {
    console.log("No Buffer");
    return null;
  }

  let string = toHexString(buffer);
  console.log("Stringified: ", string);

  if (string.length != 4 + 3 + 3 + 6) {
    console.log("Wrong Length");
    return null;
  }
  /*
  let buf = new Uint16Array(buffer.slice(0, 6).buffer);
  if (buf[0] != 14099 || buf[1] > 1000 || buf[2] > 1000) {
    console.log("Wrong Info");
    return null;
  }

  let x = buf[1];
  let y = buf[2];

  let color = new Uint8Array(buffer.slice(6));
  */
  let magic, x, y, color;

  try {
    magic = parseInt(string.slice(0, 4));
    x = parseInt(string.slice(4, 7));
    y = parseInt(string.slice(7, 10));
    color = parseInt("0x" + string.slice(10));
  } catch {
    console.log("Bad Info");
  }

  if (magic != 1337 || x > 999 || y > 999 || color > 0xffffff) {
    console.log("Out of Bounds");
    return null;
  }

  let pixel = {
    x: x,
    y: y,
    color: color
  };

  return pixel;
}

function updateImage(pixel) {
  let x = pixel.x;
  let y = pixel.y;
  let color = pixel.color;
  let bitmap;
  let scalar = 5;

  try {
    bitmap = bitmapManipulation.BMPBitmap.fromFile("image.bmp");
    console.log("file found");
  } catch {
    console.log("file NOT found");

	bitmap = new bitmapManipulation.BMPBitmap(1000, 1000);
	bitmap.clear(bitmap.palette.indexOf(0xc0c0c0));

  }

  bitmap.drawFilledRect(
    x,
    y,
    1 * scalar,
    1 * scalar,
    null,
    bitmap.palette.indexOf(color)
  );

  bitmap.save("image.bmp");
}

async function main() {
  // Here we don't pass the (optional) provider, connecting directly to the default
  // node/port, i.e. `ws://127.0.0.1:9944`. Await for the isReady promise to ensure
  // the API has connected to the node and completed the initialisation process
  const WS_PROVIDER = 'wss://dev-node.substrate.dev:9944';
  const provider = new WsProvider(WS_PROVIDER);

  const api = await ApiPromise.create(provider);

  // Subscribe to the new headers on-chain. The callback is fired when new headers
  // are found, the call itself returns a promise with a subscription that can be
  // used to unsubscribe from the newHead subscription
  const unsubscribe = await api.rpc.chain.subscribeFinalizedHeads(
    async header => {
      //console.log(`Chain is at block: #${header.number}`);
      await api.rpc.chain.getBlock(header.hash, async block => {
        console.log("Block is: ", block.block.header.number.toNumber());
        let extrinsics = await block.block.extrinsics;
        //console.log("Block Extrinsics:", extrinsics);
        for (extrinsic of extrinsics) {
          if (extrinsic.callIndex[0] == 0 && extrinsic.callIndex[1] == 1) {
            console.log("Extrinsic Payload: ", extrinsic.args[0]);

            let pixel = parseBuffer(extrinsic.args[0]);
            console.log("Pixel: ", pixel);
            if (pixel) {
              updateImage(pixel);
            }
          }
        }
      });
    }
  );
}

main().catch(console.error);
