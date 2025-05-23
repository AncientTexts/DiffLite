// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as simpleGit from 'simple-git';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "difflite" is now active!');

	// Create a status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.text = 'Loading changes...';
	statusBarItem.show();

	// Function to update the status bar with line changes
	async function updateLineChanges() {
		try {
			const git = simpleGit();
			const diffSummary = await git.diffSummary();

			const added = diffSummary.insertions;
			const deleted = diffSummary.deletions;

			statusBarItem.text = `+${added} -${deleted} lines`;
		} catch (error) {
			console.error('Error fetching git diff:', error);
			statusBarItem.text = 'Error fetching changes';
		}
	}

	// Update line changes on activation
	updateLineChanges();

	// Register the command to manually refresh line changes
	const disposable = vscode.commands.registerCommand('difflite.showLineChanges', () => {
		updateLineChanges();
		vscode.window.showInformationMessage('Line changes updated!');
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(statusBarItem);
}

// This method is called when your extension is deactivated
export function deactivate() {}
