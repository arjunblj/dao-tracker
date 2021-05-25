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
      if (Array.isArray(balanceMultiCall)) {
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
      } else {
        const tokenHoldings = {}

        const [ethBalances, tokenBalances] = await Promise.all([
          await provider.all(balanceMultiCall['ethBalanceByAddress']),
          await Promise.all(
            balanceMultiCall['balanceCallsByAddress'].map(async tokenCall => await provider.all(tokenCall))
          )
        ])

        ethBalances.map(ethBalance => {
          tokenHoldings['ETH'] = tokenHoldings['ETH']
            ? tokenHoldings['ETH'] + convertToNumber(ethBalance, 18)
            : convertToNumber(ethBalance, 18)
        })

        tokenBalances.map(addressBalances => {
          Object.keys(addressBalances).map(key => {
            const resp = addressBalances[key]
            const { _hex } = resp

            if (_hex != '0x00') {
              const { name, decimals, symbol } = tokenList[key]
              tokenHoldings[symbol] = tokenHoldings[symbol]
                ? tokenHoldings[symbol] + convertToNumber(resp, decimals) + convertToNumber(resp, decimals)
                : convertToNumber(resp, decimals)
            }
          })
        })

        daoBalances.push({
          daoName,
          daoAddress,
          tokenHoldings
        })
      }
    })
  ).then(() => daoBalances)
}

const convertToNumber = (bigNum, decimals) => {
  return new TokenAmount(bigNum, decimals).format({ commify: true })
}

const getETHBalanceCall = (provider, address) => provider.getEthBalance(address)

const getERC20BalanceCall = (provider, address, tokenAddress) => {
  const abi = ['function balanceOf(address _owner) public view returns (uint256 balance)']
  const tokenContract = new Contract(tokenAddress, abi)

  return tokenContract.balanceOf(address)
}

const generateContractFunctionList = async (provider, daoList, tokenList) => {
  const daoFunctionCallMap = []

  daoList.map(({ daoName, daoAddress }) => {
    const multicallRequests = []

    // Ugly hack for a DAO with multiple addresses to track.
    if (Array.isArray(daoAddress)) {
      const ethBalanceByAddress = []
      const balanceCallsByAddress = []

      daoAddress.map(address => {
        const tokenBalanceCalls = []
        tokenList.map(async ({ address: tokenAddress }) =>
          tokenBalanceCalls.push(getERC20BalanceCall(provider, address, tokenAddress))
        )

        ethBalanceByAddress.push(getETHBalanceCall(provider, address))
        balanceCallsByAddress.push(tokenBalanceCalls)
      })

      daoFunctionCallMap.push({
        daoName,
        daoAddress,
        balanceMultiCall: {
          ethBalanceByAddress: ethBalanceByAddress,
          balanceCallsByAddress: balanceCallsByAddress
        }
      })
    } else {
      // Handle ETH
      const ethBalanceCall = getETHBalanceCall(provider, daoAddress)

      tokenList.map(async ({ address: tokenAddress }) =>
        multicallRequests.push(getERC20BalanceCall(provider, daoAddress, tokenAddress))
      )

      daoFunctionCallMap.push({
        daoName,
        daoAddress,
        balanceMultiCall: multicallRequests
      })
    }
  })

  return daoFunctionCallMap
}
