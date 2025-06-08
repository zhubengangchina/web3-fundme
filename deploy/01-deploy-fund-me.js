//写法1
// function deployFunction() {
//     console.log("this is a deploy function")
// }
// module.exports.default=deployFunction

//写法2
// module.exports= async(hre) => {
//     const getNameAccount = hre.getNameAccount
//     const deployments = hre.deployments
//     console.log("this is a deploy function")
// }

//写法3
const { network } = require("hardhat")
const { devlopmentChains, networkConfig, LOCK_TIME, CONFIRMATIONS } = require("../helper-hardhat-config")
module.exports = async ({ getNamedAccounts, deployments }) => {

    const { firstAccount } = await getNamedAccounts()
    const { deploy } = deployments

    let dataFeedAddr
    let confirmations

    if (devlopmentChains.includes(network.name)) {
        const mockV3Aggregator = await deployments.get("MockV3Aggregator")
        dataFeedAddr = mockV3Aggregator.address
        confirmations = 0
    } else {
        dataFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed
        confirmations = CONFIRMATIONS
    }

    const fundMe = await deploy("FundMe", {
        from: firstAccount,
        args: [LOCK_TIME, dataFeedAddr],
        log: true,
        waitConfirmations: confirmations
    })

    //remove deployments directory or add --reset flag if you redeploy contract
    // if (hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
    //     await hre.run("verify:verify", {
    //         address: fundMe.address,
    //         constructorArguments: [LOCK_TIME, dataFeedAddr],
    //     });
    // } else {
    //     console.log("Network is not sepolia, verification skipped...")
    // }
}

module.exports.tags = ["all", "fundme"]


// Hardhat Deploy 要求部署脚本默认导出一个 async function。

// 它会自动注入一个包含 getNamedAccounts 和 deployments 的对象，帮助你简化账户和部署操作。

// getNamedAccounts() 是 Hardhat Deploy 提供的工具，它返回 hardhat.config.js 中 namedAccounts 映射的账户。

// 这里你使用了 firstAccount，也就是一个自定义命名的账户（通常是 deployer）。

// 👉 你需要在 hardhat.config.js 中配置，例如：
// namedAccounts: {
//   firstAccount: {
//     default: 0 // 默认使用第一个账户作为部署账户
//   }
// }

// deployments 是 Hardhat Deploy 提供的对象，包含 deploy 方法，用于部署合约
// 启动部署 FundMe.sol 合约。

// from: 指定部署账户。

// args: 合约构造函数的参数，这里是 lockTime = 180。

// log: 是否打印部署日志。