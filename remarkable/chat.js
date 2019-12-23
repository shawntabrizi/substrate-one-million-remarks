const fs = require('fs');

let posts;
let shouldUpdate = false;

function hexToUtf8(hex) {
  return decodeURIComponent(
    hex.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&')
  );
}

function initialize() {
  try {
    let data = fs.readFileSync('./public/chat.json');
    posts = JSON.parse(data).posts;
    console.log('Remarkable Chat: File Found');
  } catch {
    console.log('Remarkable Chat: File NOT Found');
    let firstMessage = {
      u: '0x00',
      b: '0',
      m: 'Welcome to the chat!'
    };
    posts = [firstMessage];
    let data = JSON.stringify(
      {
        posts: posts
      },
      null,
      2
    );
    fs.writeFileSync('./public/chat.json', data);
    console.log('Remarkable Chat: File Created');
  }
  console.log('Remarkable Chat: Initialized');
}

function parse(string, user, block) {
  try {
    posts.push({
      u: user,
      b: block,
      m: hexToUtf8(string)
    });

    shouldUpdate = true;
    console.log('Remarkable Chat: New Message');
  } catch (e) {
    console.error(e);
  }
}

function update() {
  if (shouldUpdate) {
    try {
      let data = JSON.stringify(
        {
          posts: posts
        },
        null,
        2
      );
      fs.writeFileSync('./public/chat.json', data);
      console.log('Remarkable Chat: Updated');
      shouldUpdate = false;
    } catch (e) {
      console.error(e);
    }
  }
}

module.exports = {
  initialize: initialize,
  parse: parse,
  update: update
};
