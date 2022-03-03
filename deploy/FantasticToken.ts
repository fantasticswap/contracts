import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async ({ deployments: { deploy }, getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts()

  await deploy("FantasticToken", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
  })
}

export default func
func.tags = ["FantasticToken"]
func.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]
