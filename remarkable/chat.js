const fs = require('fs');

let chat;
let shouldUpdate = false;

function hexToUtf8(hex) {
  return decodeURIComponent(
    hex.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&')
  );
}

async function initialize() {
  try {
    let data = await fs.readFile('./public/chat.json');
    chat = JSON.parse(data);
    console.log('Remarkable Chat: File Found');
  } catch {
    console.log('Remarkable Chat: File NOT Found');
    let firstMessage = {
      u: '0x00',
      b: '0',
      m: 'Welcome to the chat!'
    };
    chat = [firstMessage];
    let data = JSON.stringify(chat);
    await fs.writeFile('./public/chat.json', data, err => {
      if (err) throw err;
      console.log('Remarkable Chat: File Created');
    });
  }
  console.log('Remarkable Chat: Initialized');
}

function parse(string, user, block) {
  try {
    chat.push({
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

async function update() {
  if (shouldUpdate) {
    try {
      let data = JSON.stringify(chat);
      await fs.writeFile('./public/chat.json', data, err => {
        if (err) throw err;
        console.log('Remarkable Chat: Updated');
      });
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
