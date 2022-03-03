import { DeployFunction } from "hardhat-deploy/types"
import { ChainId, FANTA_ADDRESS, USDC_ADDRESS } from "@fantasticswap/core-sdk"
import { FantasticIDO, FantasticToken, UniswapV2Factory, UniswapV2Router02 } from "../types"

const func: DeployFunction = async ({ deployments, ethers, getChainId, getNamedAccounts }) => {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()
  const [, , use1, use2, use3, use4] = await ethers.getSigners()

  const chainId = Number(await getChainId())

  let fantaAddress: string, usdcAddress: string
  let pairAddress: string = ""

  if (chainId === ChainId.HARDHAT) {
    fantaAddress = (await deployments.get("FantasticToken")).address
    usdcAddress = (await deployments.get("USDCMock")).address
  } else if (chainId in FANTA_ADDRESS) {
    fantaAddress = FANTA_ADDRESS[chainId]
    usdcAddress = USDC_ADDRESS[chainId]
  } else {
    throw Error("No FANTA!")
  }

  if (chainId === ChainId.HARDHAT) {
    const factory: UniswapV2Factory = await ethers.getContract("UniswapV2Factory")
    const tx = await factory.createPair(fantaAddress, usdcAddress)
    await tx.wait()
    pairAddress = await factory.getPair(fantaAddress, usdcAddress)
  }

  if (!pairAddress) throw Error("No Pair!")

  await deploy("FantasticIDO", {
    from: deployer,
    args: [fantaAddress, usdcAddress, pairAddress],
    log: true,
    deterministicDeployment: false,
  })

  if (chainId === ChainId.HARDHAT) {
    const ido: FantasticIDO = await ethers.getContract("FantasticIDO")
    const fanta: FantasticToken = await ethers.getContract("FantasticToken")
    await (await fanta.mint(ido.address, ethers.utils.parseUnits("7500000", 18))).wait()

    await (await ido.whiteListBuyers([use1.address, use2.address, use3.address, use4.address])).wait()

    const start = parseInt("" + Date.now() / 1000) + 5
    const salePrice = ethers.utils.parseUnits("0.02", 6)
    await (await ido.initialize(ethers.utils.parseUnits("5000000", 18), salePrice, 0, start)).wait()
  }
}

export default func
func.tags = ["FantasticIDO"]
func.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "FantasticToken", "USDCMock"]
