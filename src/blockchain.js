const crypto = require('crypto');
const dgram = require('dgram');
const rsa = require('./res')

const initBlock = {
  index: 0,
  data: 'hello word!',
  prevHash: '0',
  timestamp: 1732859094,
  nonce: 222,
  hash: '00dabf32d72b9d91ce9d4905a728750d1280e5ae292f780acea2269f0860cd6a',
};

class Blockchain {
  constructor() {
    this.blockchain = [initBlock];
    this.data = [];
    this.difficulty = 2;
    this.remote = {};
    // 所有网络节点信息
    this.peers = [];
    // 种子节点
    this.seed = { port: 8001, address: 'localhost' };
    this.udp = dgram.createSocket('udp4');
    this.init();
  }

  init() {
    this.bindP2p();
    this.bindExit();
  }

  bindP2p() {
    // 接收网络发送过来的消息
    this.udp.on('message', (data, remote) => {
      const { address, port } = remote;
      const action = JSON.parse(data);
      // {
      //   type:
      //   data:
      // }
      if (action.type) {
        this.dispatch(action, { address, port });
      }
    });

    this.udp.on('listening', () => {
      const address = this.udp.address();
      console.log('【信息】：udp监听完毕，端口：' + address.port);
    });

    // 区分种子节点和普通节点
    console.log(process.argv);
    const port = process.argv[2] || 0;
    this.startNode(port);
  }

  startNode(port) {
    this.udp.bind(port);

    // 如果不是种子节点，需要发送消息给种子节点
    if (port != 8001) {
      this.send(
        {
          type: 'newPeer',
        },
        this.seed.port,
        this.seed.address,
      );
    }
  }
  send(message, port, host) {
    this.udp.send(JSON.stringify(message), port, host);
  }

  dispatch(action, remote) {
    // 接收网络消息
    switch (action.type) {
      case 'newPeer':
        // 接入节点
        // 1. ip+port
        this.send({
          type: 'remoteAddress',
          data: remote,
        }, remote.port, remote.address);
        // 2. 当前的所有节点
        this.send({
          type: 'peersList',
          data: this.peers,
        }, remote.port, remote.address);
        // 3. 广播所有节点
        this.boardcast({
          type: "sayhi",
          data: remote
        })


        this.peers.push(remote);
        console.log('new peer', remote);
        break;
      case 'remoteAddress':
        this.remote = action.data;
        break;
      case 'peersList':
        const newPeers = action.data;
        this.addPeers(newPeers)
        break;
      case 'sayhi':
        let remotePeer = action.data;
        console.log("【信息】新朋友你好，相识就是缘分")
        this.send({ type: 'hi' }, remotePeer.port, remote.address)
        break;
      case 'hi':
        console.log(`${remote.address}:${remote.port} : ${action.data}`)
        break;
      case 'exit':
        console.log('exit', remote);
        break;
      default:
        console.log('未定义类型的消息');
    }
  }

  // 广播
  boardcast(action) {
    this.peers.forEach(v => {
      this.send(action, v.port, v.address)
    })
  }

  isEqualPeer(peer1, peer2) {
    return pee1.address == peer2.address && peer1.port == peer2.port
  }

  addPeers(newPeers) {
    newPeers.forEach(peer => {
      if (!this.peers.find(v => this.isEqualPeer(peer, v))) {
        this.peers.push(peer)
      }
    })
  }

  bindExit() {
    process.on('exit', () => {
      // 如果不是种子节点，需要发送消息给种子节点
      if (this.udp.address().port !== 8001) {
        this.send(
          {
            type: 'exit',
          },
          this.seed.port,
          this.seed.address,
        );
      }
      console.log('退出');
    });
  }

  // 获取最后一个区块
  getLastChain() {
    return this.blockchain[this.blockchain.length - 1];
  }

