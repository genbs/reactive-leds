# GydraLEDs Lib

connect to server:

```ts
gydraLEDs.begin("ws://localhost:8080")
```

you can watch the state:

```ts
type GydraLEDState = {
	stripes: TStripe[]
	clients: TNetClient[]
	connected: boolean
}

const unbind = gydraLEDs.onChangeState(state => {})
```

watch canvas and send it to server:

```ts
return gydraLEDs.watch(globalCanvas, [gridWidth, gridHeight])
```
