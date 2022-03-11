import { constants, utils } from "ethers"
import { task, types } from "hardhat/config"

import { FantasticChef, UniswapV2Factory } from "../types"

const { AddressZero } = constants
const { isAddress } = utils

type Args = {
  chef: string
  t0: string
  t1: string
  lp: string
  p: number
}

task<Args>("addFarm", "Add a farm", async (args, { ethers: { getContract, getContractAt } }) => {
  if (!isAddress(args.chef)) {
    console.error("invalid chef address")
    return
  }

  let lpAddress = args.lp
  if (!isAddress(lpAddress)) {
    if (!isAddress(args.t0) || !isAddress(args.t1)) {
      console.error('invalid lp or token0 or token1 address')
      return
    }
    const factory = await getContract<UniswapV2Factory>('UniswapV2Factory')
    lpAddress = await factory.getPair(args.t0, args.t1)
    if (!isAddress(lpAddress)) {
      console.error('can not get pair')
      return
    }
  }

  const chef = await getContractAt<FantasticChef>("FantasticChef", args.chef)
  try {
    const tx = await chef.add(args.p, lpAddress, AddressZero)
    console.log("tx hash:", tx.hash)
    await tx.wait()
  } catch (error) {
    console.error(error)
  }
})
  .addParam("chef", "FantasticChef address", "", types.string)
  .addParam("lp", "FantasticSwap LP Token address", "", types.string)
  .addParam("t0", "FantasticSwap LP Token0 address", "", types.string)
  .addParam("t1", "FantasticSwap LP Token1 address", "", types.string)
  .addParam("p", "FantasticSwap LP Token point", 0, types.int)