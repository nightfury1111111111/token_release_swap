const { expect } = require("chai");
const { ethers } = require("hardhat");
const ReleaseABI = require("../scripts/release/release.json");
const TokenABI = require("../scripts/release/testToken.json");
const SwapABI = require("../scripts/release/swap.json");
var provider = new ethers.providers.WebSocketProvider("ws://localhost:8545");

const RELEASE = "0x63CE2c823ACD03f1B31FF725430083F291D557c6";
const TOKEN = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";
const SWAP = "0x10ed43c718714eb63d5aa57b78b54704e256024e";
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

let accounts;
let release;
let testToken;
let swap;

describe("Release", function() {
  before(async function() {
    accounts = await hre.ethers.getSigners();
    release = new ethers.Contract(RELEASE, ReleaseABI, accounts[0]);
    testToken = new ethers.Contract(TOKEN, TokenABI, accounts[0]);
    swap = new ethers.Contract(SWAP, SwapABI, accounts[0]);
  });
  it("release at TGE", async function() {
    const owner = await release.owner();
    const token = await release.token();
    const paused = await release.paused();
    const schedule = await release.schedule();
    console.log(token, owner, paused, schedule);
    expect(owner).to.equal("0x7F275F312787406976c94Ce219885F59bB1cb7A6");
    let originalBalance = await testToken.balanceOf(accounts[0].address);
    console.log(originalBalance);
    await swap.swapExactETHForTokens(
      0,
      [WBNB, TOKEN],
      accounts[0].address,
      99999999999,
      {
        value: ethers.utils.parseEther("1"),
      }
    );
    let finalBalance = await testToken.balanceOf(accounts[0].address);
    console.log(finalBalance);
    let originalBNB = await provider.getBalance(accounts[0].address);
    console.log(originalBNB);
    await testToken.approve(SWAP, finalBalance);
    await swap.swapExactTokensForETH(
      finalBalance,
      0,
      [TOKEN, WBNB],
      accounts[0].address,
      99999999999
    );
    let finalBNB = await provider.getBalance(accounts[0].address);
    finalBalance = await testToken.balanceOf(accounts[0].address);
    console.log(finalBNB);
    console.log(finalBalance);
  });
});
