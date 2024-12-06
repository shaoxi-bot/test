// 1. 公私钥对
// 2. 公钥对直接当成地址使用(或截取前20位)
// 3. 公钥可以通过私钥计算得出
var EC = require('elliptic').ec;
var fs = require('fs');
const { Mode } = require('vorpal');
var ec = new EC('secp256k1');

var keypair = ec.genKeyPair();
const res = {
  prv: keypair.getPrivate('hex').toString(),
  pub: keypair.getPublic('hex').toString(),
};

function getPub(prv) {
  // 根据私钥计算公钥
  return ec.keyFromPrivate(prv).getPublic('hex').toString();
}

// 生成密钥
function generateKeys() {
  const fileName = './wallet.json';
  try {
    let res = JSON.parse(fs.readFileSync(fileName));
    if (res.prv && res.pub && getPub(res.prv) == res.pub) {
      keypair = ec.keyFromPrivate(res.prv);
      return res;
    } else {
      throw 'not valid wallet.json';
    }
  } catch (error) {
    // 文件不存在 或者文件内容不合法 重新生成
    const res = {
      prv: keypair.getPrivate('hex').toString(),
      pub: keypair.getPublic('hex').toString(),
    };
    fs.writeFileSync(fileName, JSON.stringify(res));
    return res;
  }
}

// 签名
function sign({ from, to, amount }) {
  const bufferMsg = Buffer.from(`${from}-${to}-${amount}`);
  let signature = Buffer.from(keypair.sign(bufferMsg).toDER()).toString('hex');
  return signature;
}

// 校验签名
function verify({ from, to, amount, signature }, pub) {
  const keypairTemp = ec.keyFromPublic(pub, 'hex');
  const bufferMsg = Buffer.from(`${from}-${to}-${amount}`);
  return keypairTemp.verify(bufferMsg, signature);
}
const keys = generateKeys();

// const trans = { from: 'woniu', to: 'imooc', amount: 100 };
// const trans1 = {from:"woniu1",to:"imooc",amount:100}
// const signature = sign(trans);
// console.log(signature);
// console.log(
//   verify({ from: 'woniu', to: 'imooc', amount: 100, signature }, keys.pub),
// );

module.exports = {sign,verify,keys}
