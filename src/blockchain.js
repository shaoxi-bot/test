const crypto = require('crypto');
const dgram = require('dgram');

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
      console.log('接收到消息：',action)
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
    console.log('send:' + message.type + ', ' + host + ':' + port);
    this.udp.send(JSON.stringify(message), port, host);
  }

  dispatch(action, remote) {
    // 接收网络消息
    switch (action.type) {
      case 'newPeer':
        console.log('new peer', remote);
        break;
      case 'exit':
        console.log('exit', remote);
        break;
      default:
        console.log('未定义类型的消息');
    }
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
    const tranObj = { from, to, amount };
    this.data.push(tranObj);
    return tranObj;
  }

  // 查看余额
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
