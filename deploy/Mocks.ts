import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async ({
  ethers: {
    utils: { parseUnits },
  },
  deployments: { deploy },
  getNamedAccounts,
}) => {
  const { deployer, user } = await getNamedAccounts()

  await deploy("WEVMOSMock", {
    from: deployer,
    log: true,
  })

  await deploy("USDCMock", {
    from: user,
    args: [parseUnits("1000000", 18)],
    log: true,
  })
}

export default func
func.tags = ["Mocks"]
func.skip = ({ getChainId }) =>
  new Promise<boolean>(async (resolve, reject) => {
    try {
      const chainId = await getChainId()
      resolve(chainId !== "31337")
    } catch (error) {
      reject(error)
    }
  })
