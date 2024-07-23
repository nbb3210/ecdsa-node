import { useState } from "react";
import server from "./server";
import * as secp from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";
import { toHex, utf8ToBytes, hexToBytes } from "ethereum-cryptography/utils";

function hashMessage(message) {
  return keccak256(utf8ToBytes(message))
}

async function signMessage(privateKey, messageHash) {
  return secp.secp256k1.sign(messageHash, privateKey, { includeRecoveryParam: true });
}

function Transfer({ address, setBalance, privateKey, publicKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    const msg = `send ${sendAmount} to ${recipient}`
    const messageHash = hashMessage(msg)
    // const signature = await signMessage(hexToBytes(privateKey), messageHash)
    const signature = await signMessage(privateKey, messageHash)

    try {
       const {
        data: { balance },
      } = await server.post(`send`, {
        msg,
        signature_r: signature.r.toString(16),
        signature_s: signature.s.toString(16),
        recovery: signature.recovery,
        messageHash: toHex(messageHash), 
        publicKey
      });
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
