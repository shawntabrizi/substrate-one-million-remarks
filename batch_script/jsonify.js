var Jimp = require('jimp');
const fs = require('fs');

async function main() {
  let image;
  let remarkable_image;

  // Try to open the file, else exit.
  try {
    image = await Jimp.read('owl.png');
    console.log('file found');
  } catch {
    console.log('file NOT found');
    process.exit(1);
  }

  // Try to load existing remarkable
  try {
    remarkable_image = await Jimp.read('https://remarkable.w3f.tech/image.png');
    console.log('remarkable image loaded');
  } catch {
    console.log('could NOT load remarkable image');
  }

  // Optional Resize
  image.resize(160, Jimp.AUTO);

  let finalJson = [];

  // Starting Location for your image. Top left corner.
  let start = {
    x: 300,
    y: 300
  };

  await image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(
    x,
    y,
    idx
  ) {
    var red = this.bitmap.data[idx + 0];
    var green = this.bitmap.data[idx + 1];
    var blue = this.bitmap.data[idx + 2];
    var alpha = this.bitmap.data[idx + 3];

    let finalx = x + start.x;
    let finaly = y + start.y;

    if (
      alpha == 0xff &&
      finalx < 1000 &&
      finaly < 1000 &&
      !alreadyRemarkable(start, x, y, red, green, blue, remarkable_image)
    ) {
      finalJson.push({
        x: finalx,
        y: finaly,
        r: red,
        g: green,
        b: blue
      });
    } else {
      console.log(`Pixel Skipped: ${x}, ${y}`);
    }
  });

  let data = JSON.stringify(finalJson, null, 2);
  fs.writeFileSync('image.json', data);
}

function ignoreColor(r, g, b) {
  if (r == 2 && g == 2 && b == 2) {
    return true;
  }
  return false;
}

function alreadyRemarkable(offset, x, y, r, g, b, image) {
  let hex = image.getPixelColor(x + offset.x, y + offset.y);
  let existing_pixel = Jimp.intToRGBA(hex);

  console.log(r,g,b,existing_pixel)

  if (existing_pixel.r == r && existing_pixel.g == g && existing_pixel.b == b) {
    console.log("Already remarkable!")
    return true;
  } else {
    return false;
  }
}

main().catch(console.error);
