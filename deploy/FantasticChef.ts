import { DeployFunction } from "hardhat-deploy/types"
import { ChainId, FANTA_ADDRESS } from "@fantasticswap/core-sdk"

const func: DeployFunction = async ({ deployments, ethers, getChainId, getNamedAccounts }) => {
  const { deploy } = deployments
  const { deployer, dev } = await getNamedAccounts()

  const chainId = Number(await getChainId())

  let fantaAddress: string

  if (chainId === ChainId.HARDHAT) {
    fantaAddress = (await deployments.get("FantasticToken")).address
  } else if (chainId in FANTA_ADDRESS) {
    fantaAddress = FANTA_ADDRESS[chainId]
  } else {
    throw Error("No FANTA!")
  }

  await deploy("FantasticChef", {
    from: deployer,
    args: [fantaAddress, dev],
    log: true,
    deterministicDeployment: false,
  })

  const chef = await ethers.getContract("FantasticChef")
  await (await chef.setFantaPerSecond(ethers.utils.parseUnits("0.1", 18))).wait()
  if ((await chef.owner()) !== dev) {
    console.log("Transfer ownership of FantasticChef to dev")
    await (await chef.transferOwnership(dev, true, false)).wait()
  }
}

export default func
func.tags = ["FantasticChef"]
func.dependencies = ["FantasticToken"]
