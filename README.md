# substrate-one-million-remarks
 One million pixel image, controlled by remarks on a Substrate blockchain.


## How To

You can test this app by [running a local Substrate node](https://substrate.dev/docs/en/getting-started/installing-substrate).

1. Start the Substrate node (connects on `ws://127.0.0.1:9944`)
2. Start the app with `PORT=8888 node index.js`
3. Open the [Polkadot UI](https://polkadot.js.org/apps/#/extrinsics) to submit an extrinsic.
4. Call `system > remark` with the following `_remark: Bytes` as a hex string:

	```
	0x1337xxxyyycccccc
	```

	> Note this hex string is read litterally (lol)
	
	* `1337` is the magic identifier to that the app uses to make sure the message is for this app
	* `xxx` is a number from 000-999 describing the x coordinates of the pixel
	* `yyy` is a number from 000-999 describing the y coordinates of the pixel
	* `cccccc` is a hex encoded RGB color of the pixel. So `000000` is black, `ffffff` is white, `ff0000` is red, etc...

5. Submit the extrinsic, and look at the updated `image.bmp`.