import * as bluetooth from "./bluetooth"
import * as proxy from "./proxy"
import * as state from "./state"

import * as events from "./ui/mapping/events"
import * as index from "./ui/mapping/index"
import * as utils from "./ui/mapping/utils"
import * as rendering from "./ui/rendering"

const GydraLEDs = {
	...bluetooth,
	...proxy,
	...state,
	...events,
	...index,
	...utils,
	...rendering,
}

export { TMap } from "./ui/mapping/utils"

export default GydraLEDs
