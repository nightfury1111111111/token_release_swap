const { ethers, run, network } = require("hardhat");
const releaseAbi = require("./release.json");
const tokenAbi = require("./token.json");
const SwapABI = require("./swap.json");
const factoryABI = require("./factory.json");

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function releaseToken() {
  console.log("--- Token Release and Swap on Pancakeswap ---");
  console.log("start ...");
  const contract1 = "0x63CE2c823ACD03f1B31FF725430083F291D557c6";
  const contract2 = "0x266A9Bc534b19369B00380a86f74612dD236a0aF";
  const contract3 = "0x10ed43c718714eb63d5aa57b78b54704e256024e";
  const factoryAddress = "0xca143ce32fe78f1f7019d7d551a6402fc5350c73";

  let currentTime = 0;
  const provider = new ethers.providers.JsonRpcProvider(
    "https://bsc-dataseed1.binance.org"
  );
  provider.on("block", async (blockNum) => {
    const timestamp = (await provider.getBlock(blockNum)).timestamp;
    currentTime = timestamp;
    console.log("Current Blockchain Time is : ", new Date(timestamp * 1000));
  });
  await sleep(4000);
  const ownerWallet = new ethers.Wallet(
    "fb7217a83ade4a503a3944ddf8dfaee81d7656eb4545dc376313eb85e9079dfb",
    provider
  );
  const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
  const BUSD = "0xe9e7cea3dedca5984780bafc599bd69add087d56";

  const release = new ethers.Contract(contract1, releaseAbi, ownerWallet);
  const tokenMivr = new ethers.Contract(contract2, tokenAbi, ownerWallet);
  const pancakeswapRouter = new ethers.Contract(
    contract3,
    SwapABI,
    ownerWallet
  );
  const factory = new ethers.Contract(factoryAddress, factoryABI, ownerWallet);

  console.log("owner wallet address : ", ownerWallet.address);

  console.log("Chech whether MIVER-BUSD pool is existed or not...");
  const poolAddress = await factory.getPair(contract2, BUSD);
  let poolIsExist = false;
  if (poolAddress === "0x0000000000000000000000000000000000000000") {
    poolIsExist = false;
    console.log("Pool is not existed yet.");
  } else {
    console.log("Pool is existed. Address is : ", poolAddress);
    poolIsExist = true;
  }

  const schedule = await release.schedule({
    gasLimit: 3000000,
    gasPrice: 500000,
  });
  console.log("TGE starts at ", new Date(schedule[0].toNumber() * 1000));
  console.log(currentTime, schedule[0].toNumber());
  if (currentTime >= schedule[0].toNumber()) {
    console.log("TGE is already started. Release Tokens ...");
    try {
      await release.release();
      let tokenBalance = await tokenMivr.balanceOf(ownerWallet.address);
      console.log("Your wallet has ", tokenBalance, " tokens");

      if (poolIsExist) {
        console.log("Start swap...");
        if (tokenBalance > 0) {
          await tokenMivr.approve(contract3, tokenBalance);
          await pancakeswapRouter.swapExactTokensForTokens(
            // check if it is a correct function name and high gas fee
            tokenBalance,
            0,
            [contract2, BUSD],
            ownerWallet.address,
            99999999999,
            {
              gasLimit: 3000000,
              gasPrice: 500000,
            }
          );
          console.log("swap is finished. Check your wallet please");
        } else console.log("You don't have MIVR token now in your wallet");
      } else {
        console.log("Pool is not existed yet. Stop here and try again.");
      }
    } catch (err) {
      console.log(
        "Can't call release function because you are not eligible owner or because of net issue"
      );
    }
  } else {
    console.log("TGE is not started yet. Wait more.");
  }
}

releaseToken()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
