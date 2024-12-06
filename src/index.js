const vorpal = require('vorpal')();
const Table = require('cli-table');
const Blockchain = require('./blockchain');
const blockchain = new Blockchain();

function formatLog(data) {
  if (!Array.isArray(data)) {
    data = [data];
  }
  const first = data[0];
  const header = Object.keys(first);
  const table = new Table({
    head: header,
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
vorpal.command('mine <address>', '挖矿').action(function (args, callback) {
  const newBlock = blockchain.mine(args.address);
  if (newBlock) {
    formatLog(newBlock);
  }
  callback();
});
vorpal.command('chain', '查看区块链').action(function (args, callback) {
  formatLog(blockchain.blockchain);
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
  .command('trans <from> <to> <amount>', '转账')
  .action(function (args, callback) {
    let trans = blockchain.transfer(args.from, args.to, args.amount);
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
