import { constants, utils } from "ethers"
import { task, types } from "hardhat/config"

const { AddressZero } = constants
const { isAddress } = utils

type Args = {
  chef: string
  pid: number
  p: number
}

task<Args>("setFarm", "Set a farm", async (args, { ethers: { getContractAt } }) => {
  if (!isAddress(args.chef)) {
    console.error("invalid chef address")
    return
  }

  const chef = await getContractAt("FantasticChef", args.chef)
  try {
    const tx = await chef.set(args.pid, args.p, AddressZero, false)
    console.log("tx hash:", tx.hash)
    await tx.wait()
  } catch (error) {
    console.error(error)
  }
})
  .addParam("chef", "FantasticChef address", "", types.string)
  .addParam("pid", "", "", types.int)
  .addParam("p", "FantasticSwap LP Token point", 0, types.int)