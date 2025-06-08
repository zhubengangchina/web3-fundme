const { ethers } = require("hardhat")


async function main() {
    //create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    console.log("contract deploying")
    //deploy contact from factory
    const fundMe = await fundMeFactory.deploy(300)
    await fundMe.waitForDeployment()

    console.log("contract has been deployed sunccessfully ,contract address is " + fundMe.target)
    
    //verify fundme
    if(hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("Waiting for 5 confirmations")
        await fundMe.deploymentTransaction().wait(5) 
        await verifyFundMe(fundMe.target, [300])
    } else {
        console.log("verification skipped..")
    }

    //init 2 accounts
    const [firstAccount,secondAccount] = await ethers.getSigner()

    //fund contract with first account
    const fundTx = await fundMe.fund({value: ethers.parseEther("0.005")})
    await fundTx.wait()

     console.log(`2 accounts are ${firstAccount.address} and ${secondAccount.address}`)

     //check balance of contarct
     const balanceOfContract = await ethers.provider.getBalance(fundMe.target)
     console.log(`Balance of the contract is ${balanceOfContract}`)

     //fund contract with second acount
     const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({value: ethers.parseEther("0.005")})
    await fundTxWithSecondAccount.wait()

    //check balance of contract
    const balanceOfContractAfterSecondFund = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of the contract is ${balanceOfContractAfterSecondFund}`)

    //check mapping
    const firstAccountBalanceInFundMe = await fundMe.fundsToAmount(firstAccount.address)
    const secondAccountBalanceInFundMe = await fundMe.fundsToAmount(secondAccount.address)

    console.log(`Balance of first account ${firstAccount.address} is ${firstAccountBalanceInFundMe}`)
    console.log(`Balance of second account ${secondAccount.address} is ${secondAccountBalanceInFundMe}`)
}

async function verifyFundMe(fundMeAddr,args) {
    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: args,
    });
}

main().then().catch((error) => {
    console.error(error)
    process.exit(1)
})