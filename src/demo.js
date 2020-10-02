import './demo.scss' //Style

window.dc = new DynamoCSS()

console.log(dc)

var fun1 = dc.registerFunction('blurple', (v, setValue, getVariable) => {
    if (v === "--blurple") setValue("#7289DA") 
})

console.log(fun1)

var fun2 = dc.registerFunction('color', (v, setValue, getVariable) => {
    const variable = dc.parseVariable(v)
    if (variable && variable.name === 'color') {
        if (variable.properties.hex && variable.properties.hex.match(/^[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3}$/)) {
            setValue("#" + variable.properties.hex)
        }
    }
})

console.log(fun2)