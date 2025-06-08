const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { devlopmentChains } = require("../../helper-hardhat-config")

devlopmentChains.includes(network.name)
? describe.skip
: describe("test fundme contract", async function () {

    let fundMe
    let firstAccount

    beforeEach(async function () {
        await deployments.fixture(["all"])
        firstAccount = (await getNamedAccounts()).firstAccount
        const fundMeDeployment = await deployments.get("FundMe")
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)
    })

    //test fund and getFund successfully
    it("fund and getFund successfully",
        async function() {
            //make sure target reached
            await fundMe.fund({value: ethers.parseEther("0.006")})
            //make sure window closed
            await new Promise(resolve => setTimeout(resolve, 181 * 1000))
            //make sure we can get receipt
            const getFundTx = await fundMe.getFund()
            const getFundReceipt = await getFundTx.wait()
            expect(getFundReceipt)
            .to.be.emit(fundMe,"FundWithdrawByOwner")
            .withArgs(ethers.parseEther("0.006"))
        }
    )

    //test fund and refund successfully
    it("fund and refund sucessfully",
        async function() {
            //make sure target reached
            await fundMe.fund({value: ethers.parseEther("0.004")})
            //make sure window closed
            await new Promise(resolve => setTimeout(resolve, 181 * 1000))
            //make sure we can get receipt
            const reFundTx = await fundMe.getFund()
            const reFundReceipt = await reFundTx.wait()
            expect(reFundReceipt)
            .to.be.emit(fundMe,"RefundByFunder")
            .withArgs(ethers.parseEther("0.004"))
        }
    )
  
})