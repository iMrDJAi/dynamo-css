export default class DynamoCSS {
    constructor() {
        this.variables = []
        this.functions = {}
        this.scan(document)
        var that = this

        var attachShadow = HTMLElement.prototype.attachShadow
        HTMLElement.prototype.attachShadow = function (option) {
            var sh = attachShadow.call(this, option)
            that.#observe(sh)
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
                            console.warn('Cannot access to stylesheet content')
                        }
                    }
                    that.#extract(cssRules)
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
                            console.warn('Cannot access to stylesheet content')
                        }
                    }
                    that.#extract(cssRules)
                    return adoptedStyleSheetsSetterDocument.call(this, styleSheets)
                }
            })
        }
    }

    scan(parent) {
        if (parent instanceof Document || parent instanceof ShadowRoot || parent instanceof Element) {
            var cssRules = []

            var elements = Array.from(parent.querySelectorAll('*'))
            if (parent instanceof Element) elements.push(parent)
            
            for (let element of elements) {
                if (element.style.cssText) cssRules.push(element.style.cssText)
                if (element.shadowRoot) this.scan(element.shadowRoot)
            }

            if (parent instanceof Document || parent instanceof ShadowRoot) {
                if (!parent.adoptedStyleSheets) parent.adoptedStyleSheets = []
                for (let styleSheet of [...parent.styleSheets, ...parent.adoptedStyleSheets]) {
                    try {
                        styleSheet.cssRules
                        for (let cssRule of styleSheet.cssRules) {
                            if (cssRule.cssText) cssRules.push(cssRule.cssText)
                        } 
                    } catch {
                        console.warn('Cannot access to stylesheet content')
                    }
                }
                this.#observe(parent)
            } else if (parent instanceof Element) {
                var styles = Array.from(parent.querySelectorAll('style'))

                for (let style of styles) {
                    for (let cssRule of style.sheet.cssRules) {
                        if (cssRule.cssText) cssRules.push(cssRule.cssText)
                    }
                }
            }

            this.#extract(cssRules)
        }
    }

    #observe(DOM) {
        if (!DOM.observer && (DOM instanceof Document || DOM instanceof ShadowRoot)) {
            const observer = new MutationObserver(mutationsList => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        this.#extract(mutation.target.style.cssText)
                    } else if (mutation.type === 'childList') {
                        Array.from(mutation.addedNodes).forEach(element => {
                            if (element.nodeName === 'STYLE' && element.sheet.cssRules[0]) {
                                var cssRules = []
                                for (let cssRule of element.sheet.cssRules) {
                                    if (cssRule.cssText) cssRules.push(cssRule.cssText)
                                }
                                this.#extract(cssRules)
                            } else {
                                this.scan(element)
                            }
                        })
                    } else if (mutation.type === 'characterData' && mutation.target.parentNode.nodeName === "STYLE" && mutation.target.parentNode.sheet.cssRules[0]) {
                        var cssRules = []
                        for (let cssRule of mutation.target.parentNode.sheet.cssRules) {
                            if (cssRule.cssText) cssRules.push(cssRule.cssText)
                        }
                        this.#extract(cssRules)
                    }
                }
            })
            observer.observe(DOM, { attributes: true, attributeFilter: ['style'], childList: true, subtree: true, characterData: true })
            DOM.observer = observer
        }
    }

    #extract(cssRules) {
        const oldLength = this.variables.length
        var matches = cssRules.toString().match(/(?:var\()(?: *)(--.+?)(?: *)?(?:,|\))/g)
        if (matches) {
            this.variables = [
                ...new Set(
                    [
                        ...matches.map(m => m.replace(/^(?:var\()(?: *)/g, '').replace(/(?: *)?(?:,|\))$/g, '')),
                        ...this.variables
                    ]
                )
            ]
        }
        const newLength = this.variables.length
        if (oldLength !== newLength) this.#executeAll()
    }

    #executeAll() {
        for (let cssVariable of this.variables) {
            for (let fun of Object.values(this.functions).filter(f => !f.executedVariables.includes(cssVariable))) {
                this.execute(fun, cssVariable)
            }
        }
    }

    execute(fun, cssVariable) {
        try {
            fun.relativeVariables = []
            const setValue = value => {
                return this.setVariable(cssVariable, value)
            }
            const getVariable = variable => {
                if (variable) {
                    if (!fun.relativeVariables.includes(variable)) fun.relativeVariables.push(variable)
                    return this.getVariable(variable)
                } else return false
            }
            fun(cssVariable, setValue, getVariable)
            if (!fun.executedVariables.includes(cssVariable)) fun.executedVariables.push(cssVariable)
        } catch(e) {
            console.error(e)
        }
    }

    setVariable(variable, value) {
        const element = document.querySelector(':root')
        element.style.setProperty(variable, value)
        for (let fun of Object.values(this.functions).filter(fun => fun.relativeVariables.includes(variable))) {
            this.execute(fun, variable)
        }
        return true
    }

    getVariable(variable) {
        const element = document.querySelector(':root')
        return getComputedStyle(element).getPropertyValue(variable)
    }

    registerFunction(id, fun) {
        if (id && typeof id === "string") {
            if (fun instanceof Function) {
                this.functions[id] = fun
                this.functions[id].unregister = () => {
                    delete this.functions[id]
                }
                this.functions[id].executedVariables = []
                this.#executeAll()
                return this.functions[id]
            } else {
                console.error('That\'s not a function!')
            }
        } else {
            console.error('Invalid function id!')
        }
    }

    unregisterFunction(id) {
        if (id && typeof id === "string") {
            if (this.functions[id]) {
                delete this.functions[id]
                return true
            } else {
                console.error('Cannot find that function!')
            }
        } else {
            console.error('Invalid function id!')
        }
    }

    parseVariable(v) {
        const fullRegex = /^--((?:[^\W_](?:-[^\W_])?)+)(?:_((?:[^\W_](?:-[^\W_])?)+)--((?:[^\W_](?:-[^\W_])?)+))*/
        const valuesRegex = /(?:_((?:[^\W_](?:-[^\W_])?)+)--((?:[^\W_](?:-[^\W_])?)+))/g
        var fullMatch = v.match(fullRegex)
        if (fullMatch) {
            var variable = {
                string: fullMatch[0],
                name: fullMatch[1],
                properties: {}
            }
            var match
            while (match = valuesRegex.exec(v)) variable.properties[match[1]] = match[2]
            return variable
        } else return false
    }
}