import * as bluetooth from "./bluetooth"
import * as proxy from "./proxy"
import * as state from "./state"

import { TMap, updateStripeMap } from "./ui/mapping/utils"

const gydraLeds = {
	...proxy,
	...bluetooth,
	...state,
}

export { updateStripeMap }

export type { TMap }

export default gydraLeds
