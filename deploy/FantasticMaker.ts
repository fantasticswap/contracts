import { DeployFunction } from "hardhat-deploy/types"
import { ChainId, WETH9_ADDRESS as WETH_ADDRESS } from "@fantasticswap/core-sdk"

const func: DeployFunction = async ({ deployments, ethers, getNamedAccounts, getChainId }) => {
  const { deploy } = deployments
  const { deployer, dev } = await getNamedAccounts()

  const chainId = Number(await getChainId())

  const factory = await ethers.getContract("UniswapV2Factory")
  const fanta = await ethers.getContract("FantasticToken")
  const bar = await ethers.getContract("FantasticBar")

  let wevmosAddress: string

  if (chainId === ChainId.HARDHAT) {
    wevmosAddress = (await deployments.get("WEVMOSMock")).address
  } else if (chainId in WETH_ADDRESS) {
    wevmosAddress = WETH_ADDRESS[chainId]
  } else throw Error("No WETH!")

  await deploy("FantasticMaker", {
    from: deployer,
    args: [factory.address, bar.address, fanta.address, wevmosAddress],
    log: true,
    deterministicDeployment: false,
  })

  const maker = await ethers.getContract("FantasticMaker")
  if ((await maker.owner()) !== dev) {
    console.log("Setting maker owner")
    await (await maker.transferOwnership(dev, true, false)).wait()
  }
}

export default func
func.tags = ["FantasticMaker"]
func.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "FantasticBar", "FantasticToken", "Mocks"]
