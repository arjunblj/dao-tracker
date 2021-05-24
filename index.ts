import { fetchDAOStackDAOs } from './daostack'
import { fetchAragonDAOs } from './aragon'
import { initEthersProvider, fetchTokenList, fetchTokenBalances } from './helpers'

async function main() {
  const provider = initEthersProvider()

  const { tokens } = await fetchTokenList()
  const daoStackDAOs = await fetchDAOStackDAOs()

  const daoBalances = await fetchTokenBalances(provider, daoStackDAOs, tokens)

  console.log(daoBalances.filter(balance => Object.keys(balance.tokenHoldings).length > 1))
}

main()
