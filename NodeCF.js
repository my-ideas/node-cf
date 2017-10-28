const fs = require('fs');
const Promise = require("bluebird");
const Mustache = require("mustache")

const readFile = Promise.promisify(require("fs").readFile);
const exec = Promise.promisify(require('child_process').exec);
const writeFile = Promise.promisify(require('fs').writeFile);
const AWS = require('aws-sdk');
const os = require('os');
const path = require('path');


/**
 *
 * @param options {object} Config object
 * @param options.inputFile {string} Patht the file with the template to use as input
 * @param options.action {string} Can be "createStack" or "updateStack"
 * @param options.dryRun {boolean} default TRUE. Call AWS CLoudFormation only if set to false
 * @param options.aws_profile {string} The profile to use for AWS service calls
 * @constructor
 */
function NodeCF(options) {
    this.options = options;


    /*
     readFile() --> ritorna {contents, metadata}
     loadExternals()
     render()
     saveToTemp()
     createCf()

     */
}

/**
 * Read the input files and return the template generated by mustache
 */
NodeCF.prototype.buildTemplate = function () {
    return this
        .readFileJson(this.options.inputFile)
        .then(data => {return this.loadExternals(this.options.inputFile, data)})
        .then(this.render)
};

/**
 * Credentials are taken (in order, )
 * - this.aws_profile (http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html)
 *
 * The stack name is
 * - the name of the folder that contains the template, or
 * - Metadata.aws.template.name
 *
 * Currently a template can't be larger than 51kB
 *
 * @param template {String} The rendered template
 */
NodeCF.prototype.saveToCloudFormation = function(template) {
    if(this.options.aws_profile) {
        AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: this.options.aws_profile});
    }

    const templateMeta = JSON.parse(template).Metadata;
    const StackName =  templateMeta.aws.template.name || path.dirname(templateFile).split(path.sep).pop().match(/(?=[a-z]).*/)[0];
    let Capabilities = [];
    const TemplateBody = template;

    if(templateMeta.aws.capabilities && typeof templateMeta.aws.capabilities === 'string'){
        Capabilities = [templateMeta.aws.capabilities]
    }

    return new AWS.CloudFormation({ region: templateMeta.aws.region })[this.options.action]({
        StackName,
        Capabilities,
        TemplateBody
    }).promise();
};

/**
 *
 * @param template {string} The template
 * @return {Promise.<{template: string the template, tempFile: string path to the temp file}>}
 */
NodeCF.prototype.saveTempalteToTempFile = function(template){
    const tempFile = [os.tmpdir(), path.sep, new Date().getTime(), '_template'].join('');

    console.log(`Template rendered in ${tempFile}`);
    return writeFile(tempFile, template, 'utf-8')
        .then(data => {
            return {template, tempFile}
        });
};

/**
 * Data object
 * @typedef {Object} Metacontent
 * @property {Object} metadata The template view object
 * @property {String} content The template
 */

/**
 * Parse a file in JSON
 * @param templateFile {String} Path to the template
 * @return {Promise.<Metacontent>}
 */
NodeCF.prototype.readFileJson = function (templateFile) {

    return readFile(templateFile, 'utf-8')
        .then(contents => {

            let index = contents.search(/"Metadata":\s*/) + 10;  // First { after Metadata
            let buffer = [];
            let bracketCounter = 0;
            let char = '';

            do {
                char = contents.charAt(++index);

                buffer.push(char);
                if (char === '{') {
                    bracketCounter++;
                }
                else if (char === '}') {
                    bracketCounter--;
                }

            } while ((bracketCounter !== 0) || (bracketCounter === 0 && char === ' '));

            let dd = buffer.join('');
            let metadata;

            try {
                console.log(dd);
                metadata = JSON.parse(dd);
            }
            catch (err) {
                console.log("********* ERROR *********");
                console.log("Please check this json:");
                console.log(dd);
                throw err;
            }

            return {
                metadata,
                contents
            };
        });

};

/**
 *
 * @param templateFile
 * @param data {Metacontent}
 * @return {Promise.<Metacontent>} Where the metadata keys have been loaded withexternal contents
 */
NodeCF.prototype.loadExternals = function(templateFile, data){
    const {metadata, contents} = data;

    if(!metadata.aws.__external){
        return data;
    }

    // Grab the base path to the externals
    let temp = templateFile.split('/');
    temp.splice(-1,1);
    const basePath = temp.join('/');

    let extern = [];

    Object.keys(metadata.aws.__external).map(key => {
        const externalFile = `${basePath}/${metadata.aws.__external[key]}`;
        console.log(`Loading external from ${externalFile}`);
        extern.push(
            readFile(externalFile, 'utf-8').then(externalcontents => { return {key, externalcontents} })
        )
    });

    return Promise.all(extern).then(aContents => {
        aContents.forEach(ext => { metadata.aws.template[ext.key] = ext.externalcontents; });
        return {metadata, contents};
    });
};


/**
 * Apply the view to the template, returning the rendered template
 * @param data {Metacontent}
 * @return {Promise.<String>} The final template
 */
NodeCF.prototype.render = function(data) {
    return new Promise((resolve, reject) => {
        const {metadata, contents} = data;
        resolve(Mustache.render(contents,metadata.aws.template));
    });
};

module.exports = NodeCF;
