// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

//创建一个收款函数
//记录投资人并且查看
//在锁定期内，达到目标值，生产上可以提款
//在锁定期内。没有达到目标值，投资人在锁定期后可以退款

contract FundMe {

    mapping (address => uint256) public fundsToAmount;

    uint256 constant MIN_NUM_VALUE =2 * 10 ** 18;//USD
    AggregatorV3Interface public  dataFeed;

    //目标值
    uint256 constant TARGET = 10 * 10 ** 18;

    address public owner;

    uint256 deploymentTimestamp;
    uint256 lockTime;

    address erc20Addr;

    bool public getFundSuccess = false;

    event FundWithdrawByOwner(uint256);
    event RefundByFunder(address ,uint256);

    constructor (uint256 _lockTime,address dataFeedAddr) {
        dataFeed = AggregatorV3Interface(dataFeedAddr);
        owner = msg.sender;
        deploymentTimestamp = block.timestamp;
        lockTime = _lockTime;
    }

    function fund() external payable  {
        require(converterEthToUsd(msg.value) >= MIN_NUM_VALUE,"Send more ETH");
        require(block.timestamp < deploymentTimestamp + lockTime,"window is closed");
        fundsToAmount[msg.sender] = msg.value;
    }

    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
         // prettier-ignore
        (
            /* uint80 roundId */,
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    function converterEthToUsd(uint256 ethAmount) internal view returns (uint256) {
       uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
       //usd 的精确度是 10 的8 次方
       return ethAmount * ethPrice / (10 ** 8);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }


    function getFund() external windowClosed onlyOwner {
        require(converterEthToUsd(address(this).balance) >= TARGET, "Targer is not reached");
        //transfer: transfer ETH and revert if tx failed
        //payable(msg.sender).transfer(address(this).balance);

        //send: transfer ETH and return false if failed
        //bool success = payable(msg.sender).send(address(this).balance);
        //require(success, "failed to send ETH");

        //call transfer ETH with data return value of function and bool
        bool success;
        uint256 balance = address(this).balance;
        (success,) = payable(msg.sender).call{value:address(this).balance}("");
        require(success,"failed to transfer ETH");
        fundsToAmount[msg.sender] = 0;

        getFundSuccess = true;

        //emit event
        emit FundWithdrawByOwner(balance);
    }

    function reFund() external windowClosed {
        //检查当前合约的余额是否达到了目标值
        require(converterEthToUsd(address(this).balance) < TARGET, "Target is reached");
        //检查当前用户是否有余额
        require(fundsToAmount[msg.sender] != 0,"no funds to re-fund");
        bool success;
        uint256 balance = fundsToAmount[msg.sender];
        (success,) =payable(msg.sender).call{value:balance}("");
        require(success,"failed to send ETH.");
        // 删除用户记的余额
        fundsToAmount[msg.sender] = 0;
        emit RefundByFunder(msg.sender,balance);
    }
    

    function setFunderToAmount(address funder,uint256 amountToUpdate) external {
        require(msg.sender == erc20Addr,"you do not have permission to call this function");
        fundsToAmount[funder] = amountToUpdate;
    }

    function setErc20Address(address _erc20Addr) public onlyOwner {
        erc20Addr = _erc20Addr;
    }


    modifier onlyOwner() {
        require(msg.sender == owner, "this function is only be called by owner");
        _;
    }

    modifier windowClosed() {
        require(block.timestamp >= deploymentTimestamp + lockTime,"window is not close");
        _;
    }
    

}
