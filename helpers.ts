import { toBN } from 'web3-utils'
import 'isomorphic-fetch'
const Web3 = require('web3')

// Fetch Uniswap token list from Zapper
const getTokens = async () => {
  const tokenSource = 'https://zapper.fi/api/token-list'
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

const generateContractFunctionList = async ({ tokens }) => {
  const web3 = new Web3(
    new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/e1dc9ec1da5f4c80a11f4bd700fa751e')
  )

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

  const batch = new web3.BatchRequest()

  tokens.map(async ({ address: tokenAddress, symbol, decimals }) => {
    const contract = new web3.eth.Contract(abi)
    contract.options.address = tokenAddress
    batch.add(contract.methods.balanceOf('0x519b70055af55a007110b4ff99b0ea33071c720a').call.request({}))
  })

  return batch
}

export { convertToNumber, getTokens, generateContractFunctionList }
