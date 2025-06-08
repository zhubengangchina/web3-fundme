const { task } = require("hardhat/config")

task("deploy-fundme", "deploy and verify fundme conract").setAction(async (taskArgs, hre) => {
    //create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    console.log("contract deploying")
    //deploy contact from factory
    const fundMe = await fundMeFactory.deploy(300)
    await fundMe.waitForDeployment()

    console.log("contract has been deployed sunccessfully ,contract address is " + fundMe.target)

    //verify fundme
    if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("Waiting for 4 confirmations")
        await fundMe.deploymentTransaction().wait(4)
        await verifyFundMe(fundMe.target, [300])
    } else {
        console.log("verification skipped..")
    }

})


async function verifyFundMe(fundMeAddr, args) {
    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: args,
    });
}

module.exports = {}