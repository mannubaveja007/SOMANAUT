"use client"

import dynamic from "next/dynamic"

export const DynamicWeb3Provider = dynamic(
  () => import("./web3-provider").then((mod) => mod.Web3Provider),
  { ssr: false }
)
