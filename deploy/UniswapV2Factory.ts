import { DeployFunction } from "hardhat-deploy/types"
// import { bytecode, abi } from '../deployments/localhost/UniswapV2Factory.json'

const func: DeployFunction = async ({ deployments: { deploy }, getNamedAccounts }) => {
  const { deployer, dev } = await getNamedAccounts()

  await deploy("UniswapV2Factory", {
    // contract: {
    // abi,
    // bytecode,
    // },
    from: deployer,
    args: [dev],
    log: true,
    deterministicDeployment: false,
  })
}

export default func
func.tags = ["UniswapV2Factory", "AMM"]
