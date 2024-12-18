const dgram = require('dgram');

const udp = dgram.createSocket('udp4');

udp.on('message:', (data, remote) => {
  console.log('accept message' + data.toString());
  console.log(remote);
});

udp.on('listening', function () {
  const address = udp.address();
  console.log('udp server is listening' + address.address + ':' + address.port);
});


function send(message, port, host) {
  console.log('send:', message, host, port);
  udp.send(Buffer.from(message), port, host);
}

const port = Number(process.argv[2])
const host = process.argv[3]

if (port && host){
    send('hello word!',port,host)
}


udp.bind(8002);
