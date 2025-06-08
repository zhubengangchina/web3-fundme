const { ethers, deployments, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { devlopmentChains } = require("../../helper-hardhat-config")

!devlopmentChains.includes(network.name)
? describe.skip
: describe("test fundme contract", async function () {

    let fundMe
    let fundMeSecondAccount
    let firstAccount
    let secondAccount
    let mockV3Aggregator

    beforeEach(async function () {
        await deployments.fixture(["all"])
        firstAccount = (await getNamedAccounts()).firstAccount
        secondAccount = (await getNamedAccounts()).secondAccount
        mockV3Aggregator = await deployments.get("MockV3Aggregator")
        const fundMeDeployment = await deployments.get("FundMe")
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)

        // 获取 Signer 对象
        const signers = await ethers.getSigners()
        const secondSigner = signers[1] // 注意：确保 secondAccount 是第 1 个账户

        // 连接合约给第二个账户
        fundMeSecondAccount = fundMe.connect(secondSigner)
        //fundMeSecondAccount = await ethers.getContract("FundMe", secondAccount)
    })
    it("test if ther owner is msg.sender", async function () {
        await fundMe.waitForDeployment()
        assert.equal((await fundMe.owner()), firstAccount)
    })
    it("test if the datafeed is assigned conrrectly", async function () {
        await fundMe.waitForDeployment()
        assert.equal((await fundMe.dataFeed()), mockV3Aggregator.address)
    })

    //fund getFund refund
    //unit test for fund
    //window open ,value greater then minimum,funder balance
    it("window closed,value grater then minimum,fund failed",
        async function () {
            //make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()
            //value is greater minimum value
            await expect(fundMe.fund({ value: ethers.parseEther("0.005") }))
                .to.be.revertedWith("window is closed")
        }
    )
    it("window open,value is less than minimum,fund failed",
        async function () {
            await expect(fundMe.fund({ value: ethers.parseEther("0.0006") }))
                .to.be.revertedWith("Send more ETH")
        }
    )

    it("window open ,value is greater than minimum,fund success",
        async function () {
            await fundMe.fund({ value: ethers.parseEther("0.006") });
            const balance = await fundMe.fundsToAmount(firstAccount)
            await expect(balance).to.be.equals(ethers.parseEther("0.006"))
        }
    )

    //unit test for getFund
    //only Owner .window closed ,target reached 
    it("not owner ,window closed ,target reached ,getFund failed",
        async function () {
            //make sure the target is reached
            await fundMe.fund({ value: ethers.parseEther("0.006") })

            //make sure the window is closed
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMeSecondAccount.getFund())
                .to.be.revertedWith("this function is only be called by owner")
        }
    )

    it("window open,target reached ,getFund failed",
        async function () {
            await fundMe.fund({ value: ethers.parseEther("0.006") })
            await expect(fundMe.getFund())
                .to.be.revertedWith("window is not close")
        }
    )

    it("window closed,target not reached,getFund Failed",
        async function() {
            await fundMe.fund({ value: ethers.parseEther("0.003") })
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMe.getFund())
                .to.be.revertedWith("Targer is not reached")

        }
    )

    it("window closed, target reached ,getFund Success",
        async function() {
            await fundMe.fund({ value: ethers.parseEther("0.006") })
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMe.getFund())
                .to.emit(fundMe,"FundWithdrawByOwner")
                .withArgs(ethers.parseEther("0.006"))
        }
    )

    //refund
    //window closed , target not reached , funder has balance
    it("window open ,target not reached ,funder has balance",
        async function() {
            await fundMe.fund({ value: ethers.parseEther("0.005") })
            await expect(fundMe.reFund())
            .to.be.revertedWith("window is not close")
        }
    ) 

    it("window close ,target reach ,funder has balance",
        async function() {
            await fundMe.fund({ value: ethers.parseEther("0.006") })
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMe.reFund())
            .to.be.revertedWith("Target is reached")
        }
    )
    it("window close ,target not reach, funder not has balance",
        async function() {
            await fundMe.fund({ value: ethers.parseEther("0.003") })
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMeSecondAccount.reFund())
            .to.be.revertedWith("no funds to re-fund")
        }
    )

    it("window closed ,target not reached ,funder has balance",
        async function() {
            await fundMe.fund({ value: ethers.parseEther("0.003") })
            await helpers.time.increase(200)
            await helpers.mine()
            await expect(fundMe.reFund())
            .to.emit(fundMe,"RefundByFunder")
            .withArgs(firstAccount,ethers.parseEther("0.003"))
        }
    )
})