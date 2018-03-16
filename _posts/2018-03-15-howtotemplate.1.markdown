---
layout: post
title:  "How to write a template"
date:   2018-03-15 16:39:22 +0100
categories: jekyll update
---
The templating engine is [Mustache](https://mustache.github.io/), refer to Mustache's user manual. 

* Check `test/templates/simple-sns.yaml` for a fully documented how-to write a template
* Check `test/gtemplates/test-api-gateway/stack.tpl` to see how to load external files in the template

For large templates (over 5 mb) it is possible to upload the stack generated to S3 by adding the property `Metadata.aws.template.__use_s3=bucket` . See `test/templates/simple-sns-s3-live.yaml`