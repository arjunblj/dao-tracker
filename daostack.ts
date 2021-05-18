import { request, gql } from 'graphql-request'

const daoStackSubgraph = 'https://api.thegraph.com/subgraphs/name/daostack/alchemy'

const query = gql`
  {
    daos(orderBy: reputationHoldersCount, orderDirection: desc) {
      id
      name
      reputationHoldersCount
      nativeToken {
        id
      }
    }
  }
`

const fetchDAOStackDAOs = async () => request(daoStackSubgraph, query).then(data => data.daos)

export { fetchDAOStackDAOs }
