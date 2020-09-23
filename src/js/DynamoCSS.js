export default class DynamoCSS {
    constructor() {
        this.cssVariables = []
        this.registerdFunctions = {}
        this.scanCss(document)
        var that = this

        var attachShadow = HTMLElement.prototype.attachShadow
        HTMLElement.prototype.attachShadow = function (option) {
            var sh = attachShadow.call(this, option)
            that.observe(sh)
            return sh
        }

        if (ShadowRoot.prototype.hasOwnProperty('adoptedStyleSheets')) {
            var adoptedStyleSheetsSetterShadowRoot = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, 'adoptedStyleSheets').set
            Object.defineProperty(ShadowRoot.prototype, "adoptedStyleSheets", {
                set: function (styleSheets) {
                    var cssRules = []
                    for (let styleSheet of styleSheets) {
                        try {
                            styleSheet.cssRules
                            for (let cssRule of styleSheet.cssRules) {
                                if (cssRule.cssText) cssRules.push(cssRule.cssText)
                            } 
                        } catch {
                            console.warn('Cannot access to stylesheet content loaded from a Cross-Domain')
                        }
                    }
                    that.extractCssVariables(cssRules)
                    return adoptedStyleSheetsSetterShadowRoot.call(this, styleSheets)
                }
            })
        }

        if (Document.prototype.hasOwnProperty('adoptedStyleSheets')) {
            var adoptedStyleSheetsSetterDocument = Object.getOwnPropertyDescriptor(Document.prototype, 'adoptedStyleSheets').set
            Object.defineProperty(Document.prototype, "adoptedStyleSheets", {
                set: function (styleSheets) {
                    var cssRules = []
                    for (let styleSheet of styleSheets) {
                        try {
                            styleSheet.cssRules
                            for (let cssRule of styleSheet.cssRules) {
                                if (cssRule.cssText) cssRules.push(cssRule.cssText)
                            } 
                        } catch {
                            console.warn('Cannot access to stylesheet content loaded from a Cross-Domain')
                        }
                    }
                    that.extractCssVariables(cssRules)
                    return adoptedStyleSheetsSetterDocument.call(this, styleSheets)
                }
            })
        }
    }

    scanCss(parent) {
        if (parent instanceof Document || parent instanceof ShadowRoot || parent instanceof Element) {
            //CSS Rules
            var cssRules = []

            //Style Attributes
            var elements = Array.from(parent.querySelectorAll('*'))
            if (parent instanceof Element) elements.push(parent)
            
            for (let element of elements) {
                if (element.style.cssText) cssRules.push(element.style.cssText)
                if (element.shadowRoot) this.scanCss(element.shadowRoot)
            }

            //CSS Classes
            if (parent instanceof Document || parent instanceof ShadowRoot) {
                if (!parent.adoptedStyleSheets) parent.adoptedStyleSheets = []
                for (let styleSheet of [...parent.styleSheets, ...parent.adoptedStyleSheets]) {
                    try {
                        styleSheet.cssRules
                        for (let cssRule of styleSheet.cssRules) {
                            if (cssRule.cssText) cssRules.push(cssRule.cssText)
                        } 
                    } catch {
                        console.warn('Cannot access to stylesheet content loaded from a Cross-Domain')
                    }
                }
                //Observe DOM/ShadowDOM Style Updates
                this.observe(parent)
            }

            //Extract CSS Variables From CSS Rules
            this.extractCssVariables(cssRules)
        }
    }

    extractCssVariables(cssRules) {
        const oldLength = this.cssVariables.length
        //CSS Variables
        var matches = cssRules.toString().match(/(?:var\()(?: *)(--.+?)(?: *)?(?:,|\))/g)
        if (matches) {
            this.cssVariables = [
                //Prevent Duplication
                ...new Set(
                    [
                        //Remove The Unwanted Parts: => var( <= --css-variable => ...) <=
                        ...matches.map(m => m.replace(/^(?:var\()(?: *)/g, '').replace(/(?: *)?(?:,|\))$/g, '')),
                        //Include Old CSS Variables
                        ...this.cssVariables
                    ]
                )
            ]
        }
        const newLength = this.cssVariables.length
        if (oldLength !== newLength) this.executeCssVariables()
    }

    observe(DOM) {
        if (!DOM.observed && (DOM instanceof Document || DOM instanceof ShadowRoot)) {
            const observer = new MutationObserver(mutationsList => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        this.extractCssVariables(mutation.target.style.cssText)
                    } else if (mutation.type === 'childList') {
                        Array.from(mutation.addedNodes)
                        .forEach(element => {
                            if (element.nodeName === 'STYLE' && element.sheet.cssRules[0]) {
                                var cssRules = []
                                for (let cssRule of element.sheet.cssRules) {
                                    if (cssRule.cssText) cssRules.push(cssRule.cssText)
                                }
                                this.extractCssVariables(cssRules)
                            } else {
                                this.scanCss(element)
                            }
                        })
                    } else if (mutation.type === 'characterData' && mutation.target.parentNode.nodeName === "STYLE" && mutation.target.parentNode.sheet.cssRules[0]) {
                        var cssRules = []
                        for (let cssRule of mutation.target.parentNode.sheet.cssRules) {
                            if (cssRule.cssText) cssRules.push(cssRule.cssText)
                        }
                        this.extractCssVariables(cssRules)
                    }
                }
            })
            observer.observe(DOM, { attributes: true, attributeFilter: ['style'], childList: true, subtree: true, characterData: true })
            DOM.observed = true
        }
    }

    async executeCssVariables() {
        for (let fun of Object.values(this.registerdFunctions)) {
            for (let cssVariable of this.cssVariables.filter(v => !fun.executedCssVariables.includes(v))) {
                try {
                    const value = await fun(cssVariable)
                    if (value) document.documentElement.style.setProperty(cssVariable, value)
                    fun.executedCssVariables.push(cssVariable)
                } catch(e) {
                    console.error(e)
                }
            }
        }
    }

    registerFunction(id, fun) {
        if (id && typeof id === "string") {
            if (fun instanceof Function) {
                this.registerdFunctions[id] = fun
                this.registerdFunctions[id].unregister = () => {
                    delete this.registerdFunctions[id]
                }
                this.registerdFunctions[id].executedCssVariables = []
                this.executeCssVariables()
                return this.registerdFunctions[id]
            } else {
                console.error('That\'s not a function!')
            }
        } else {
            console.error('Invalid function id!')
        }
    }

    unregisterFunction(id) {
        if (id && typeof id === "string") {
            if (this.registerdFunctions[id]) {
                delete this.registerdFunctions[id]
                return true
            } else {
                console.error('Cannot find that function!')
            }
        } else {
            console.error('Invalid function id!')
        }
    }
}