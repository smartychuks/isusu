// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Isusu {
    address _owner;
    uint locktime;
    constructor(){
        _owner = msg.sender;
    }

    mapping(address => uint) public balances;
    mapping(address => uint) public time;

    function owner() public view returns(address){
        address isOwner = _owner;
        return isOwner;
    }

    // function to deposit matic to contract
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        if (locktime < block.timestamp) {
            locktime = block.timestamp + (1 days)/(24*60);
            time[msg.sender] += locktime;
        }
    }

    // function to get balances
    function getBalances() public view returns (uint) {
        return balances[msg.sender];
    }

    // function to increase the lock time
    function increaseLockTime(uint _secondsToIncrease) public {
        time[msg.sender] += _secondsToIncrease;
    }

    // function to Withdraw funds
    function withdraw() public {
        require(balances[msg.sender] > 0, "The funds locked is insufficient");
        require(block.timestamp > time[msg.sender], "Time for lock is not expired");

        uint amount = balances[msg.sender];
        balances[msg.sender] = 0;

        (bool sent,) = msg.sender.call{value: amount}("");
        if(!sent){
            balances[msg.sender] = amount;
        }
        require(sent, "Failed to send Matic");
    }

    // function to get time that funds can be unlocked
    function getLockTime() public view returns(uint) {
        return time[msg.sender];
    }
}