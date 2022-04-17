import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "console";
import { ethers } from "hardhat";
import { Wallet } from "../typechain";
const { expectRevert } = require("@openzeppelin/test-helpers");

let wallet: Wallet;
let accounts: SignerWithAddress[];
beforeEach(async function () {
  accounts = await ethers.getSigners();
  const Wallet = await ethers.getContractFactory("Wallet");
  wallet = await Wallet.deploy(
    [accounts[0].address, accounts[1].address, accounts[2].address],
    2
  );
  await wallet.deployed();
  const [owner] = await ethers.getSigners();
  await owner.sendTransaction({
    to: wallet.address,
    value: ethers.utils.parseEther("1"),
  });
});
describe("Wallet", () => {
  it("should have correct approvers and quorum", async function () {
    const approvers = await wallet.getApprovers();
    const quorum = wallet && (await wallet.quorum()).toNumber();
    assert(approvers.length === 3);
    assert(approvers[0] === accounts[0].address);
    assert(approvers[1] === accounts[1].address);
    assert(approvers[2] === accounts[2].address);
    assert(quorum === 2);
  });

  it("Should create transfer", async () => {
    await wallet.connect(accounts[0]).createTransfer(100, accounts[4].address);
    const transfers = await wallet.getTransfers();
    assert(transfers.length === 1);
    assert(transfers[0].id.toNumber() === 0);
    assert(transfers[0].amount.toNumber() === 100);
    assert(transfers[0].to === accounts[5].address);
  });

  it("Should not create transfers if sender is not approver", async () => {
    await expectRevert(
      wallet.connect(accounts[4]).createTransfer(100, accounts[5].address),
      "Only approved users can perform this action"
    );
  });

  it("Should increment approvals", async () => {
    await wallet.connect(accounts[0]).createTransfer(100, accounts[5].address);
    await wallet.connect(accounts[0]).approveTransfer(0);
    const transfers = await wallet.getTransfers();
    assert(transfers[0].approvals.toNumber() === 1);
    assert(transfers[0].sent === false);
  });

  it("Should send transfer when reached quorum", async () => {
    const balanceBefore = await ethers.provider.getBalance(accounts[6].address);
    await wallet.connect(accounts[0]).createTransfer(100, accounts[6].address);
    await wallet.connect(accounts[0]).approveTransfer(0);
    await wallet.connect(accounts[1]).approveTransfer(0);
    const transfers = await wallet.getTransfers();
    const balanceAfter = await ethers.provider.getBalance(accounts[6].address);
    assert(balanceAfter.sub(balanceBefore).toNumber() === 100);
    assert(transfers[0].approvals.toNumber() === 2);
    assert(transfers[0].sent === true);
  });

  it("Should not approve transfer if the sender is not approved", async () => {
    await wallet.connect(accounts[0]).createTransfer(100, accounts[6].address);
    await expectRevert(
      wallet.connect(accounts[4]).approveTransfer(0),
      "Only approved users can perform this action"
    );
  });

  it("Should not approve transfer if the transfer is already sent", async () => {
    await wallet.connect(accounts[0]).createTransfer(100, accounts[6].address);
    await wallet.connect(accounts[0]).approveTransfer(0);
    await wallet.connect(accounts[1]).approveTransfer(0);
    await expectRevert(
      wallet.connect(accounts[0]).approveTransfer(0),
      "Transfer already sent"
    );
  });
});
