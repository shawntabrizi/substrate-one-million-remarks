var Jimp = require('jimp');
const fs = require('fs');

async function main() {
  let image;

  // Try to open the file, else exit.
  try {
    image = await Jimp.read('input2.bmp');
    console.log('file found');
  } catch {
    console.log('file NOT found');
    process.exit(1);
  }

  // Optional Resize
  // image.resize(100, JIMP.auto);

  let finalJson = [];

  // Starting Location for your image. Top left corner.
  let start = {
    x: 900,
    y: 0
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

    if (alpha == 0xff && finalx < 1000 && finaly < 1000) {
      finalJson.push({
        x: finalx,
        y: finaly,
        r: red,
        g: green,
        b: blue
      });
    } else {
		console.log(`Pixel Skipped: ${x}, ${y}`)
	}
  });

  let data = JSON.stringify(finalJson, null, 2);
  fs.writeFileSync('image.json', data);
}

main().catch(console.error);
