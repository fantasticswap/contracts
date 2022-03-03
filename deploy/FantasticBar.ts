import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async ({ deployments: { deploy, get: getDeployment }, getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts()

  const fanta = await getDeployment("FantasticToken")

  await deploy("FantasticBar", {
    from: deployer,
    args: [fanta.address],
    log: true,
    deterministicDeployment: false,
  })
}

export default func
func.tags = ["FantasticBar"]
func.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "FantasticToken"]
