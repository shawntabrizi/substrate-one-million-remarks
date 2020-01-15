var { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
var { cryptoWaitReady } = require('@polkadot/util-crypto');

function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function which needs to run at start
async function main() {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });

  // Substrate node we are connected to and listening to remarks
  const provider = new WsProvider('ws://localhost:9944');
  //const provider = new WsProvider('wss://kusama-rpc.polkadot.io/');
  //const provider = new WsProvider('wss://cc3-5.kusama.network/');

  const api = await ApiPromise.create({ provider });

  // Add account with URI
  let account = keyring.addFromUri('//Alice', { name: 'Alice default' });

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

  for (let i = 0; i < 100; i++) {
    try {
      let txNonce = parseInt(accountNonce) + parseInt(i);

      let input = '0xc4a7' + 'e5ae88e68aa4e69d91e5ad90';
      console.log(input, txNonce);

      const unsub = await api.tx.system
        .remark(input)
        .signAndSend(account, { nonce: txNonce }, async function(result) {
          console.log(`${i}: Current status is ${result.status}`);

          if (result.status.isFinalized) {
            console.log(
              `${i}: Transaction included at blockHash ${result.status.asFinalized}`
            );
            // Unsubscribe from sign and send.
            unsub();
          }
        });
    } catch (e) {
      console.error(e);
      // Update account nonce
      accountNonce = await api.query.system.accountNonce(account.address);
    }
  }

  console.log('############ Finished Loop ##############');
}

main().catch(console.error);
