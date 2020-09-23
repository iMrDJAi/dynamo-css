import './demo.scss' //Style

window.dc = new DynamoCSS()

dc.registerFunction('colors', v => {
    const regex = /--color-(.{6})/
    if (v.match(regex)) return "#" + /--color-(.{6})/.exec(v)[1]
})

dc.registerFunction('blurple', d => {
    if (d === "--blurple") {
        return "#7289DA"
    }
})
