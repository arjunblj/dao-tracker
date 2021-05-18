import { toBN } from 'web3-utils'
import 'isomorphic-fetch'
const Web3 = require('web3')

const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/e1dc9ec1da5f4c80a11f4bd700fa751e'))

// Fetch Uniswap token list from Zapper
const getTokens = async () => {
  const tokenSource = 'https://defiprime.com/defiprime.tokenlist.json'
  return fetch(tokenSource).then(data => data.json())
}

const convertToNumber = (hex, decimals) => {
  const balance = toBN(hex)
  let balanceDecimal = balance
  if (decimals && balance.toLocaleString() === '0' && decimals < 20) {
    balanceDecimal = balance.div(toBN(10 ** decimals))
  }

  return balanceDecimal.toLocaleString()
}

const generateContractFunctionList = async (tokenList, daoList) => {
  const batchedRequests = []

  daoList.map(({ name, id }) => {
    const batch = new web3.BatchRequest()

    const abi = [
      {
        constant: true,
        inputs: [
          {
            name: '_owner',
            type: 'address'
          }
        ],
        name: 'balanceOf',
        outputs: [
          {
            name: 'balance',
            type: 'uint256'
          }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
      }
    ]

    tokenList.map(async ({ address: tokenAddress, symbol, decimals }) => {
      const contract = new web3.eth.Contract(abi)

      contract.options.address = tokenAddress
      batch.add(contract.methods.balanceOf(id).call.request({}))
    })

    batchedRequests.push({
      daoName: name,
      daoAddress: id,
      balanceRequests: batch
    })
  })

  return batchedRequests
}

export { convertToNumber, getTokens, generateContractFunctionList }
