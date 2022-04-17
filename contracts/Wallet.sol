//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Wallet {
    address[] public approvers;
    uint256 public quorum;
    struct Transfer {
        uint256 id;
        uint256 amount;
        address payable to;
        uint256 approvals;
        bool sent;
    }
    Transfer[] public transfers;
    mapping(address => mapping(uint256 => bool)) public approvals;

    constructor(address[] memory _approvers, uint256 _quorum) {
        approvers = _approvers;
        quorum = _quorum;
    }

    function getApprovers() external view returns (address[] memory) {
        return approvers;
    }

    function getTransfers() external view returns (Transfer[] memory) {
        return transfers;
    }

    function createTransfer(uint256 amount, address payable to)
        external
        onlyApproved
    {
        transfers.push(Transfer(transfers.length, amount, to, 0, false));
    }

    function approveTransfer(uint256 id) external onlyApproved {
        require(transfers[id].sent == false, "Transfer already sent");
        require(
            approvals[msg.sender][id] == false,
            "Transfer already approved"
        );
        approvals[msg.sender][id] = true;
        transfers[id].approvals++;
        if (transfers[id].approvals >= quorum) {
            transfers[id].sent = true;
            address payable to = transfers[id].to;
            uint256 amount = transfers[id].amount;
            console.log("Transfer approved");
            to.transfer(amount);
        }
    }

    receive() external payable {}

    modifier onlyApproved() {
        bool approved = false;
        for (uint256 i = 0; i < approvers.length; i++) {
            if (approvers[i] == msg.sender) {
                approved = true;
                break;
            }
        }
        require(approved, "Only approved users can perform this action");
        _;
    }
}
