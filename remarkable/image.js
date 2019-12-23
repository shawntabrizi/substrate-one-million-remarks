var Jimp = require('jimp');

let image;
let shouldUpdate = false;
let newPixels = [];

async function initialize() {
  // Try to open the file, else create a new image
  try {
    image = await Jimp.read('./public/image.png');
    console.log('Remarkable Image: Image Found');
  } catch {
    console.log('Remarkable Image: Image NOT Found');
    image = new Jimp(1000, 1000, 0x000000ff, (err, image) => {
      // this image is 1000 x 1000, every pixel is set to 0x000000ff
    });
    await image.writeAsync('./public/image.png');
    console.log('Remarkable Image: Image Created');
  }
  console.log('Remarkable Image: Initialized');
}

function parse(string) {
  if (!string) {
    console.log('Remarkable Image: No Buffer');
    return;
  }

  if (string.length != 3 + 3 + 6) {
    console.log('Remarkable Image: Wrong Length');
    return;
  }

  let x, y, color;

  try {
    x = parseInt(string.slice(0, 3));
    y = parseInt(string.slice(3, 6));
    color = Jimp.cssColorToHex('#' + string.slice(6));
  } catch {
    console.log('Remarkable Image: Bad Info');
    return;
  }

  if (x > 999 || y > 999 || color > 0xffffffff) {
    console.log('Remarkable Image: Out of Bounds');
    return;
  }

  let pixel = {
    x: x,
    y: y,
    color: color
  };

  console.log('Remarkable Image: Pixel: ', pixel);

  newPixels.push(pixel);

  // Tell the code to update
  shouldUpdate = true;
}

async function update() {
  if (shouldUpdate) {
    for (pixel of newPixels) {
      let x = pixel.x;
      let y = pixel.y;
      let color = pixel.color;

      await image.setPixelColour(color, x, y);
    }

    await image.writeAsync('./public/image.png');
    console.log('Remarkable Image: Updated');
  }

  // Reset state
  shouldUpdate = false;
  newPixels = [];
}

module.exports = {
  initialize: initialize,
  parse: parse,
  update: update
};
