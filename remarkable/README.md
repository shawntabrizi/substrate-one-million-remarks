# Remarkable Apps

Remarkable apps take advantage of Substrate's `system.remark` extrinsic, which basically allows a user to submit any arbitrary bytes to the network.

These bytes are not stored on-chain, but they can be listened to by a running service like the one provided here, and then stored/parsed off-chain.

To make a remarkable app you need to do the following:

1. Define a 4 character prefix for your app.
2. Create an `initialize()` function which is called once at the start of the running service.
3. Create a `parse(string)` function which accepts a string form of the buffer (minus the prefix).
4. Create an `update()` function which is called at the end of every new block.

That's it!
