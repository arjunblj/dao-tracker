import { getTokens, convertToNumber, generateContractFunctionList } from './helpers'
import { fetchDAOStackDAOs } from './daostack'

async function main() {
  const daoStackDAOs = await fetchDAOStackDAOs()
  const daoBalances = await getBalances(daoStackDAOs)

  console.log(daoBalances)
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

          if (_hex != '0x00') {
            const { name, decimals, symbol } = tokens[index]
            tokenHoldings[symbol] = convertToNumber(_hex, decimals)
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
