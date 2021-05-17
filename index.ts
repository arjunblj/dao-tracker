import { connect } from '@aragon/connect'
import connectVoting from '@aragon/connect-voting'

const BLUE = '\x1b[36m'
const RESET = '\x1b[0m'

async function main() {
  const org = await connect('governance.aragonproject.eth', 'thegraph')
  const voting = await connectVoting(org.app('voting'))

  printOrganization(org)
}

function printOrganization(organization) {
  console.log('')
  console.log(' Organization')
  console.log('')
  console.log('  Location:', BLUE + organization.location + RESET)
  console.log('  Address:', BLUE + organization.address + RESET)
  console.log('')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('')
    console.error(err)
    process.exit(1)
  })
