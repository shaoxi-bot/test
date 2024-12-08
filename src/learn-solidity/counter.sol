// sol 结尾
// bachelor client museum scan jump water bamboo special you artist raccoon property
// 1. 版本申明
pragma solidity ^0.8.0;
// 2. 合约声明
contract Counter { // contract 关键字，新建合约
    // 声明变量需要指定类型
    uint count = 0;
    constructor() {} // 构造函数，合约部署时调用

    function increment() public { // 函数声明，public 表示可以被外部调用
        count += 1;
    }

    function decrement() public {
        count -= 1;
    }

    function getCount() public view returns (uint) { // view 表示只读，不修改状态
        return count; // 返回值类型
    }

}
