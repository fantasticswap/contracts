import { DeployFunction } from "hardhat-deploy/types"
import { ChainId, WEVMOS_ADDRESS } from "@fantasticswap/core-sdk"

const func: DeployFunction = async ({ deployments: { deploy, get: getDeployment }, getChainId, getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts()

  const chainId = Number(await getChainId())

  let wevmosAddress: string
  if (chainId === ChainId.HARDHAT) {
    wevmosAddress = (await getDeployment("WEVMOSMock")).address
  } else if (chainId in WEVMOS_ADDRESS) {
    wevmosAddress = WEVMOS_ADDRESS[chainId]
  } else {
    throw Error("No WNATIVE!")
  }

  const factoryAddress = (await getDeployment("UniswapV2Factory")).address

  await deploy("UniswapV2Router02", {
    from: deployer,
    args: [factoryAddress, wevmosAddress],
    log: true,
    deterministicDeployment: false,
  })
}

export default func
func.tags = ["UniswapV2Router02", "AMM"]
func.dependencies = ["UniswapV2Factory", "Mocks"]
