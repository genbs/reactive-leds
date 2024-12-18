import { createRoot } from "react-dom/client"
import App from "./App"

const main = document.getElementById("root")!

const root = createRoot(main)

root.render(<App />)
