# Vibedash
Vibe Coding front-end utility

This is a NodeJS program to simplify vibe coding while keeping it mostly AI and language agnostic.
Vibe Coding, is the term for letting the AI do most of the coding work for you.

For the purpose of this documentation, I use Claude as an example AI/LLM.  This is because I have used it mostly with Claude.

## Installation:
1. Check if you are Linux or Windows
2. Clone the GIT repository into a folder that is easy to reach.
3. install acorn (cd vibedash; npm install acorn)

For Linux
4. Make sure the dash batch file has execute rights. (use the chmod 7?? dash command)

For Windows
4. There is no batch command for Windows, but you can use Vibedash by running the node command directly

## Starting:
To use Vibedash, follow the below steps:
1. Install Vibedash (Notice, it only has a startup script for Linux for now, but you can easily make one for Windows)
3. Open a shell, and go to your nodejs project (e.g cd YOUR_PROJECT_FOLDER)
4. Linux: Type <PATH-TO-VIBEDASH>/dash start
4. Windows: Type node <PATH-TO-VIBEDASH>/src/dash.js <YOUR_PROJECT_FOLDER>
5. Now there should be a message on what port it is listening. Default is port 3000

## The GUI
Open the browser to the correct port.  Example: http://localhost:3000
If you have a small project, you will start with "Extract Project to Clipboard" and paste it directly into Claude.
After this, you can ask Claude to analyse your project, or make "patches" to your project.

## The main workflow
1. Extract Project (or interface) to Clipboard
2. Paste into Claude
3. Discuss with Claude a bug or feature you want
4. Ask Claude to make a Patch for it
5. Paste the patch into Vibedash
6. Test you change
7. Accept the change, or revert it
8. Goto step 3 to add more features

## The backups
Each time you ask Claude to make a patch for you, your project is changed.  Files are added or modified.
But since this can break your project, if or when Claude makes a mistake, you have a safetynet. 
Before each change, Vibedash makes a before-this-patch-backup
You can restore from the GUI the state before the patch.  Just find the latest pre-patch-backup, and click restore
IMPORTANT: You will be wise to use git or some other vcs tool to commit changes, and not only rely on Vibedash.

## The file browser
In the file browser, you can see the files Vibedash can see.  By default it is all files in your project folder.
This is what Claude can work with.  You can exclude files, by making a .llmignore file.
When you edit you .llmignore file, just press "Reload .llmignore", and check the filebrowser to see if your changes got affected as you wanted.

## Creating a new project
Use the "New project Prompt" text field to describe your project.
Then press Vibedash to create a LLM prompt, that explains Claude the rules Vibedash expects, and the project.
Claude will then create a patch for you, which you can paste into VibeDash, and then you can start testing your first iteration.

## Language support
Currently only Javascript.
However you also can do other languages, but then the "Extract Interface to Clipboard" feature won't work.

## Extract Interface to Clipboard
This feature allows you to work on really large projects. It will use acorn, to find out the function and class interfaces, and pass them to the clipboard, instead of 
sending all code to Claude.

## AI support
In theory all LLMs can be used with this, but so far I only found Claude capable enough, to not forget the commands and syntax that Vibedash needs.









