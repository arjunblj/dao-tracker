import { fetchDAOStackDAOs } from './daostack'
import { fetchBespokeDAOs } from './bespoke-DAOs'
// import { fetchAragonDAOs } from './aragon'
import { initEthersProvider, fetchTokenList, fetchTokenBalances } from './helpers'

async function main() {
  const provider = initEthersProvider()

  const { tokens } = await fetchTokenList()
  // const daoStackDAOs = await fetchDAOStackDAOs()
  //
  // const daoBalances = await fetchTokenBalances(provider, daoStackDAOs, tokens)
  // console.log(daoBalances.filter(balance => Object.keys(balance.tokenHoldings).length > 1))

  const bespokeDAOs = await fetchBespokeDAOs()
  const daoBalances = await fetchTokenBalances(provider, bespokeDAOs, tokens)

  console.log(daoBalances)
}

main()
