import { utils } from "ethers"
import { task, types } from "hardhat/config"

import { FantasticMaker } from "../types"

const { isAddress } = utils

type Args = {
  t0: string
  t1: string
}

task<Args>("convert", "Add a farm", async (args, { ethers: { getContractAt } }) => {
  if (!isAddress(args.t0) || !isAddress(args.t1)) {
    console.error('invalid token0 or token1 address')
    return
  }

  const factory = await getContractAt("UniswapV2Factory", '0x7808fFA2536ebda596FA928Db7daAD78DF3e628b')
  console.log(await factory.feeTo())

  const maker = await getContractAt<FantasticMaker>("FantasticMaker", "0xb19815125e97c5b41CD48d2CC36D05F8E09bC0a7")
  try {
    const tx = await maker.convert(args.t0, args.t1)
    console.log("tx hash:", tx.hash)
    await tx.wait()
  } catch (error) {
    console.error(error)
  }
})
  .addParam("t0", "FantasticSwap LP Token0 address", "", types.string)
  .addParam("t1", "FantasticSwap LP Token1 address", "", types.string)
