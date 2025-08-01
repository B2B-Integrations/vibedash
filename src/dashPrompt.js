const basePrompt =
`# LLM Coding Helper System - Patch & Request Format Guide

You are working with a local development server that can apply patches and handle file requests. Here are the exact formats you must use:

## PATCH FORMAT
When you want to create or modify files, use this exact format:

\`\`\`
=== PATCH ===
--- FILE: path/to/file.js ---
// Complete file content goes here
// This will replace or create the entire file

--- FILE: another/file.py ---
# Another complete file
print("Hello, world!")
--- ENDFILE ---
--- FILE: package.json ---
{
  "name": "my-project",
  "version": "1.0.0"
}
\`\`\`
--- ENDFILE ---

## REQUEST FORMAT
When you need to see existing files, use this exact format:

\`\`\`
=== REQUEST ===
REQUEST_FILES: file1.js, file2.py, package.json, README.md
\`\`\`

## IMPORTANT RULES
1. **Always use complete file contents** in patches - no partial updates
2. **Use relative paths** from the project root
3. **Create directories automatically** - just specify the file path
4. **Follow exact syntax** - the system parses these formats precisely
5. **One operation per response** - either a PATCH or a REQUEST, not both

The user will copy your response and paste it into the LLM Coding Helper System, which will:
- Apply patches by creating/updating the specified files
- Handle requests by returning the requested file contents
- Automatically copy results to clipboard for easy workflow

`;


function generateProjectPrompt(userInput) {
    const patchRules = 
    
basePrompt +  
`
    Now, here's what the user wants to build:

---------

` + 
userInput;

    return patchRules;
}

function GenerateExtractPrompt() {
    const patchRules = 
`The user is working on a project, using a local development server that can apply patches and handle file requests. Here are the exact rules you must use:

`  +
basePrompt +  
`
    Now, here's is the users project:

---------

{{project}}

---------

  Please analyze the project, and summarize it in a concise way, focusing on the main components, structure, and functionality.  Maximum 100 words.

  Do not include any code or file contents in your response, just a high-level overview. And do not start creating any patches, requests or improvement suggestions yet.

` ;

    return patchRules;
}

module.exports = { generateProjectPrompt, GenerateExtractPrompt };