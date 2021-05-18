import { fetchDAOStackDAOs } from './daostack'
import { fetchAragonDAOs } from './aragon'
import { getTokens, convertToNumber, generateContractFunctionList } from './helpers'

async function main() {
  const daoStackDAOs = await fetchDAOStackDAOs()
  const daoBalances = await getBalances(daoStackDAOs)

  console.log(daoBalances.filter(balance => Object.keys(balance.tokenHoldings).length > 0))

  // const aragonDAOs = await fetchAragonDAOs()
  // console.log(aragonDAOs)
}

// Get balances for a list of DAOs.
// daoList = [{ name: '', id: '0x...'}]
const getBalances = async daoList => {
  const { tokens } = await getTokens()

  const daos = await generateContractFunctionList(tokens, daoList)

  const daoBalances = []

  await Promise.all(
    daos.map(async ({ daoName, daoAddress, balanceRequests }) => {
      const { response } = await balanceRequests.execute()

      const tokenHoldings = {}

      response.map((resp, index) => {
        if (resp) {
          const { _hex } = resp

          if (_hex && _hex != '0x00') {
            const { name, decimals, symbol } = tokens[index]
            tokenHoldings[symbol] = convertToNumber(_hex, decimals)
          } else if (resp != '0') {
            tokenHoldings['ETH'] = resp
          }
        }
      })

      daoBalances.push({
        daoName,
        daoAddress,
        tokenHoldings
      })
    })
  )

  return daoBalances
}

main()
