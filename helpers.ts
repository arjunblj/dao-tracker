import 'isomorphic-fetch'
import TokenAmount from 'token-amount'
import { Contract, Provider } from 'ethers-multicall'
import { ethers } from 'ethers'

export function initEthersProvider() {
  const provider = new ethers.providers.InfuraProvider('mainnet', process.env.INFURA_KEY)

  return new Provider(provider, parseInt(process.env.CHAIN_ID))
}

export async function fetchTokenList() {
  const tokenSource = 'https://defiprime.com/defiprime.tokenlist.json'
  return fetch(tokenSource).then(data => data.json())
}

export async function fetchTokenBalances(provider, daoList, tokenList) {
  const daos = await generateContractFunctionList(provider, daoList, tokenList)

  const daoBalances = []

  return Promise.all(
    daos.map(async ({ daoName, daoAddress, balanceMultiCall }) => {
      const tokenHoldings = {}

      const resp = await provider.all(balanceMultiCall)

      resp.map((resp, index) => {
        const { _hex } = resp

        if (index == 0) {
          tokenHoldings['ETH'] = convertToNumber(resp, 18)
        } else if (_hex != '0x00') {
          const { name, decimals, symbol } = tokenList[index]
          tokenHoldings[symbol] = convertToNumber(resp, decimals)
        }
      })

      daoBalances.push({
        daoName,
        daoAddress,
        tokenHoldings
      })
    })
  ).then(() => daoBalances)
}

const convertToNumber = (bigNum, decimals) => {
  return new TokenAmount(bigNum, decimals).format({ commify: true })
}

const generateContractFunctionList = async (provider, daoList, tokenList) => {
  const daoFunctionCallMap = []

  daoList.map(({ daoName, daoAddress }) => {
    const multicallRequests = []

    // Handle ETH
    const ethBalanceCall = multicallRequests.push(provider.getEthBalance(daoAddress))

    tokenList.map(async ({ address: tokenAddress }) => {
      const abi = ['function balanceOf(address _owner) public view returns (uint256 balance)']
      const tokenContract = new Contract(tokenAddress, abi)

      multicallRequests.push(tokenContract.balanceOf(daoAddress))
    })

    daoFunctionCallMap.push({
      daoName,
      daoAddress,
      balanceMultiCall: multicallRequests
    })
  })

  return daoFunctionCallMap
}
