const acorn = require("acorn");
const fs = require("fs");

/**
 * Extracts the signatures of exported objects and class methods from a JavaScript file.
 * @param {string} filePath - The path to the JavaScript file.
 * @returns {Object} An object containing arrays of exported functions, classes, other entities, and class methods with their signatures.
 */
function extractExportedSignatures(filePath) {
    let code = fs.readFileSync(filePath, "utf8");

    // Remove shebang if present
    if (code.startsWith('#!')) {
        code = code.substring(code.indexOf('\n') + 1);
    }

    let exports = {
        functions: [],
        classes: [],
        others: [],
        classMethods: {}
    };

    try {
        const ast = acorn.parse(code, {
            ecmaVersion: 2020,
            sourceType: "script",
        });

        function findTopLevelReturnValue(bodyNodes) {
            let returnValue = "no return value";
            for (let i = bodyNodes.length - 1; i >= 0; i--) {
                const node = bodyNodes[i];
                if (node.type === "ReturnStatement") {
                    if (node.argument) {
                        if (node.argument.type === "Identifier") {
                            returnValue = node.argument.name;
                        } else {
                            returnValue = "unnamed return value";
                        }
                    }
                    break;
                }
            }
            return returnValue;
        }

        function traverse(node) {
            if (node.type === "ClassDeclaration") {
                const className = node.id.name;
                exports.classes.push(className);
                exports.classMethods[className] = [];

                node.body.body.forEach(method => {
                    if (method.type === "MethodDefinition" && method.kind === "method") {
                        const params = method.value.params.map(param => {
                            return param.type === "Identifier" ? param.name : "complex";
                        }).join(", ");

                        let returnValue = "no return value";
                        if (method.value.body && method.value.body.type === "BlockStatement") {
                            returnValue = findTopLevelReturnValue(method.value.body.body);
                        }

                        exports.classMethods[className].push({
                            name: method.key.name,
                            signature: `${method.key.name}(${params})`,
                            returns: returnValue
                        });
                    }
                });
            }

            // Check for module.exports pattern
            if (node.type === "ExpressionStatement" && node.expression.type === "AssignmentExpression") {
                if (node.expression.left.type === "MemberExpression" &&
                    node.expression.left.object.type === "Identifier" &&
                    node.expression.left.object.name === "module" &&
                    node.expression.left.property.type === "Identifier" &&
                    node.expression.left.property.name === "exports") {

                    if (node.expression.right.type === "ObjectExpression") {
                        node.expression.right.properties.forEach(prop => {
                            if (prop.type === "Property" && prop.key.type === "Identifier") {
                                exports.others.push(prop.key.name);
                            }
                        });
                    }
                }
            }

            // Recursively traverse child nodes
            for (let key in node) {
                if (node.hasOwnProperty(key) && typeof node[key] === "object" && node[key] !== null) {
                    if (Array.isArray(node[key])) {
                        node[key].forEach(traverse);
                    } else {
                        traverse(node[key]);
                    }
                }
            }
        }

        traverse(ast);
    } catch (e) {
        console.error("Error parsing the file:", e);
    }

    return exports;
}

/**
 * Formats the extracted signatures into a human-readable format suitable for language models.
 * @param {Object} signatures - The object containing extracted signatures.
 * @returns {string} A formatted string describing the extracted signatures.
 */
function formatForLLM(signatures) {
    let formattedOutput = "";

    formattedOutput += "Exported Functions:\n";
    if (signatures.functions.length === 0) {
        formattedOutput += "- None\n";
    } else {
        signatures.functions.forEach(func => {
            formattedOutput += `- ${func}\n`;
        });
    }

    formattedOutput += "\nExported Classes:\n";
    if (signatures.classes.length === 0) {
        formattedOutput += "- None\n";
    } else {
        signatures.classes.forEach(cls => {
            formattedOutput += `- ${cls}\n`;
        });
    }

    formattedOutput += "\nOther Exports:\n";
    if (signatures.others.length === 0) {
        formattedOutput += "- None\n";
    } else {
        signatures.others.forEach(other => {
            formattedOutput += `- ${other}\n`;
        });
    }

    formattedOutput += "\nClass Methods:\n";
    if (Object.keys(signatures.classMethods).length === 0) {
        formattedOutput += "- None\n";
    } else {
        for (const [className, methods] of Object.entries(signatures.classMethods)) {
            formattedOutput += `Class: ${className}\n`;
            methods.forEach(method => {
                formattedOutput += `- ${method.signature}\n`;
                formattedOutput += `  Returns: ${method.returns}\n`;
            });
        }
    }

    return formattedOutput;
}

// Check if the script is run directly and if a command-line argument is provided
if (require.main === module) {
    const filePath = process.argv[2];
    if (filePath) {
        const exportedSignatures = extractExportedSignatures(filePath);
        const formattedOutput = formatForLLM(exportedSignatures);
        console.log(formattedOutput);
    } else {
        console.log("Please provide a file path as a command-line argument.");
    }
}


module.exports = { formatForLLM, extractExportedSignatures };