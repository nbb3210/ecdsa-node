const express = require("express");
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex, hexToBytes, utf8ToBytes } = require("ethereum-cryptography/utils");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

// privateKey: 1e8d8f9e06f3b9f1e57dc519dc51bcdd8a7e61480c01232d433977e352327f0d
// publicKey: 04cca441f9aaf3e8ab4b6b5d392f2694f31b98611555e8fa62077ca439d39b0b7c018f023f95526f7a6886939a9c86002e40b4137dc764ac8ab1d82bb778a0dd99
// address: f6ad9cbe295df168f6ff029f9ad1ab0ee601c8c3

// privateKey: f165d43829cbab4e878c14819edf557274eba11778a3ed1b663a324440313b58
// publicKey: 04ed749dda0c0050a6e68f298ef68a3ec5d36e697dcd4af24465e7463c2e16bc41207f0fb9a1c0b086c884bc597bccacd1b9c7b7cdc3f0d3e42b3a9d75e8a46f1f
// address: 551a8c7577063533be84cdca34a4ee49edf1e558

// privateKey: 3ac6ceba8e1e7acb5ac66e2f41f27343f5fac7cd04ce3f7a91e27b774ba6b5d8
// publicKey: 0484801eec38eeb5ac7d2c2c5690fc933e497661c829ad627067549f580bb7b0595a0b35bfbc1e0f8f0c7f0a5785c52e24201293719fd381fe0a46c3b240f102fb
// address: 7c7baa85291d9ea403adae8c84d98f5dee0390c1

const balances = {
  "f6ad9cbe295df168f6ff029f9ad1ab0ee601c8c3": 100,
  "551a8c7577063533be84cdca34a4ee49edf1e558": 50,
  "7c7baa85291d9ea403adae8c84d98f5dee0390c1": 75,
};

function hashMessage(message) {
  return keccak256(utf8ToBytes(message))
}

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const {
    msg,
    signature_r,
    signature_s,
    recovery,
    messageHash,
    publicKey,
  } = req.body;
  const signature = {
    r: BigInt(`0x${signature_r}`),
    s: BigInt(`0x${signature_s}`),
    recovery,
  };

  // 验证签名
  const isValidSignature = secp.secp256k1.verify(
    signature,
    hexToBytes(`0x${messageHash}`),
    hexToBytes(`0x${publicKey}`)
  );
  if (!isValidSignature) {
    res.status(400).send({ message: "Invalid signature!" });
  }

  // 验证 message
  const isValidMessage = toHex(hashMessage(msg)) === messageHash;
  if (!isValidMessage) {
    res.status(400).send({ message: "Invalid message!" });
  }

  const sender = toHex(keccak256(hexToBytes(publicKey).slice(1)).slice(-20));
  const recipient = msg.split("to ")[1];
  const amount = parseInt(msg.split(" ")[1]);
  console.log(`send ${amount} from ${sender} to ${recipient}`);

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
