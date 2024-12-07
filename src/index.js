const vorpal = require('vorpal')();
const Table = require('cli-table');
const Blockchain = require('./blockchain');
const rsa = require("./res")
const blockchain = new Blockchain();

function formatLog(data) {
  if (!data || data.length === 0) {
    return
  }
  if (!Array.isArray(data)) {
    data = [data];
  }
  const first = data[0];
  const header = Object.keys(first);
  const table = new Table({
    head: header,
    colWidths: new Array(header.length).fill(15),
  });
  const res = data.map((v) => {
    return header.map((h) => JSON.stringify(v[h], null, 1));
  });
  table.push(...res);
  console.log(table.toString());
}

vorpal.command('hello', '你好').action(function (args, callback) {
  this.log('你好啊');
  callback();
});
vorpal.command('mine', '挖矿').action(function (args, callback) {
  const newBlock = blockchain.mine(rsa.keys.pub);
  if (newBlock) {
    formatLog(newBlock);
  }
  callback();
});
vorpal.command('blackchain', '查看区块链').action(function (args, callback) {
  formatLog(blockchain.blockchain);
  callback();
});
vorpal.command('pub', '查看本地地址').action(function (args, callback) {
  // formatLog();
  this.log(rsa.keys.pub)
  callback();
});
vorpal.command('peers', '查看网络节点列表').action(function (args, callback) {
  formatLog(blockchain.peers);
  callback();
});
vorpal.command('chat <msg>', '向网络节点广播消息').action(function (args, callback) {
  blockchain.boardcast({ type: 'hi', data: args.msg });
  callback();
});
vorpal.command('pending', '查看未打包的交易').action(function (args, callback) {
  formatLog(blockchain.data);
  callback();
});
vorpal
  .command('detail <index>', '查看区块详情')
  .action(function (args, callback) {
    const block = blockchain.blockchain[args.index];
    this.log(JSON.stringify(block));
    callback();
  });
vorpal
  .command('trans <to> <amount>', '转账')
  .action(function (args, callback) {
    // 本地公钥做转账地
    let trans = blockchain.transfer(rsa.keys.pub, args.to, args.amount);
    if (trans) {
      formatLog(trans);
    }
    callback();
  });
vorpal
  .command('blance <address>', '查询余额')
  .action(function (args, callback) {
    const blance = blockchain.blance(args.address);
    if (blance || blance === 0) {
      formatLog({ blance, address: args.address });
    }
    callback();
  });

vorpal.exec('help');
vorpal.delimiter('shaoxi $').show();
