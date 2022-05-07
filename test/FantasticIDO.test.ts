import { expect } from "chai"
import { ethers } from "hardhat"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { duration, increase, latest } from "./utilities"
import { FantasticIDO, FantasticToken, UniswapV2Factory, UniswapV2Pair, USDCMock } from "../types"

const {
  getContractAt,
  getContractFactory,
  utils: { parseUnits },
  constants: { WeiPerEther },
} = ethers

describe("FantasticIDO", async function () {
  let factory: UniswapV2Factory
  let fanta: FantasticToken
  let usdc: USDCMock
  let pair: UniswapV2Pair
  let ido: FantasticIDO
  let deployer: SignerWithAddress
  let lpAddress: string

  const totalAmount = parseUnits("20000000")
  const mintAmount = parseUnits("30000000")

  const usdcAmount = parseUnits("400000", 6)
  const salePrice = parseUnits("0.02", 6)

  beforeEach(async function () {
    deployer = await ethers.getNamedSigner("deployer")
    factory = (await (await getContractFactory("UniswapV2Factory")).deploy(deployer.address)) as UniswapV2Factory
    fanta = (await (await getContractFactory("FantasticToken")).deploy()) as FantasticToken
    usdc = (await (await getContractFactory("USDCMock")).deploy(usdcAmount)) as USDCMock

    await (await factory.createPair(fanta.address, usdc.address)).wait()
    lpAddress = await factory.getPair(fanta.address, usdc.address)
    pair = await getContractAt("UniswapV2Pair", lpAddress)

    ido = (await (
      await getContractFactory("FantasticIDO")
    ).deploy(fanta.address, usdc.address, lpAddress)) as FantasticIDO

    await (await fanta.mint(ido.address, mintAmount)).wait()

    await (await ido.whiteListBuyers([deployer.address])).wait()

    const start = (await latest()).add(duration.hours(8))

    await (await ido.initialize(totalAmount, salePrice, duration.days(2), start)).wait()

    await increase(duration.hours(8))

    await (await usdc.approve(ido.address, usdcAmount)).wait()
  })

  describe("withdraw", async function () {
    it("initialized", async function () {
      ;(await ido.purchaseFANTA(parseUnits("100000", 6))).wait()

      await (await ido.cancel()).wait()
      await (await ido.withdraw()).wait()

      const usdcBalance = await usdc.balanceOf(deployer.address)
      expect(usdcBalance).to.equal(usdcAmount)
    })
  })

  describe("finalize", async function () {
    it("soft cap", async function () {
      ;(await ido.purchaseFANTA(parseUnits("100000", 6))).wait()

      await (await ido.finalize()).wait()

      const fantaBalance = await fanta.balanceOf(ido.address)
      expect(fantaBalance).to.equal(mintAmount.sub(WeiPerEther.mul(2_500_000)))

      const [reserve0, reserve1] = await pair.getReserves()
      const token0Address = await pair.token0()

      const price =
        token0Address === fanta.address
          ? reserve1.div(reserve0.div(WeiPerEther))
          : reserve0.div(reserve1.div(WeiPerEther))

      expect(price).to.equal(salePrice.mul(2))
    })

    it("less than soft top", async function () {
      ;(await ido.purchaseFANTA(parseUnits("100000", 6).sub(1))).wait()

      await expect(ido.finalize()).to.be.revertedWith("at least ten fantas to be sold")
    })
  })
})
