---
layout: default
title:  "Custom functions"
date:   2018-03-15 16:39:22 +0100
categories: jekyll update
---
The following functions can be used inside a template:
* `{% raw %}{{funcTime}}{% endraw %}`: returns the value of `new Date().getTime()` - @see `simple-sns-function.yaml`
* `{% raw %}{{#jsonize}}a.key{{/jsonize}}{% endraw %}`: Return the json representation of the given key - @see `test-simple-functions.json`
* `{% raw %}{{#jsonizeEscapeQuotes}}a.key{{/jsonizeEscapeQuotes}}{% endraw %}`: serialize object `a.key` in JSON and escape all the quotes (which means, convert the object in a string that you can include in other strings. @see `/test/templates/test-api-gateway/stack-functions.tpl`)

Notes:
* The name of the stack is in the template metadata