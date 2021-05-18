import 'isomorphic-fetch'
import TokenAmount from 'token-amount'
import { toBN } from 'web3-utils'
const Web3 = require('web3')

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER))

const getTokens = async () => {
  const tokenSource = 'https://defiprime.com/defiprime.tokenlist.json'
  return fetch(tokenSource).then(data => data.json())
}

const convertToNumber = ({ hex = null, decimals = null, wei = null }) => {
  if (wei) {
    return TokenAmount.format(wei, 18, { commify: true })
  }

  return new TokenAmount(toBN(hex), decimals).format({ commify: true })
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

    // Handle ETH
    batch.add(web3.eth.getBalance.request(id))

    batchedRequests.push({
      daoName: name,
      daoAddress: id,
      balanceRequests: batch
    })
  })

  return batchedRequests
}

export { convertToNumber, getTokens, generateContractFunctionList }
