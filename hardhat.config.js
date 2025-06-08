require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/env-enc").config()
require("./tasks")
require("hardhat-deploy")

const SEPOLIA_URL = process.env.SEPOLIA_URL
const PRIVATE_KEY = "e376a3c1f38608207c08d1ca3f1888848ff645b05b023f7544654b123925cc73"
const PRIVATE_KEY_1 = "a12bd85c6a8f1360f35d0608030343e4db246aebedad9ad86022da2e9b52204b"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20"
      },
      {
        version: "0.8.0"
      }
    ]
  },
  defaultNetwork: "hardhat",
  mocha: {
    timeout: 300000
  },
  networks: {
    sepolia: {
      url: SEPOLIA_URL,
      accounts: [PRIVATE_KEY, PRIVATE_KEY_1],
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    firstAccount: {
      default: 0
    },
    secondAccount: {
      default: 1
    }
  },
  gasReporter:{
    enabled: false
  }
};
