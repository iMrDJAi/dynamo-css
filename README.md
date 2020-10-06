***
# dynamo-css 
[![npm](https://img.shields.io/npm/v/dynamo-css?color=red)](https://www.npmjs.com/package/dynamo-css)

Make your css variables more dynamic and relative with dynamo-css!
***

## Table of Contents
-   [Introduction](#introduction)
-   [Demo](#demo)
-   [Installation](#installation)
-   [Usage](#usage)
-   [Examples](#examples)
-   [Limitations](#limitations)
-   [Notes](#notes)
-   [License](#license)

## Introduction
### What's That?
> CSS variables (or css custom properties) are so limited, and this should change!  
That's why **dynamo-css** exists, it aims to make them more dynamic, relative and useful for theming.  
This library powers css variables with javascript, it basically gives more control over their values.
### How Does it Work?
> The system scans the whole document (including nested shadow roots) to extract used css variables from every stylesheet, style tag and style attribute, it also uses mutation observers and modified prototypes to listen for new ones.  
Then it executes registered functions (created by user) on them to set values upon user needs, these functions get executed automatically when a new css variable found, or when a used relative css variable get updated.

## Demo
Working on it! it will be available soon..

## Installation
### NPM:
Use this command to install the node module:
```shell
$ npm i dynamo-css --save
```
Then simply require it:
```js
import DynamoCSS from 'dynamo-css'
//or
const DynamoCSS = require('dynamo-css')
```
Then bundle it with Webpack, Rollup or any javascript module bundler you prefer.
### Browser:
A bundled version is available and ready to use directly on browsers, you can get it from  [JsDeliver CDN](https://cdn.jsdelivr.net/gh/iMrDJAi/dynamo-css/dist/bundle.js):
```html
<script src='https://cdn.jsdelivr.net/gh/iMrDJAi/dynamo-css/dist/bundle.js'></script>
```
You can also download it for local use:
```
📄index.html
📁js
 ↳ 📄bundle.js
```
```html
<script src='./js/bundle.js'></script>
```
It will be declared as `window.DynamoCSS`:
```js
const DynamoCSS = window.DynamoCSS
```

## Usage
### Initialization
Create a new instance of `DynamoCSS` **once**:
```js
var dc = new DynamoCSS()
```
Let's take a look on methods and properties that we have:
| name | description |
|:--:|:--:|
| variables | An array of css variables that found inside the document and its nested shadow roots |
| functions | An array of user registered functions that process the css variables |
| registerFunction | A method to register functions |
| unregisterFunction | A method to unregister functions |
| getVariable | Get css variable value |
| setVariable | Set css variable value |
| scan  | Manually scan a parent (Document, ShadowRoot or Element) for css variables |
| execute | Manually execute a registered function on a css variable  |
| parseVariable | A css variables parser follows a special format |
### registerFunction(id: string, fun: function)
To process css variables, you have to register your own custom functions to the system, each one should have a unique ID, here is an example:

**To register a function:**
```js
var fun = dc.registerFunction('cardHeight', (v, setValue, getVariable) => {
    if (v === "--card-height") {
        var width = getVariable('--card-width') // => 500px
        var height = + width.slice(0, -2) / 2 + "px" // => 250px
        setValue(height)
    }
}) // => Function
```
**Function parameters:**
| name | description |
|:--:|:--:|
| v | The css variable string |
| setValue | Set the value of the passed css variable|
| getVariable | Get a css variable value relatively |

**To see which relative variables used by the function (returned from `getVariable()`):**  
**Note:** The system uses this array to execute the function again when a relative variable get updated.
```js
fun.relativeVariables // => ["--card-width"]
```
**To see which variables the function got executed on:**  
**Note:** The system uses this array to make sure to execute every function on every variable once only.
```js
fun.executedVariables // => Array
```
**To unregister a function:**  
**Note:** This will completely remove that function.
```js
fun.unregister() // => true
```
**To override a function:**  
**Note:** This will remove the existing values inside `fun.relativeVariables` and `fun.executedVariables`.
```js
fun = dc.registerFunction('cardHeight', (v, setValue, getVariable) => {
    if (v === "--card-height") {
        var width = getVariable('--card-width') // => 500px
        var height = + width.slice(0, -2) * 2 + "px" // => 1000px
        setValue(height)
    }
}) // => Function
```
### unregisterFunction(id: string)
This is an alternative way to unregister a function, you have to pass that function ID as a parameter:
```js
dc.unregisterFunction('cardHeight') // => true
```
### getVariable(cssVariable: string)
Use this one to get a value of a css variable of your choice.  
Unless you want to keep your variable relative, you can use this one inside a function to keep it static.  
The function won't get executed again when the variable get updated.
```js
dc.getVariable('--card-width') // => 500px
```
### setVariable(cssVariable: string, value: string)
Use this one to set the value of a css variable:  
```js
dc.setVariable('--card-width', '400px') // => true
```
### scan(parent: Document|ShadowRoot|Element)
Scan a parent (Document, ShadowRoot or Element) to find out more css variables.  
Useful when adding style using a way cannot be detected by the system (see [Limitations](#limitations)).
```js
dc.scan(document)
```
### execute(fun: function, cssVariable: string)
Execute a registered function on a css variable manually, this can be useful for more advanced use cases:
```js
dc.execute(fun, '--container-width')
```
### parseVariable(cssVariable: string)
A css variables parser follows a special format works with Regex.  
It's made to keep processing css variables simpler and faster.

**Format:**
```css
--var-name_key1--value1_key2--value2_key3--value3...
```
**Output:**
```js
{
    name: "var-name",
    string: "--var-name_value1--prop1_value2--prop2_value3--prop3",
    properties: {
        key1: "value1",
        key2: "value2",
        key3: "value3"
    }
}
```
**To keep it clear, just imagine it like that:**
```css
--var-name|key1:value1|key2:value2|key3:value3...
```
**Example:**
```js
dc.registerFunction('color', (v, setValue, getVariable) => {
    //v => --color_hex--ef1
    var variable = dc.parseVariable(v)
    var colorHexRegex = /^[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3}$/
    if (variable && variable.name === 'color') {
        if (variable.properties.hex && variable.properties.hex.match(colorHexRegex)) {
            setValue("#" + variable.properties.hex) // => #ef1
        }
    }
})
```

## Examples
### Custom Colors:
Let's say we have an element, with a blurple background color:
```css
.element {
    background-color: blurple;
}
```
But wait.. blurple is a custom color, this will not gonna work.  
Well, this one will work:
```css
.element {
    background-color: var(--blurple);
}
```
This is a css variable, it should have a value with the correct color hex code, right?  
True! it's **dynamo-css** time:
```js
dc.registerFunction('blurple', (v, setValue, getVariable) => {
    if (v === "--blurple") setValue("#7289DA") 
})
```
Done! it works like a charm!
### More Examples Will Be Added Soon...

## Limitations
- The system cannot access to style loaded from a cross domain.
- The system cannot access to style added by browser dev-tool (execpt if added to an element style attribute).
- Currently, the system doesn't listen to new added or updated LINK tags at all, this will be added in future.
- Currently, the system only defines css variables at `:root`, custom selectors will be added in future.

## Notes
Hey! don't forget to star ⭐ this project 😅!

## License
[MIT](https://github.com/iMrDJAi/dynamo-css/blob/master/LICENSE) © [iMrDJAi](https://github.com/iMrDJAi)















