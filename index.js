const express = require("express");
const path = require("path");
const PORT = process.env.PORT || 5000;

express()
  .use(express.static(path.join(__dirname, "public")))
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .get("/", (req, res) => res.render("pages/index"))
  .get("/get", (req, res) =>
    res.json({
      image: [0, 0, 1]
    })
  )
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

var { ApiPromise, WsProvider } = require("@polkadot/api");
var bitmapManipulation = require("bitmap-manipulation");

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
  let scalar = 1;

  try {
    bitmap = bitmapManipulation.BMPBitmap.fromFile("./public/image.bmp");
  } catch {
    bitmap = new bitmapManipulation.BMPBitmap(1000, 1000);
    // Start with a black image
    bitmap.clear(bitmap.palette.indexOf(0x000000));
  }

  bitmap.drawFilledRect(
    x,
    y,
    1 * scalar,
    1 * scalar,
    null,
    bitmap.palette.indexOf(color)
  );

  bitmap.save("./public/image.bmp");
}

async function main() {
  const provider = new WsProvider("wss://dev-node.substrate.dev:9944");

  const api = await ApiPromise.create({ provider });

  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);

  console.log(
    `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
  );

  // Subscribe to the new headers on-chain. The callback is fired when new headers
  // are found, the call itself returns a promise with a subscription that can be
  // used to unsubscribe from the newHead subscription
  const unsubscribe = await api.rpc.chain.subscribeNewHead(async header => {
    await api.rpc.chain.getBlock(header.hash, async block => {
      console.log("Block is: ", block.block.header.number.toNumber());
      let extrinsics = await block.block.extrinsics;
      for (extrinsic of extrinsics) {
        // This specific call index [0,1] represents `system.remark`
        if (extrinsic.callIndex[0] == 0 && extrinsic.callIndex[1] == 1) {
          let pixel = parseBuffer(extrinsic.args[0]);
          console.log("Pixel: ", pixel);
          if (pixel) {
            updateImage(pixel);
          }
        }
      }
    });
  });
}

main().catch(console.error);