  // 交易
  transfer(from, to, amount) {
    if (from != '0') {
      let blance = this.blance(from);
      if (blance < amount) {
        console.log('not enough blance', from, blance, amount);
        return;
      }
    }
    // 签名校验
    // const tranObj = { from, to, amount };
    const sig = rsa.sign({ from, to, amount })
    const sigTrans = { from, to, amount, sig }
    this.data.push(sigTrans);
    return sigTrans;
  }

  isValidaTrans(trans){
    // 是不是合法交易
    return rsa.verify(trans,trans.from)
  }

  // 查看余额p
  blance(address) {
    let blance = 0;
    this.blockchain.forEach((block) => {
      if (!Array.isArray(block.data)) {
        return;
      }
      block.data.forEach((trans) => {
        if (address == trans.to) {
          blance += trans.amount;
        }
        if (address == trans.from) {
          blance -= trans.amount;
        }
      });
    });
    return blance;
  }

  // 挖矿
  mine(address) {
    // 校验所有交易的合法性
    // if (!this.data.every(v => this.isValidaTrans(v))){
    //   console.log("trans not vaild")
    //   return
    // }
    // 过滤不合法交易
    this.data = this.data.filter(v => this.isValidaTrans(v))

    this.isValidaTrans()
    this.transfer('0', address, 100);
    // 1.生成新区块
    // 2.计算哈希 (直到计算出的哈希符合条件)
    const newBlock = this.generateNewBlock();
    // 3.校验区块合法
    if (this.isValidaBlock(newBlock) && this.isValidaChain()) {
      this.blockchain.push(newBlock);
      this.data = [];
      return newBlock;
    } else {
      console.log('Error, Invalid Block', newBlock);
    }
    return false;
  }
  // 生存新区块
  generateNewBlock() {
    let nonce = 0;
    const index = this.blockchain.length;
    const data = this.data;
    const prevHash = this.getLastChain().hash;
    let timestamp = new Date().getTime();
    let hash = this.computeHash(index, prevHash, timestamp, data, nonce);
    while (hash.slice(0, this.difficulty) != '0'.repeat(this.difficulty)) {
      nonce += 1;
      hash = this.computeHash(index, prevHash, timestamp, data, nonce);
    }
    return {
      index,
      data,
      prevHash,
      timestamp,
      nonce,
      hash,
    };
  }
  // 计算哈希
  computeHash(index, prevHash, timestamp, data, nonce) {
    return crypto
      .createHash('sha256')
      .update(index + prevHash + timestamp + data + nonce)
      .digest('hex');
  }
  computeHashForBlock({ index, prevHash, timestamp, data, nonce }) {
    return this.computeHash(index, prevHash, timestamp, data, nonce);
  }
  // 校验区块
  isValidaBlock(newBlock, prevChain = this.getLastChain()) {
    // 区块的index等于最新区块的index+1
    // 区块的time 大于最新区块
    // 区块的prevHash等于最新区块的hash
    // 区块的hsah要符合条件
    // 计算新区块哈希是否正确
    if (newBlock.index !== prevChain.index + 1) {
      console.log('111111');
      return false;
    } else if (newBlock.timestamp <= prevChain.timestamp) {
      console.log('2222222');
      return false;
    } else if (newBlock.prevHash !== prevChain.hash) {
      console.log('333333');
      return false;
    } else if (
      newBlock.hash.slice(0, this.difficulty) != '0'.repeat(this.difficulty)
    ) {
      console.log('4444444');
      return false;
    } else if (newBlock.hash !== this.computeHashForBlock(newBlock)) {
      return false;
    }
    return true;
  }
  // 校验区块链
  isValidaChain(chain = this.blockchain) {
    for (let i = this.blockchain.length - 1; i > 1; i--) {
      if (!this.isValidaBlock(this.blockchain[i], this.blockchain[i - 1])) {
        return false;
      }
    }
    if (JSON.stringify(chain[0]) !== JSON.stringify(initBlock)) {
      return false;
    }
    return true;
  }
}

module.exports = Blockchain;
