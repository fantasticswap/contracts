import { expect } from "chai"
import { prepare, deploy, getBigNumber, createSLP } from "./utilities"

describe("FantasticMaker", function () {
  before(async function () {
    await prepare(this, ["FantasticMaker", "FantasticBar", "FantasticMakerExploitMock", "ERC20Mock", "UniswapV2Factory", "UniswapV2Pair"])
  })

  beforeEach(async function () {
    await deploy(this, [
      ["fanta", this.ERC20Mock, ["FANTA", "FANTA", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ])
    await deploy(this, [["bar", this.FantasticBar, [this.fanta.address]]])
    await deploy(this, [
      ["fantasticMaker", this.FantasticMaker, [this.factory.address, this.bar.address, this.fanta.address, this.weth.address]],
    ])
    await deploy(this, [["exploiter", this.FantasticMakerExploitMock, [this.fantasticMaker.address]]])
    await createSLP(this, "fantaEth", this.fanta, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "fantaUSDC", this.fanta, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
  })
  describe("setBridge", function () {
    it("does not allow to set bridge for Fanta", async function () {
      await expect(this.fantasticMaker.setBridge(this.fanta.address, this.weth.address)).to.be.revertedWith("FantasticMaker: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.fantasticMaker.setBridge(this.weth.address, this.fanta.address)).to.be.revertedWith("FantasticMaker: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.fantasticMaker.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("FantasticMaker: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.fantasticMaker.setBridge(this.dai.address, this.fanta.address))
        .to.emit(this.fantasticMaker, "LogBridgeSet")
        .withArgs(this.dai.address, this.fanta.address)
    })
  })
  describe("convert", function () {
    it("should convert FANTA - ETH", async function () {
      await this.fantaEth.transfer(this.fantasticMaker.address, getBigNumber(1))
      await this.fantasticMaker.convert(this.fanta.address, this.weth.address)
      expect(await this.fanta.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.fantaEth.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.fanta.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert USDC - ETH", async function () {
      await this.usdcEth.transfer(this.fantasticMaker.address, getBigNumber(1))
      await this.fantasticMaker.convert(this.usdc.address, this.weth.address)
      expect(await this.fanta.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.usdcEth.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.fanta.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert $TRDL - ETH", async function () {
      await this.strudelEth.transfer(this.fantasticMaker.address, getBigNumber(1))
      await this.fantasticMaker.convert(this.strudel.address, this.weth.address)
      expect(await this.fanta.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.strudelEth.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.fanta.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert USDC - FANTA", async function () {
      await this.fantaUSDC.transfer(this.fantasticMaker.address, getBigNumber(1))
      await this.fantasticMaker.convert(this.usdc.address, this.fanta.address)
      expect(await this.fanta.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.fantaUSDC.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.fanta.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert using standard ETH path", async function () {
      await this.daiEth.transfer(this.fantasticMaker.address, getBigNumber(1))
      await this.fantasticMaker.convert(this.dai.address, this.weth.address)
      expect(await this.fanta.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.fanta.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts MIC/USDC using more complex path", async function () {
      await this.micUSDC.transfer(this.fantasticMaker.address, getBigNumber(1))
      await this.fantasticMaker.setBridge(this.usdc.address, this.fanta.address)
      await this.fantasticMaker.setBridge(this.mic.address, this.usdc.address)
      await this.fantasticMaker.convert(this.mic.address, this.usdc.address)
      expect(await this.fanta.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.fanta.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/USDC using more complex path", async function () {
      await this.daiUSDC.transfer(this.fantasticMaker.address, getBigNumber(1))
      await this.fantasticMaker.setBridge(this.usdc.address, this.fanta.address)
      await this.fantasticMaker.setBridge(this.dai.address, this.usdc.address)
      await this.fantasticMaker.convert(this.dai.address, this.usdc.address)
      expect(await this.fanta.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.daiUSDC.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.fanta.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/MIC using two step path", async function () {
      await this.daiMIC.transfer(this.fantasticMaker.address, getBigNumber(1))
      await this.fantasticMaker.setBridge(this.dai.address, this.usdc.address)
      await this.fantasticMaker.setBridge(this.mic.address, this.dai.address)
      await this.fantasticMaker.convert(this.dai.address, this.mic.address)
      expect(await this.fanta.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.daiMIC.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.fanta.balanceOf(this.bar.address)).to.equal("1200963016721363748")
    })

    // it("reverts if it loops back", async function () {
    //   await this.daiMIC.transfer(this.fantasticMaker.address, getBigNumber(1))
    //   await this.fantasticMaker.setBridge(this.dai.address, this.mic.address)
    //   await this.fantasticMaker.setBridge(this.mic.address, this.dai.address)
    //   await expect(this.fantasticMaker.convert(this.dai.address, this.mic.address)).to.be.reverted
    // })

    it("reverts if caller is not EOA", async function () {
      await this.fantaEth.transfer(this.fantasticMaker.address, getBigNumber(1))
      await expect(this.exploiter.convert(this.fanta.address, this.weth.address)).to.be.revertedWith("FantasticMaker: must use EOA")
    })

    it("reverts if pair does not exist", async function () {
      await expect(this.fantasticMaker.convert(this.mic.address, this.micUSDC.address)).to.be.revertedWith("FantasticMaker: Invalid pair")
    })

    it("reverts if no path is available", async function () {
      await this.micUSDC.transfer(this.fantasticMaker.address, getBigNumber(1))
      await expect(this.fantasticMaker.convert(this.mic.address, this.usdc.address)).to.be.revertedWith("FantasticMaker: Cannot convert")
      expect(await this.fanta.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.fantasticMaker.address)).to.equal(getBigNumber(1))
      expect(await this.fanta.balanceOf(this.bar.address)).to.equal(0)
    })
  })

  describe("convertMultiple", function () {
    it("should allow to convert multiple", async function () {
      await this.daiEth.transfer(this.fantasticMaker.address, getBigNumber(1))
      await this.fantaEth.transfer(this.fantasticMaker.address, getBigNumber(1))
      await this.fantasticMaker.convertMultiple([this.dai.address, this.fanta.address], [this.weth.address, this.weth.address])
      expect(await this.fanta.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.fantasticMaker.address)).to.equal(0)
      expect(await this.fanta.balanceOf(this.bar.address)).to.equal("3186583558687783097")
    })
  })
})
