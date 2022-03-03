import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async ({ deployments: { deploy }, getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts()

  await deploy("Multicall2", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
  })
}

export default func
func.tags = ["Multicall2"]
